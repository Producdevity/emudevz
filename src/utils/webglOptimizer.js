import { isAndroid, isIOS, isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class WebGLOptimizer {
	constructor() {
		this.isSupported = this.checkWebGLSupport();
		this.context = null;
		this.extensions = {};
		this.capabilities = {};
		this.performanceMode = "auto";
		this.frameRate = 60;
		this.frameTime = 1000 / this.frameRate;
		this.lastFrameTime = 0;
		this.frameCount = 0;
		this.fpsHistory = [];
		this.maxFPSHistory = 60;

		if (this.isSupported) {
			this.init();
		}
	}

	checkWebGLSupport() {
		try {
			const canvas = document.createElement("canvas");
			const gl =
				canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			return !!gl;
		} catch (e) {
			return false;
		}
	}

	init() {
		this.createContext();
		this.detectCapabilities();
		this.setupPerformanceMonitoring();
		this.applyOptimizations();
	}

	createContext() {
		const canvas = document.createElement("canvas");
		const contextAttributes = {
			alpha: false,
			antialias: !isMobile(), // Disable antialiasing on mobile for performance
			depth: true,
			stencil: false,
			preserveDrawingBuffer: false,
			premultipliedAlpha: false,
			failIfMajorPerformanceCaveat: true,
			powerPreference: isMobile() ? "low-power" : "high-performance",
			desynchronized: isMobile(), // Enable desynchronized for better latency on mobile
		};

		this.context =
			canvas.getContext("webgl2", contextAttributes) ||
			canvas.getContext("webgl", contextAttributes);
	}

	detectCapabilities() {
		if (!this.context) return;

		const gl = this.context;

		this.capabilities = {
			version: gl.getParameter(gl.VERSION),
			vendor: gl.getParameter(gl.VENDOR),
			renderer: gl.getParameter(gl.RENDERER),
			maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
			maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
			maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
			maxFragmentUniformVectors: gl.getParameter(
				gl.MAX_FRAGMENT_UNIFORM_VECTORS
			),
			maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
			maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
			aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
			aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
			maxTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
			maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
			maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
		};

		// Detect extensions
		this.detectExtensions();

		// Detect mobile GPU
		this.detectMobileGPU();
	}

	detectExtensions() {
		const gl = this.context;
		const extensionNames = [
			"ANGLE_instanced_arrays",
			"EXT_blend_minmax",
			"EXT_texture_filter_anisotropic",
			"EXT_frag_depth",
			"EXT_shader_texture_lod",
			"EXT_sRGB",
			"OES_element_index_uint",
			"OES_standard_derivatives",
			"OES_texture_float",
			"OES_texture_float_linear",
			"OES_texture_half_float",
			"OES_texture_half_float_linear",
			"OES_vertex_array_object",
			"WEBGL_compressed_texture_s3tc",
			"WEBGL_depth_texture",
			"WEBGL_draw_buffers",
			"WEBGL_lose_context",
			"WEBGL_compressed_texture_pvrtc",
			"WEBGL_compressed_texture_etc1",
			"WEBGL_compressed_texture_astc",
		];

		extensionNames.forEach((name) => {
			const ext = gl.getExtension(name);
			if (ext) {
				this.extensions[name] = ext;
			}
		});
	}

	detectMobileGPU() {
		const renderer = this.capabilities.renderer.toLowerCase();

		// Detect common mobile GPUs
		if (renderer.includes("adreno")) {
			this.capabilities.gpuFamily = "adreno";
			this.capabilities.isMobile = true;
		} else if (renderer.includes("mali")) {
			this.capabilities.gpuFamily = "mali";
			this.capabilities.isMobile = true;
		} else if (renderer.includes("powervr")) {
			this.capabilities.gpuFamily = "powervr";
			this.capabilities.isMobile = true;
		} else if (renderer.includes("tegra")) {
			this.capabilities.gpuFamily = "tegra";
			this.capabilities.isMobile = true;
		} else if (renderer.includes("apple")) {
			this.capabilities.gpuFamily = "apple";
			this.capabilities.isMobile = isIOS();
		} else {
			this.capabilities.gpuFamily = "desktop";
			this.capabilities.isMobile = false;
		}
	}

	setupPerformanceMonitoring() {
		// Monitor frame rate
		const monitorFrame = (currentTime) => {
			if (this.lastFrameTime > 0) {
				const deltaTime = currentTime - this.lastFrameTime;
				const fps = 1000 / deltaTime;

				this.fpsHistory.push(fps);
				if (this.fpsHistory.length > this.maxFPSHistory) {
					this.fpsHistory.shift();
				}

				// Adjust quality based on performance
				if (this.frameCount % 60 === 0) {
					// Check every second
					this.adjustQualityBasedOnPerformance();
				}
			}

			this.lastFrameTime = currentTime;
			this.frameCount++;

			requestAnimationFrame(monitorFrame);
		};

		requestAnimationFrame(monitorFrame);
	}

	adjustQualityBasedOnPerformance() {
		const avgFPS =
			this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

		if (avgFPS < 30 && this.performanceMode !== "low") {
			this.setPerformanceMode("low");
			trackMobileEvent("webgl_quality_decreased", { avgFPS });
		} else if (avgFPS > 50 && this.performanceMode !== "high") {
			this.setPerformanceMode("high");
			trackMobileEvent("webgl_quality_increased", { avgFPS });
		}
	}

	applyOptimizations() {
		if (!this.context) return;

		const gl = this.context;

		// Mobile-specific optimizations
		if (isMobile()) {
			// Reduce texture quality
			gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);

			// Disable dithering
			gl.disable(gl.DITHER);

			// Set lower precision hints
			if (gl.getShaderPrecisionFormat) {
				// Use medium precision for better performance on mobile
				gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT_OES, gl.FASTEST);
			}

			// Optimize for mobile GPUs
			this.optimizeForMobileGPU();
		}

		// Enable common optimizations
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		// Clear color to black
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	optimizeForMobileGPU() {
		const gl = this.context;

		switch (this.capabilities.gpuFamily) {
			case "adreno":
				// Adreno GPUs benefit from reduced texture bandwidth
				this.optimizeForAdreno();
				break;
			case "mali":
				// Mali GPUs benefit from reduced fill rate
				this.optimizeForMali();
				break;
			case "powervr":
				// PowerVR GPUs benefit from optimized tile rendering
				this.optimizeForPowerVR();
				break;
			case "apple":
				// Apple GPUs have specific optimizations
				this.optimizeForApple();
				break;
			default:
				// Generic mobile optimizations
				this.optimizeGenericMobile();
				break;
		}
	}

	optimizeForAdreno() {
		// Adreno GPUs: Reduce texture bandwidth
		const gl = this.context;

		// Use compressed textures if available
		if (this.extensions.WEBGL_compressed_texture_astc) {
			this.useCompressedTextures("ASTC");
		} else if (this.extensions.WEBGL_compressed_texture_etc1) {
			this.useCompressedTextures("ETC1");
		}

		// Reduce texture resolution
		this.setTextureResolutionScale(0.75);
	}

	optimizeForMali() {
		// Mali GPUs: Reduce fill rate
		const gl = this.context;

		// Enable early fragment tests
		gl.enable(gl.POLYGON_OFFSET_FILL);
		gl.polygonOffset(1.0, 1.0);

		// Use simpler shaders
		this.setShaderComplexity("low");
	}

	optimizeForPowerVR() {
		// PowerVR GPUs: Optimize for tile-based rendering
		const gl = this.context;

		// Keep render targets small
		this.setRenderScale(0.8);

		// Use deferred rendering if available
		if (this.extensions.WEBGL_draw_buffers) {
			this.enableDeferredRendering();
		}
	}

	optimizeForApple() {
		// Apple GPUs: Metal-specific optimizations
		const gl = this.context;

		// Use high-performance memory layout
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

		// Optimize for retina displays
		if (window.devicePixelRatio > 1) {
			this.setRenderScale(1 / window.devicePixelRatio);
		}
	}

	optimizeGenericMobile() {
		// Generic mobile optimizations
		this.setTextureResolutionScale(0.8);
		this.setRenderScale(0.9);
		this.setShaderComplexity("medium");
	}

	setPerformanceMode(mode) {
		this.performanceMode = mode;

		switch (mode) {
			case "low":
				this.setTextureResolutionScale(0.5);
				this.setRenderScale(0.7);
				this.setShaderComplexity("low");
				this.setFrameRate(30);
				break;
			case "medium":
				this.setTextureResolutionScale(0.75);
				this.setRenderScale(0.85);
				this.setShaderComplexity("medium");
				this.setFrameRate(45);
				break;
			case "high":
				this.setTextureResolutionScale(1.0);
				this.setRenderScale(1.0);
				this.setShaderComplexity("high");
				this.setFrameRate(60);
				break;
		}

		trackMobileEvent("webgl_performance_mode_changed", { mode });
	}

	setTextureResolutionScale(scale) {
		this.textureResolutionScale = scale;
		// Apply to existing textures
		this.updateTextureResolution();
	}

	setRenderScale(scale) {
		this.renderScale = scale;
		// Update canvas size
		this.updateCanvasSize();
	}

	setShaderComplexity(level) {
		this.shaderComplexity = level;
		// Reload shaders with appropriate complexity
		this.updateShaders();
	}

	setFrameRate(fps) {
		this.frameRate = fps;
		this.frameTime = 1000 / fps;
	}

	useCompressedTextures(format) {
		this.compressedTextureFormat = format;
		// Load compressed texture variants
		this.loadCompressedTextures();
	}

	enableDeferredRendering() {
		this.deferredRendering = true;
		// Setup deferred rendering pipeline
		this.setupDeferredPipeline();
	}

	updateTextureResolution() {
		// Implementation for updating texture resolution
		console.log(
			`Updating texture resolution to ${this.textureResolutionScale * 100}%`
		);
	}

	updateCanvasSize() {
		// Implementation for updating canvas size
		console.log(`Updating render scale to ${this.renderScale * 100}%`);
	}

	updateShaders() {
		// Implementation for updating shader complexity
		console.log(`Updating shader complexity to ${this.shaderComplexity}`);
	}

	loadCompressedTextures() {
		// Implementation for loading compressed textures
		console.log(
			`Loading compressed textures in ${this.compressedTextureFormat} format`
		);
	}

	setupDeferredPipeline() {
		// Implementation for deferred rendering
		console.log("Setting up deferred rendering pipeline");
	}

	// Public API for getting performance metrics
	getPerformanceMetrics() {
		const avgFPS =
			this.fpsHistory.length > 0
				? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
				: 0;

		return {
			currentFPS: avgFPS,
			frameCount: this.frameCount,
			performanceMode: this.performanceMode,
			capabilities: this.capabilities,
			extensions: Object.keys(this.extensions),
			textureResolutionScale: this.textureResolutionScale || 1.0,
			renderScale: this.renderScale || 1.0,
			shaderComplexity: this.shaderComplexity || "medium",
		};
	}

	// Optimize for specific scenarios
	optimizeFor2D() {
		if (!this.context) return;

		const gl = this.context;

		// Disable 3D-specific features
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);

		// Enable blending for 2D
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// Use orthographic projection
		this.useOrthographicProjection();
	}

	optimizeFor3D() {
		if (!this.context) return;

		const gl = this.context;

		// Enable 3D features
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);

		// Disable blending for opaque 3D
		gl.disable(gl.BLEND);

		// Use perspective projection
		this.usePerspectiveProjection();
	}

	useOrthographicProjection() {
		// Implementation for orthographic projection
		console.log("Using orthographic projection for 2D rendering");
	}

	usePerspectiveProjection() {
		// Implementation for perspective projection
		console.log("Using perspective projection for 3D rendering");
	}

	// Memory management
	cleanup() {
		if (this.context) {
			// Lose context to clean up resources
			const loseContext = this.extensions.WEBGL_lose_context;
			if (loseContext) {
				loseContext.loseContext();
			}
		}

		this.fpsHistory = [];
		this.frameCount = 0;
	}
}

// Get WebGL capabilities for device compatibility
export const getWebGLCapabilities = () => {
	const canvas = document.createElement("canvas");
	const gl =
		canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

	if (!gl) {
		return {
			supported: false,
			webgl2: false,
			extensions: [],
			capabilities: {},
			vendor: "Unknown",
			renderer: "Unknown",
			version: "Unknown",
		};
	}

	// Check WebGL2 support
	const gl2 = canvas.getContext("webgl2");

	// Get extensions
	const extensions = [];
	const extensionList = [
		"WEBGL_depth_texture",
		"OES_texture_float",
		"OES_texture_half_float",
		"WEBGL_lose_context",
		"OES_standard_derivatives",
		"OES_vertex_array_object",
		"WEBGL_draw_buffers",
		"OES_element_index_uint",
		"EXT_texture_filter_anisotropic",
		"WEBGL_compressed_texture_s3tc",
		"WEBGL_compressed_texture_etc1",
		"WEBGL_compressed_texture_pvrtc",
	];

	extensionList.forEach((ext) => {
		if (gl.getExtension(ext)) {
			extensions.push(ext);
		}
	});

	// Get capabilities
	const capabilities = {
		maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
		maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
		maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
		maxVertexTextureImageUnits: gl.getParameter(
			gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS
		),
		maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
		maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
		maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
		aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
		aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
		maxTextureMaxAnisotropy:
			gl.getParameter(gl.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1,
		maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
		maxCombinedTextureImageUnits: gl.getParameter(
			gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
		),
		maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
		maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS) || 1,
		maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS) || 1,
	};

	// Get debug info if available
	const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
	const vendor = debugInfo
		? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
		: gl.getParameter(gl.VENDOR);
	const renderer = debugInfo
		? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
		: gl.getParameter(gl.RENDERER);

	return {
		supported: true,
		webgl2: !!gl2,
		extensions,
		capabilities,
		vendor,
		renderer,
		version: gl.getParameter(gl.VERSION),
		shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
	};
};

// Create singleton instance
const webglOptimizer = new WebGLOptimizer();

export default webglOptimizer;
