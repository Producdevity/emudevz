import { isAndroid, isIOS, isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class CanvasOptimizer {
	constructor() {
		this.canvases = new Map();
		this.contexts = new Map();
		this.optimizations = this.detectOptimizations();
		this.performanceMetrics = {
			frameTime: 0,
			fps: 60,
			drawCalls: 0,
			textureMemory: 0,
			bufferMemory: 0,
		};
		this.frameCount = 0;
		this.lastFrameTime = 0;

		this.init();
	}

	detectOptimizations() {
		return {
			isMobile: isMobile(),
			isIOS: isIOS(),
			isAndroid: isAndroid(),
			supportsOffscreenCanvas: "OffscreenCanvas" in window,
			supportsWebGL2: this.checkWebGL2Support(),
			supportsImageBitmap: "createImageBitmap" in window,
			supportsRequestIdleCallback: "requestIdleCallback" in window,
			supportsWillReadFrequently:
				"willReadFrequently" in HTMLCanvasElement.prototype,
			gpuInfo: this.getGPUInfo(),
			memoryInfo: this.getMemoryInfo(),
		};
	}

	checkWebGL2Support() {
		try {
			const canvas = document.createElement("canvas");
			return !!canvas.getContext("webgl2");
		} catch (e) {
			return false;
		}
	}

	getGPUInfo() {
		const canvas = document.createElement("canvas");
		const gl =
			canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		if (!gl) return { type: "unknown", vendor: "unknown" };

		const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
		if (debugInfo) {
			return {
				type: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
				vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
			};
		}

		return { type: "unknown", vendor: "unknown" };
	}

	getMemoryInfo() {
		return {
			deviceMemory: navigator.deviceMemory || 4,
			hardwareConcurrency: navigator.hardwareConcurrency || 4,
			jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0,
			totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
			usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
		};
	}

	init() {
		// Setup performance monitoring
		this.setupPerformanceMonitoring();

		// Setup memory management
		this.setupMemoryManagement();

		// Setup canvas pooling
		this.setupCanvasPooling();
	}

	setupPerformanceMonitoring() {
		const measureFrame = (currentTime) => {
			if (this.lastFrameTime > 0) {
				const frameTime = currentTime - this.lastFrameTime;
				this.performanceMetrics.frameTime = frameTime;
				this.performanceMetrics.fps = 1000 / frameTime;
			}

			this.lastFrameTime = currentTime;
			this.frameCount++;

			// Reset draw calls counter
			this.performanceMetrics.drawCalls = 0;

			requestAnimationFrame(measureFrame);
		};

		requestAnimationFrame(measureFrame);
	}

	setupMemoryManagement() {
		// Monitor memory usage and clean up if needed
		setInterval(() => {
			if (performance.memory) {
				const usedMemory = performance.memory.usedJSHeapSize;
				const limit = performance.memory.jsHeapSizeLimit;
				const usage = usedMemory / limit;

				if (usage > 0.8) {
					this.performMemoryCleanup();
				}
			}
		}, 30000); // Check every 30 seconds
	}

	setupCanvasPooling() {
		this.canvasPool = [];
		this.maxPoolSize = isMobile() ? 5 : 10;
	}

	performMemoryCleanup() {
		// Clear unused canvases
		for (const [id, canvas] of this.canvases.entries()) {
			if (!canvas.isActive) {
				this.destroyCanvas(id);
			}
		}

		// Force garbage collection if available
		if (window.gc) {
			window.gc();
		}

		trackMobileEvent("canvas_memory_cleanup", {
			canvasesDestroyed: this.canvases.size,
		});
	}

	createCanvas(config = {}) {
		const canvasId = config.id || `canvas_${Date.now()}_${Math.random()}`;

		// Check if canvas already exists
		if (this.canvases.has(canvasId)) {
			return this.canvases.get(canvasId);
		}

		// Get canvas from pool or create new
		let canvas = this.getCanvasFromPool();
		if (!canvas) {
			canvas = document.createElement("canvas");
		}

		// Apply optimizations
		this.applyCanvasOptimizations(canvas, config);

		// Store canvas info
		const canvasInfo = {
			element: canvas,
			context: null,
			config,
			isActive: true,
			created: Date.now(),
			drawCalls: 0,
			lastUsed: Date.now(),
		};

		this.canvases.set(canvasId, canvasInfo);

		// Create context with optimizations
		const context = this.createOptimizedContext(canvas, config);
		if (context) {
			canvasInfo.context = context;
			this.contexts.set(canvasId, context);
		}

		trackMobileEvent("canvas_created", {
			id: canvasId,
			type: config.type || "2d",
			width: canvas.width,
			height: canvas.height,
		});

		return canvasInfo;
	}

	getCanvasFromPool() {
		return this.canvasPool.length > 0 ? this.canvasPool.pop() : null;
	}

	returnCanvasToPool(canvas) {
		if (this.canvasPool.length < this.maxPoolSize) {
			// Clear canvas
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}

			this.canvasPool.push(canvas);
		}
	}

	applyCanvasOptimizations(canvas, config) {
		// Set dimensions
		canvas.width = config.width || window.innerWidth;
		canvas.height = config.height || window.innerHeight;

		// Apply pixel ratio scaling for high-DPI displays
		if (config.highDPI !== false) {
			const dpr = window.devicePixelRatio || 1;
			const rect = canvas.getBoundingClientRect();

			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;

			// Scale back down for CSS
			canvas.style.width = rect.width + "px";
			canvas.style.height = rect.height + "px";
		}

		// Mobile-specific optimizations
		if (this.optimizations.isMobile) {
			// Disable image smoothing for pixel art on mobile
			if (config.pixelArt) {
				canvas.style.imageRendering = "crisp-edges";
				canvas.style.imageRendering = "pixelated";
			}

			// Optimize for touch interactions
			canvas.style.touchAction = "none";
		}

		// Add will-read-frequently hint if reading pixels often
		if (
			config.willReadFrequently &&
			this.optimizations.supportsWillReadFrequently
		) {
			canvas.willReadFrequently = true;
		}
	}

	createOptimizedContext(canvas, config) {
		const contextType = config.type || "2d";
		let context;

		if (contextType === "2d") {
			const contextAttributes = {
				alpha: config.alpha !== false,
				desynchronized: this.optimizations.isMobile,
				willReadFrequently: config.willReadFrequently,
			};

			context = canvas.getContext("2d", contextAttributes);

			if (context) {
				this.optimize2DContext(context, config);
			}
		} else if (contextType === "webgl" || contextType === "webgl2") {
			const contextAttributes = {
				alpha: config.alpha !== false,
				antialias: config.antialias !== false && !this.optimizations.isMobile,
				depth: config.depth !== false,
				stencil: config.stencil !== false,
				premultipliedAlpha: config.premultipliedAlpha !== false,
				preserveDrawingBuffer: config.preserveDrawingBuffer === true,
				powerPreference: this.optimizations.isMobile
					? "low-power"
					: "high-performance",
				failIfMajorPerformanceCaveat:
					config.failIfMajorPerformanceCaveat !== false,
				desynchronized: this.optimizations.isMobile,
			};

			context =
				canvas.getContext(contextType, contextAttributes) ||
				canvas.getContext("webgl", contextAttributes);

			if (context) {
				this.optimizeWebGLContext(context, config);
			}
		}

		return context;
	}

	optimize2DContext(context, config) {
		// Disable image smoothing for better performance on mobile
		if (this.optimizations.isMobile) {
			context.imageSmoothingEnabled = false;
		}

		// Set composite operation for better performance
		context.globalCompositeOperation = "source-over";

		// Disable shadows for better performance
		context.shadowBlur = 0;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;

		// Optimize text rendering
		if (config.textOptimized) {
			context.textBaseline = "top";
			context.textAlign = "left";
		}

		// Setup clipping regions for optimization
		if (config.clipping) {
			context.save();
			context.beginPath();
			context.rect(
				config.clipping.x,
				config.clipping.y,
				config.clipping.width,
				config.clipping.height
			);
			context.clip();
		}
	}

	optimizeWebGLContext(context, config) {
		// Enable common optimizations
		context.enable(context.CULL_FACE);
		context.cullFace(context.BACK);
		context.enable(context.DEPTH_TEST);
		context.depthFunc(context.LEQUAL);

		// Mobile-specific optimizations
		if (this.optimizations.isMobile) {
			// Disable dithering for better performance
			context.disable(context.DITHER);

			// Use fast mipmapping
			context.hint(context.GENERATE_MIPMAP_HINT, context.FASTEST);

			// Disable antialiasing for better performance
			if (config.antialias === false) {
				context.disable(context.MULTISAMPLE);
			}
		}

		// Set clear color
		context.clearColor(0.0, 0.0, 0.0, 1.0);
		context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
	}

	destroyCanvas(canvasId) {
		const canvasInfo = this.canvases.get(canvasId);
		if (!canvasInfo) return;

		// Return canvas to pool
		this.returnCanvasToPool(canvasInfo.element);

		// Clean up context
		if (canvasInfo.context) {
			// Lose WebGL context if applicable
			if (
				canvasInfo.context instanceof WebGLRenderingContext ||
				canvasInfo.context instanceof WebGL2RenderingContext
			) {
				const loseContext = canvasInfo.context.getExtension(
					"WEBGL_lose_context"
				);
				if (loseContext) {
					loseContext.loseContext();
				}
			}
		}

		// Remove from maps
		this.canvases.delete(canvasId);
		this.contexts.delete(canvasId);

		trackMobileEvent("canvas_destroyed", { id: canvasId });
	}

	renderCanvas(canvasId, renderFunction) {
		const canvasInfo = this.canvases.get(canvasId);
		if (!canvasInfo || !canvasInfo.context) return;

		const startTime = performance.now();

		// Update last used time
		canvasInfo.lastUsed = Date.now();

		// Execute render function
		renderFunction(canvasInfo.context, canvasInfo.element);

		// Update metrics
		canvasInfo.drawCalls++;
		this.performanceMetrics.drawCalls++;

		const renderTime = performance.now() - startTime;

		// Track slow renders
		if (renderTime > 16.67) {
			// > 60fps threshold
			trackMobileEvent("canvas_slow_render", {
				id: canvasId,
				renderTime,
				drawCalls: canvasInfo.drawCalls,
			});
		}
	}

	optimizeRendering(canvasId) {
		const canvasInfo = this.canvases.get(canvasId);
		if (!canvasInfo) return;

		const context = canvasInfo.context;
		if (!context) return;

		// 2D context optimizations
		if (context instanceof CanvasRenderingContext2D) {
			this.optimize2DRendering(context);
		}

		// WebGL context optimizations
		else if (
			context instanceof WebGLRenderingContext ||
			context instanceof WebGL2RenderingContext
		) {
			this.optimizeWebGLRendering(context);
		}
	}

	optimize2DRendering(context) {
		// Batch similar operations
		context.save();

		// Use requestAnimationFrame for smooth animations
		if (this.frameCount % 2 === 0) {
			// Reduce fill rate on mobile
			if (this.optimizations.isMobile) {
				context.globalAlpha = 0.95;
			}
		}

		context.restore();
	}

	optimizeWebGLRendering(context) {
		// Flush buffers
		context.flush();

		// Check for errors
		const error = context.getError();
		if (error !== context.NO_ERROR) {
			console.warn("WebGL error:", error);
		}
	}

	// Advanced optimizations
	createOffscreenCanvas(config) {
		if (!this.optimizations.supportsOffscreenCanvas) {
			return this.createCanvas(config);
		}

		const offscreen = new OffscreenCanvas(
			config.width || 256,
			config.height || 256
		);
		const context = offscreen.getContext("2d");

		return {
			element: offscreen,
			context,
			config,
			isOffscreen: true,
		};
	}

	async createImageBitmap(src, options = {}) {
		if (!this.optimizations.supportsImageBitmap) {
			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.src = src;
			});
		}

		try {
			return await createImageBitmap(src, {
				resizeWidth: options.width,
				resizeHeight: options.height,
				resizeQuality: this.optimizations.isMobile ? "low" : "medium",
				...options,
			});
		} catch (e) {
			// Fallback to regular image
			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.src = src;
			});
		}
	}

	// Performance monitoring
	getPerformanceMetrics() {
		return {
			...this.performanceMetrics,
			activeCanvases: this.canvases.size,
			pooledCanvases: this.canvasPool.length,
			memoryUsage: this.getMemoryInfo(),
		};
	}

	getCanvasInfo(canvasId) {
		return this.canvases.get(canvasId);
	}

	getAllCanvasInfo() {
		return Array.from(this.canvases.entries()).map(([id, info]) => ({
			id,
			...info,
		}));
	}

	// Utility methods
	clearCanvas(canvasId) {
		const canvasInfo = this.canvases.get(canvasId);
		if (!canvasInfo || !canvasInfo.context) return;

		const context = canvasInfo.context;
		const canvas = canvasInfo.element;

		if (context instanceof CanvasRenderingContext2D) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		} else if (
			context instanceof WebGLRenderingContext ||
			context instanceof WebGL2RenderingContext
		) {
			context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
		}
	}

	resizeCanvas(canvasId, width, height) {
		const canvasInfo = this.canvases.get(canvasId);
		if (!canvasInfo) return;

		const canvas = canvasInfo.element;
		canvas.width = width;
		canvas.height = height;

		// Reapply optimizations
		this.applyCanvasOptimizations(canvas, canvasInfo.config);
	}

	// Cleanup
	destroyAllCanvases() {
		for (const canvasId of this.canvases.keys()) {
			this.destroyCanvas(canvasId);
		}

		this.canvasPool = [];
	}
}

// Create singleton instance
const canvasOptimizer = new CanvasOptimizer();

export default canvasOptimizer;
