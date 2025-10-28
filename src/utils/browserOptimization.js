import { isAndroid, isChrome, isIOS, isSafari } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class BrowserOptimizer {
	constructor() {
		this.browser = this.detectBrowser();
		this.device = this.detectDevice();
		this.optimizations = this.getOptimizations();
		this.performanceMode = "auto";

		this.init();
	}

	detectBrowser() {
		const ua = navigator.userAgent;

		return {
			isSafari: isSafari(),
			isChrome: isChrome(),
			isFirefox: ua.includes("Firefox"),
			isEdge: ua.includes("Edge"),
			isSamsung: ua.includes("SamsungBrowser"),
			version: this.getBrowserVersion(ua),
			engine: this.getBrowserEngine(ua),
		};
	}

	detectDevice() {
		return {
			isIOS: isIOS(),
			isAndroid: isAndroid(),
			isLowEnd: this.isLowEndDevice(),
			memory: this.getMemoryInfo(),
			gpu: this.getGPUInfo(),
			screen: {
				width: window.screen.width,
				height: window.screen.height,
				pixelRatio: window.devicePixelRatio || 1,
			},
		};
	}

	getBrowserVersion(ua) {
		const match = ua.match(/(Chrome|Firefox| Safari| Edge)\/(\d+)/);
		return match ? parseInt(match[2]) : 0;
	}

	getBrowserEngine(ua) {
		if (ua.includes("WebKit")) return "WebKit";
		if (ua.includes("Gecko")) return "Gecko";
		if (ua.includes("Presto")) return "Presto";
		if (ua.includes("Trident")) return "Trident";
		return "Unknown";
	}

	isLowEndDevice() {
		// Heuristics to detect low-end devices
		const memory = navigator.deviceMemory || 4;
		const cores = navigator.hardwareConcurrency || 4;
		const pixelRatio = window.devicePixelRatio || 1;

		return memory <= 2 || cores <= 2 || pixelRatio >= 3;
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

	getGPUInfo() {
		const canvas = document.createElement("canvas");
		const gl =
			canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		if (!gl) return { vendor: "Unknown", renderer: "Unknown" };

		const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
		if (debugInfo) {
			return {
				vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
				renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
			};
		}

		return { vendor: "WebGL", renderer: "WebGL" };
	}

	getOptimizations() {
		const optimizations = {
			safari: {
				// Safari-specific optimizations
				viewportFix: true,
				touchEventOptimization: true,
				mediaLoadingOptimization: true,
				scrollOptimization: true,
				ios14Fix: this.browser.version >= 14,
				safari15Optimization: this.browser.version >= 15,
			},
			chrome: {
				// Chrome-specific optimizations
				webWorkersOptimization: true,
				serviceWorkerOptimization: true,
				backgroundSync: true,
				chrome92Optimization: this.browser.version >= 92,
			},
			ios: {
				// iOS-specific optimizations
				standaloneMode: this.isStandaloneMode(),
				viewportHeightFix: true,
				inputModeOptimization: true,
				safeAreaInsets: true,
				hapticFeedbackOptimization: true,
			},
			android: {
				// Android-specific optimizations
				backButtonHandling: true,
				permissionOptimization: true,
				downloadOptimization: true,
				fileSystemOptimization: true,
			},
			lowEnd: {
				// Low-end device optimizations
				reducedAnimations: true,
				lowerQualityRendering: true,
				aggressiveMemoryManagement: true,
				simplifiedUI: true,
			},
		};

		// Apply relevant optimizations based on detected browser/device
		const applied = {};

		if (this.browser.isSafari) Object.assign(applied, optimizations.safari);
		if (this.browser.isChrome) Object.assign(applied, optimizations.chrome);
		if (this.device.isIOS) Object.assign(applied, optimizations.ios);
		if (this.device.isAndroid) Object.assign(applied, optimizations.android);
		if (this.device.isLowEnd) Object.assign(applied, optimizations.lowEnd);

		return applied;
	}

	init() {
		this.applyViewportFixes();
		this.applyTouchOptimizations();
		this.applyPerformanceOptimizations();
		this.applyBrowserSpecificFixes();

		// Track browser info for analytics
		trackMobileEvent("browser_optimization_applied", {
			browser: this.browser,
			device: this.device,
			optimizations: Object.keys(this.optimizations),
		});
	}

	applyViewportFixes() {
		if (
			this.optimizations.viewportFix ||
			this.optimizations.viewportHeightFix
		) {
			// Fix viewport height issues on mobile browsers
			const setViewportHeight = () => {
				const vh = window.innerHeight * 0.01;
				document.documentElement.style.setProperty("--vh", `${vh}px`);
			};

			setViewportHeight();
			window.addEventListener("resize", setViewportHeight);
			window.addEventListener("orientationchange", () => {
				setTimeout(setViewportHeight, 100);
			});
		}

		if (this.optimizations.ios14Fix) {
			// Fix for iOS 14+ Safari bugs
			document.body.style.overscrollBehavior = "none";
		}
	}

	applyTouchOptimizations() {
		if (this.optimizations.touchEventOptimization) {
			// Optimize touch events for better performance
			document.addEventListener("touchstart", function () {}, {
				passive: true,
			});
			document.addEventListener("touchmove", function () {}, { passive: true });
		}

		if (this.optimizations.scrollOptimization) {
			// Optimize scrolling performance
			document.body.style.touchAction = "manipulation";
			document.body.style.webkitOverflowScrolling = "touch";
		}
	}

	applyPerformanceOptimizations() {
		if (this.optimizations.reducedAnimations) {
			// Reduce animations on low-end devices
			document.documentElement.style.setProperty(
				"--animation-duration",
				"0.1s"
			);
			document.documentElement.style.setProperty(
				"--transition-duration",
				"0.1s"
			);
		}

		if (this.optimizations.lowerQualityRendering) {
			// Lower rendering quality for better performance
			const canvas = document.querySelector("canvas");
			if (canvas) {
				canvas.style.imageRendering = "crisp-edges";
				canvas.style.imageRendering = "pixelated";
			}
		}

		if (this.optimizations.aggressiveMemoryManagement) {
			// Aggressive memory management
			setInterval(() => {
				if (performance.memory) {
					const used = performance.memory.usedJSHeapSize;
					const limit = performance.memory.jsHeapSizeLimit;

					if (used / limit > 0.8) {
						// Trigger garbage collection if available
						if (window.gc) {
							window.gc();
						}
					}
				}
			}, 30000); // Check every 30 seconds
		}
	}

	applyBrowserSpecificFixes() {
		// Safari-specific fixes
		if (this.browser.isSafari) {
			// Fix for 100vh issues in Safari
			if (this.optimizations.safari15Optimization) {
				document.body.style.height = "100vh";
				document.body.style.overflow = "hidden";
			}

			// Fix for audio autoplay in Safari
			document.addEventListener(
				"click",
				function initAudio() {
					// Create and play a silent audio to enable audio context
					const audio = new Audio(
						"data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAAAQAEAAEAfAAAQAQABAAgAZGF0YQAAAAA="
					);
					audio.play().catch(() => {});
					document.removeEventListener("click", initAudio);
				},
				{ once: true }
			);
		}

		// Chrome-specific optimizations
		if (this.browser.isChrome && this.optimizations.webWorkersOptimization) {
			// Enable web workers for heavy computations
			this.enableWebWorkers();
		}

		// iOS-specific fixes
		if (this.device.isIOS) {
			// Fix for input zoom on iOS
			const inputs = document.querySelectorAll("input, select, textarea");
			inputs.forEach((input) => {
				input.style.fontSize = "16px";
			});

			// Handle safe area insets
			if (this.optimizations.safeAreaInsets) {
				const root = document.documentElement;
				root.style.setProperty(
					"--safe-area-inset-top",
					"env(safe-area-inset-top)"
				);
				root.style.setProperty(
					"--safe-area-inset-bottom",
					"env(safe-area-inset-bottom)"
				);
				root.style.setProperty(
					"--safe-area-inset-left",
					"env(safe-area-inset-left)"
				);
				root.style.setProperty(
					"--safe-area-inset-right",
					"env(safe-area-inset-right)"
				);
			}
		}

		// Android-specific fixes
		if (this.device.isAndroid) {
			// Handle back button
			if (this.optimizations.backButtonHandling) {
				window.addEventListener("popstate", (event) => {
					if (event.state === null) {
						// Prevent default back button behavior
						history.pushState(null, null, location.href);
					}
				});
				history.pushState(null, null, location.href);
			}
		}
	}

	enableWebWorkers() {
		// Create web workers for background tasks
		if (window.Worker) {
			// Example: Create a worker for syntax highlighting
			const workerCode = `
				self.onmessage = function(e) {
					// Handle syntax highlighting in worker
					self.postMessage({ result: 'highlighted' });
				};
			`;

			const blob = new Blob([workerCode], { type: "application/javascript" });
			const worker = new Worker(URL.createObjectURL(blob));

			// Store worker reference for later use
			window.syntaxWorker = worker;
		}
	}

	isStandaloneMode() {
		return (
			window.matchMedia("(display-mode: standalone)").matches ||
			window.navigator.standalone === true ||
			document.referrer.includes("android-app://")
		);
	}

	// Public API for performance monitoring
	getPerformanceMetrics() {
		return {
			browser: this.browser,
			device: this.device,
			optimizations: this.optimizations,
			memory: this.getMemoryInfo(),
			performance: {
				timing: performance.timing,
				navigation: performance.navigation,
				paint: performance.getEntriesByType("paint"),
			},
		};
	}

	setPerformanceMode(mode) {
		this.performanceMode = mode;

		switch (mode) {
			case "performance":
				// Maximize performance
				document.documentElement.style.setProperty(
					"--animation-duration",
					"0s"
				);
				document.documentElement.style.setProperty(
					"--transition-duration",
					"0s"
				);
				break;
			case "balanced":
				// Balanced mode
				document.documentElement.style.setProperty(
					"--animation-duration",
					"0.2s"
				);
				document.documentElement.style.setProperty(
					"--transition-duration",
					"0.2s"
				);
				break;
			case "quality":
				// Maximize quality
				document.documentElement.style.setProperty(
					"--animation-duration",
					"0.3s"
				);
				document.documentElement.style.setProperty(
					"--transition-duration",
					"0.3s"
				);
				break;
		}

		trackMobileEvent("performance_mode_changed", { mode });
	}

	// Optimize media loading based on browser capabilities
	optimizeMediaLoading() {
		if (this.optimizations.mediaLoadingOptimization) {
			// Use intersection observer for lazy loading
			if ("IntersectionObserver" in window) {
				const imageObserver = new IntersectionObserver((entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							const img = entry.target;
							if (img.dataset.src) {
								img.src = img.dataset.src;
								img.removeAttribute("data-src");
								imageObserver.unobserve(img);
							}
						}
					});
				});

				// Observe all images with data-src
				document.querySelectorAll("img[data-src]").forEach((img) => {
					imageObserver.observe(img);
				});
			}
		}
	}
}

// Create singleton instance
const browserOptimizer = new BrowserOptimizer();

export default browserOptimizer;
