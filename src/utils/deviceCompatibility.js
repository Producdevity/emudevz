/**
 * Device Compatibility Layer
 * Adapts application behavior based on device capabilities and test results
 */
import { getAdaptiveQuality } from "./adaptiveQuality.js";
import { getDeviceInfo, isMobile } from "./mobile.js";
import { getPerformanceMetrics } from "./mobileAnalytics.js";
import mobileTestingSuite from "./mobileTesting.js";
import { getWebGLCapabilities } from "./webglOptimizer.js";

class DeviceCompatibilityLayer {
	constructor() {
		this.compatibilityProfile = null;
		this.adaptationRules = new Map();
		this.featureFlags = new Map();
		this.performanceProfile = null;
		this.isInitialized = false;
	}

	/**
	 * Initialize compatibility layer
	 */
	async initialize() {
		if (this.isInitialized) return this.compatibilityProfile;

		console.log("Initializing Device Compatibility Layer...");

		// Run comprehensive tests
		await mobileTestingSuite.initialize();
		const testResults = await mobileTestingSuite.runCompatibilityTests();

		// Create compatibility profile
		this.compatibilityProfile = this.createCompatibilityProfile(testResults);

		// Set up adaptation rules
		this.setupAdaptationRules();

		// Apply initial adaptations
		this.applyAdaptations();

		// Set up performance monitoring
		this.setupPerformanceMonitoring();

		this.isInitialized = true;
		console.log(
			"Device Compatibility Layer initialized:",
			this.compatibilityProfile
		);

		return this.compatibilityProfile;
	}

	/**
	 * Create compatibility profile from test results
	 */
	createCompatibilityProfile(testResults) {
		const deviceInfo = getDeviceInfo();
		const performance = getPerformanceMetrics();
		const webglCaps = getWebGLCapabilities();

		const profile = {
			// Device classification
			device: {
				type: this.getDeviceType(),
				class: this.getDeviceClass(performance),
				tier: this.getDeviceTier(performance, webglCaps),
				platform: deviceInfo.platform,
				browser: deviceInfo.browser,
				version: deviceInfo.version,
			},

			// Feature support matrix
			features: {
				// Core features
				touch: this.getFeatureSupport(testResults, "testTouchInteractions"),
				haptic: this.getFeatureSupport(testResults, "testHapticFeedback"),
				audio: this.getFeatureSupport(testResults, "testAudioPlayback"),
				video: this.getFeatureSupport(testResults, "testVideoPlayback"),

				// Graphics
				webgl: this.getFeatureSupport(testResults, "testWebGLRendering"),
				canvas: this.getFeatureSupport(testResults, "testCanvasPerformance"),
				webgl2: this.getWebGL2Support(testResults),

				// Storage
				localStorage: this.testLocalStorage(),
				sessionStorage: this.testSessionStorage(),
				indexedDB: this.getFeatureSupport(testResults, "testIndexedDB"),

				// Background processing
				serviceWorker: this.getFeatureSupport(testResults, "testServiceWorker"),
				webWorkers: this.getFeatureSupport(testResults, "testWebWorkers"),

				// Device APIs
				geolocation: this.getFeatureSupport(testResults, "testGeolocation"),
				camera: this.getFeatureSupport(testResults, "testCamera"),
				microphone: this.getFeatureSupport(testResults, "testMicrophone"),
				deviceOrientation: this.getFeatureSupport(
					testResults,
					"testDeviceOrientation"
				),
				gamepad: this.getFeatureSupport(testResults, "testGamepad"),

				// UI features
				fullscreen: this.getFeatureSupport(testResults, "testFullscreen"),
				webShare: this.getFeatureSupport(testResults, "testWebShare"),
				clipboard: this.getFeatureSupport(testResults, "testClipboard"),
				notifications: this.getFeatureSupport(testResults, "testNotifications"),

				// PWA features
				pwa: this.getFeatureSupport(testResults, "testPWAFeatures"),

				// Network
				network: this.getFeatureSupport(testResults, "testNetworkConditions"),
				battery: this.getFeatureSupport(testResults, "testBatteryOptimization"),
			},

			// Performance profile
			performance: {
				cpu: performance.cpu,
				gpu: performance.gpu,
				memory: performance.memory,
				network: performance.network,
				score: this.calculatePerformanceScore(performance),
				bottlenecks: this.identifyBottlenecks(performance),
			},

			// Recommended settings
			recommendations: {
				quality: this.getRecommendedQuality(performance, webglCaps),
				resolution: this.getRecommendedResolution(performance),
				frameRate: this.getRecommendedFrameRate(performance),
				features: this.getRecommendedFeatures(testResults),
				optimizations: this.getRecommendedOptimizations(performance),
			},

			// Compatibility issues
			issues: this.identifyCompatibilityIssues(testResults),

			// Workarounds
			workarounds: this.generateWorkarounds(testResults),

			// Test results
			testResults,

			timestamp: Date.now(),
		};

		return profile;
	}

	/**
	 * Get device type
	 */
	getDeviceType() {
		if (isMobile()) {
			if (window.innerWidth >= 768) return "tablet";
			return "mobile";
		}
		return "desktop";
	}

	/**
	 * Get device class
	 */
	getDeviceClass(performance) {
		const { cpu, gpu, memory } = performance;

		if (cpu.cores >= 8 && gpu.score > 80 && memory.total > 6) {
			return "high";
		} else if (cpu.cores >= 6 && gpu.score > 60 && memory.total > 4) {
			return "medium";
		} else if (cpu.cores >= 4 && gpu.score > 40 && memory.total > 2) {
			return "low";
		} else {
			return "very-low";
		}
	}

	/**
	 * Get device tier
	 */
	getDeviceTier(performance, webglCaps) {
		const deviceClass = this.getDeviceClass(performance);
		const webglScore = this.calculateWebGLScore(webglCaps);

		if (deviceClass === "high" && webglScore > 80) return "flagship";
		if (deviceClass === "high" && webglScore > 60) return "premium";
		if (deviceClass === "medium" && webglScore > 50) return "mid-range";
		if (deviceClass === "low" && webglScore > 30) return "budget";
		return "legacy";
	}

	/**
	 * Get feature support from test results
	 */
	getFeatureSupport(testResults, testName) {
		const test = testResults[testName];
		if (!test) return { supported: false, reason: "Test not found" };

		if (test.status === "fulfilled") {
			return {
				supported: true,
				...test.value,
			};
		} else {
			return {
				supported: false,
				error: test.error,
			};
		}
	}

	/**
	 * Get WebGL2 support
	 */
	getWebGL2Support(testResults) {
		const webglTest = testResults["testWebGLRendering"];
		if (!webglTest || webglTest.status !== "fulfilled") {
			return { supported: false, reason: "WebGL test failed" };
		}

		return {
			supported: webglTest.value.webgl2 || false,
			webgl: webglTest.value.supported || false,
		};
	}

	/**
	 * Test local storage
	 */
	testLocalStorage() {
		try {
			const testKey = "compatibility_test";
			const testValue = "test_value";

			localStorage.setItem(testKey, testValue);
			const retrieved = localStorage.getItem(testKey);
			localStorage.removeItem(testKey);

			return { supported: retrieved === testValue };
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Test session storage
	 */
	testSessionStorage() {
		try {
			const testKey = "compatibility_test";
			const testValue = "test_value";

			sessionStorage.setItem(testKey, testValue);
			const retrieved = sessionStorage.getItem(testKey);
			sessionStorage.removeItem(testKey);

			return { supported: retrieved === testValue };
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Calculate performance score
	 */
	calculatePerformanceScore(performance) {
		const { cpu, gpu, memory, network } = performance;

		const cpuScore = Math.min(cpu.cores * 10, 100);
		const gpuScore = gpu.score;
		const memoryScore = Math.min(memory.total * 10, 100);
		const networkScore = network.speed ? Math.min(network.speed / 10, 100) : 50;

		return Math.round((cpuScore + gpuScore + memoryScore + networkScore) / 4);
	}

	/**
	 * Calculate WebGL score
	 */
	calculateWebGLScore(webglCaps) {
		if (!webglCaps.supported) return 0;

		let score = 0;

		// Base score for WebGL support
		score += 20;

		// WebGL2 bonus
		if (webglCaps.webgl2) score += 20;

		// Extension support
		score += Math.min(webglCaps.extensions.length * 2, 30);

		// Capabilities
		score += Math.min(webglCaps.capabilities.maxTextureSize / 1000, 10);
		score += Math.min(webglCaps.capabilities.maxVertexAttributes, 10);
		score += Math.min(webglCaps.capabilities.maxTextureUnits, 10);

		return Math.min(score, 100);
	}

	/**
	 * Identify performance bottlenecks
	 */
	identifyBottlenecks(performance) {
		const bottlenecks = [];

		if (performance.cpu.cores < 4) {
			bottlenecks.push("low_cpu_cores");
		}

		if (performance.gpu.score < 50) {
			bottlenecks.push("weak_gpu");
		}

		if (performance.memory.total < 2) {
			bottlenecks.push("low_memory");
		}

		if (performance.network.speed && performance.network.speed < 10) {
			bottlenecks.push("slow_network");
		}

		return bottlenecks;
	}

	/**
	 * Get recommended quality settings
	 */
	getRecommendedQuality(performance, webglCaps) {
		const deviceClass = this.getDeviceClass(performance);
		const webglScore = this.calculateWebGLScore(webglCaps);

		const qualityMap = {
			high: {
				resolution: "native",
				shadows: true,
				antialiasing: true,
				particles: "high",
				textures: "high",
				effects: "all",
				postProcessing: true,
				animations: "smooth",
			},
			medium: {
				resolution: "1080p",
				shadows: true,
				antialiasing: "fxaa",
				particles: "medium",
				textures: "medium",
				effects: "most",
				postProcessing: "basic",
				animations: "normal",
			},
			low: {
				resolution: "720p",
				shadows: false,
				antialiasing: false,
				particles: "low",
				textures: "low",
				effects: "basic",
				postProcessing: false,
				animations: "reduced",
			},
			"very-low": {
				resolution: "480p",
				shadows: false,
				antialiasing: false,
				particles: "minimal",
				textures: "basic",
				effects: "minimal",
				postProcessing: false,
				animations: "minimal",
			},
		};

		let quality = qualityMap[deviceClass];

		// Adjust based on WebGL score
		if (webglScore < 30) {
			quality = qualityMap["very-low"];
		} else if (webglScore < 50) {
			quality = qualityMap["low"];
		}

		return quality;
	}

	/**
	 * Get recommended resolution
	 */
	getRecommendedResolution(performance) {
		const deviceClass = this.getDeviceClass(performance);
		const screenWidth = window.screen.width;
		const screenHeight = window.screen.height;

		const resolutionMap = {
			high: "native",
			medium: screenWidth >= 1920 ? "1080p" : "720p",
			low: "720p",
			"very-low": "480p",
		};

		return resolutionMap[deviceClass];
	}

	/**
	 * Get recommended frame rate
	 */
	getRecommendedFrameRate(performance) {
		const deviceClass = this.getDeviceClass(performance);

		const frameRateMap = {
			high: 60,
			medium: 60,
			low: 30,
			"very-low": 30,
		};

		return frameRateMap[deviceClass];
	}

	/**
	 * Get recommended features
	 */
	getRecommendedFeatures(testResults) {
		const features = {
			touch: true,
			haptic: false,
			audio: true,
			video: false,
			webgl: true,
			canvas: true,
			localStorage: true,
			indexedDB: false,
			serviceWorker: false,
			webWorkers: false,
			geolocation: false,
			camera: false,
			microphone: false,
			deviceOrientation: false,
			gamepad: false,
			fullscreen: true,
			webShare: false,
			clipboard: true,
			notifications: false,
			pwa: false,
		};

		// Enable features based on test results
		Object.keys(features).forEach((feature) => {
			const testResult =
				testResults[
					`test${feature.charAt(0).toUpperCase() + feature.slice(1)}`
				];
			if (testResult && testResult.status === "fulfilled") {
				features[feature] = true;
			}
		});

		return features;
	}

	/**
	 * Get recommended optimizations
	 */
	getRecommendedOptimizations(performance) {
		const optimizations = [];
		const bottlenecks = this.identifyBottlenecks(performance);

		if (bottlenecks.includes("low_cpu_cores")) {
			optimizations.push(
				"reduce_physics_calculations",
				"simplify_ai",
				"batch_operations"
			);
		}

		if (bottlenecks.includes("weak_gpu")) {
			optimizations.push(
				"reduce_draw_calls",
				"simplify_shaders",
				"lower_texture_quality"
			);
		}

		if (bottlenecks.includes("low_memory")) {
			optimizations.push(
				"asset_compression",
				"texture_streaming",
				"garbage_collection"
			);
		}

		if (bottlenecks.includes("slow_network")) {
			optimizations.push("asset_caching", "lazy_loading", "compression");
		}

		return optimizations;
	}

	/**
	 * Identify compatibility issues
	 */
	identifyCompatibilityIssues(testResults) {
		const issues = [];

		Object.entries(testResults).forEach(([testName, result]) => {
			if (result.status === "rejected") {
				issues.push({
					test: testName,
					error: result.error,
					severity: this.getIssueSeverity(testName),
				});
			}
		});

		return issues;
	}

	/**
	 * Get issue severity
	 */
	getIssueSeverity(testName) {
		const criticalTests = [
			"testTouchInteractions",
			"testAudioPlayback",
			"testWebGLRendering",
			"testCanvasPerformance",
			"testLocalStorage",
		];

		if (criticalTests.includes(testName)) return "critical";
		return "warning";
	}

	/**
	 * Generate workarounds
	 */
	generateWorkarounds(testResults) {
		const workarounds = [];

		// Touch fallbacks
		if (testResults.testTouchInteractions?.status !== "fulfilled") {
			workarounds.push({
				issue: "touch_not_supported",
				workaround: "use_mouse_events",
				description: "Fallback to mouse events for touch interactions",
			});
		}

		// Audio fallbacks
		if (testResults.testAudioPlayback?.status !== "fulfilled") {
			workarounds.push({
				issue: "audio_not_supported",
				workaround: "use_visual_feedback",
				description: "Use visual feedback instead of audio cues",
			});
		}

		// WebGL fallbacks
		if (testResults.testWebGLRendering?.status !== "fulfilled") {
			workarounds.push({
				issue: "webgl_not_supported",
				workaround: "use_canvas_2d",
				description: "Fallback to Canvas 2D rendering",
			});
		}

		// Storage fallbacks
		if (testResults.testLocalStorage?.status !== "fulfilled") {
			workarounds.push({
				issue: "localstorage_not_supported",
				workaround: "use_memory_storage",
				description: "Use in-memory storage as fallback",
			});
		}

		return workarounds;
	}

	/**
	 * Setup adaptation rules
	 */
	setupAdaptationRules() {
		// Device class adaptations
		this.adaptationRules.set("device_class", (deviceClass) => {
			switch (deviceClass) {
				case "high":
					return {
						quality: "ultra",
						effects: "all",
						particles: "high",
						shadows: true,
						antialiasing: true,
					};
				case "medium":
					return {
						quality: "high",
						effects: "most",
						particles: "medium",
						shadows: true,
						antialiasing: "fxaa",
					};
				case "low":
					return {
						quality: "medium",
						effects: "basic",
						particles: "low",
						shadows: false,
						antialiasing: false,
					};
				case "very-low":
					return {
						quality: "low",
						effects: "minimal",
						particles: "minimal",
						shadows: false,
						antialiasing: false,
					};
				default:
					return {};
			}
		});

		// Device type adaptations
		this.adaptationRules.set("device_type", (deviceType) => {
			switch (deviceType) {
				case "mobile":
					return {
						touchControls: true,
						virtualGamepad: true,
						simplifiedUI: true,
						largerButtons: true,
						gestureSupport: true,
					};
				case "tablet":
					return {
						touchControls: true,
						virtualGamepad: false,
						simplifiedUI: false,
						largerButtons: true,
						gestureSupport: true,
					};
				case "desktop":
					return {
						touchControls: false,
						virtualGamepad: false,
						simplifiedUI: false,
						largerButtons: false,
						gestureSupport: false,
					};
				default:
					return {};
			}
		});

		// Browser adaptations
		this.adaptationRules.set("browser", (browser) => {
			const adaptations = {};

			// Safari specific
			if (browser.includes("Safari")) {
				adaptations.webAudioWorklet = false;
				adaptations.webGL2 = false;
				adaptations.serviceWorker = false;
			}

			// Chrome specific
			if (browser.includes("Chrome")) {
				adaptations.webAudioWorklet = true;
				adaptations.webGL2 = true;
				adaptations.serviceWorker = true;
			}

			// Firefox specific
			if (browser.includes("Firefox")) {
				adaptations.webAudioWorklet = true;
				adaptations.webGL2 = true;
				adaptations.serviceWorker = true;
			}

			return adaptations;
		});

		// Network adaptations
		this.adaptationRules.set("network", (networkInfo) => {
			if (!networkInfo.supported) return {};

			const adaptations = {};

			switch (networkInfo.effectiveType) {
				case "slow-2g":
				case "2g":
					adaptations.assetQuality = "low";
					adaptations.lazyLoading = true;
					adaptations.compression = true;
					adaptations.streaming = false;
					break;
				case "3g":
					adaptations.assetQuality = "medium";
					adaptations.lazyLoading = true;
					adaptations.compression = true;
					adaptations.streaming = true;
					break;
				case "4g":
					adaptations.assetQuality = "high";
					adaptations.lazyLoading = false;
					adaptations.compression = false;
					adaptations.streaming = true;
					break;
				default:
					adaptations.assetQuality = "high";
					adaptations.lazyLoading = false;
					adaptations.compression = false;
					adaptations.streaming = true;
			}

			if (networkInfo.saveData) {
				adaptations.assetQuality = "low";
				adaptations.lazyLoading = true;
				adaptations.compression = true;
			}

			return adaptations;
		});
	}

	/**
	 * Apply adaptations
	 */
	applyAdaptations() {
		if (!this.compatibilityProfile) return;

		const {
			device,
			features,
			performance,
			recommendations,
		} = this.compatibilityProfile;

		// Apply device class adaptations
		const deviceClassAdaptations = this.adaptationRules.get("device_class")(
			device.class
		);
		this.mergeAdaptations(deviceClassAdaptations);

		// Apply device type adaptations
		const deviceTypeAdaptations = this.adaptationRules.get("device_type")(
			device.type
		);
		this.mergeAdaptations(deviceTypeAdaptations);

		// Apply browser adaptations
		const browserAdaptations = this.adaptationRules.get("browser")(
			device.browser
		);
		this.mergeAdaptations(browserAdaptations);

		// Apply network adaptations
		const networkAdaptations = this.adaptationRules.get("network")(
			features.network
		);
		this.mergeAdaptations(networkAdaptations);

		// Apply feature flags
		this.applyFeatureFlags(features);

		// Apply quality settings
		this.applyQualitySettings(recommendations.quality);

		console.log("Applied adaptations:", this.getAppliedAdaptations());
	}

	/**
	 * Merge adaptations
	 */
	mergeAdaptations(adaptations) {
		Object.entries(adaptations).forEach(([key, value]) => {
			this.featureFlags.set(key, value);
		});
	}

	/**
	 * Apply feature flags
	 */
	applyFeatureFlags(features) {
		Object.entries(features).forEach(([feature, support]) => {
			if (typeof support === "object") {
				this.featureFlags.set(feature, support.supported);
			} else {
				this.featureFlags.set(feature, support);
			}
		});
	}

	/**
	 * Apply quality settings
	 */
	applyQualitySettings(quality) {
		Object.entries(quality).forEach(([setting, value]) => {
			this.featureFlags.set(`quality.${setting}`, value);
		});
	}

	/**
	 * Get applied adaptations
	 */
	getAppliedAdaptations() {
		return Object.fromEntries(this.featureFlags);
	}

	/**
	 * Setup performance monitoring
	 */
	setupPerformanceMonitoring() {
		// Monitor frame rate
		this.monitorFrameRate();

		// Monitor memory usage
		this.monitorMemoryUsage();

		// Monitor network conditions
		this.monitorNetworkConditions();

		// Monitor battery level
		this.monitorBatteryLevel();
	}

	/**
	 * Monitor frame rate
	 */
	monitorFrameRate() {
		let lastTime = performance.now();
		let frames = 0;

		const measureFPS = () => {
			frames++;
			const currentTime = performance.now();

			if (currentTime >= lastTime + 1000) {
				const fps = Math.round((frames * 1000) / (currentTime - lastTime));

				// Adjust quality if FPS is too low
				if (fps < 30 && this.featureFlags.get("quality.frameRate") > 30) {
					this.reduceQuality();
				}

				frames = 0;
				lastTime = currentTime;
			}

			requestAnimationFrame(measureFPS);
		};

		requestAnimationFrame(measureFPS);
	}

	/**
	 * Monitor memory usage
	 */
	monitorMemoryUsage() {
		if (!performance.memory) return;

		setInterval(() => {
			const memory = performance.memory;
			const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

			// Trigger garbage collection if memory usage is high
			if (usage > 0.8) {
				this.triggerGarbageCollection();
			}

			// Reduce quality if memory usage is critical
			if (usage > 0.9) {
				this.reduceQuality();
			}
		}, 10000);
	}

	/**
	 * Monitor network conditions
	 */
	monitorNetworkConditions() {
		if (!navigator.connection) return;

		const connection = navigator.connection;

		connection.addEventListener("change", () => {
			const networkAdaptations = this.adaptationRules.get("network")({
				supported: true,
				effectiveType: connection.effectiveType,
				saveData: connection.saveData,
			});

			this.mergeAdaptations(networkAdaptations);
		});
	}

	/**
	 * Monitor battery level
	 */
	monitorBatteryLevel() {
		if (!("getBattery" in navigator)) return;

		navigator.getBattery().then((battery) => {
			battery.addEventListener("levelchange", () => {
				if (battery.level < 0.2) {
					this.enableBatterySaver();
				}
			});

			battery.addEventListener("chargingchange", () => {
				if (!battery.charging) {
					this.enableBatterySaver();
				} else {
					this.disableBatterySaver();
				}
			});
		});
	}

	/**
	 * Reduce quality
	 */
	reduceQuality() {
		const currentQuality = this.featureFlags.get("quality.level") || "high";
		const qualityLevels = ["ultra", "high", "medium", "low"];
		const currentIndex = qualityLevels.indexOf(currentQuality);

		if (currentIndex < qualityLevels.length - 1) {
			const newQuality = qualityLevels[currentIndex + 1];
			this.featureFlags.set("quality.level", newQuality);
			console.log(`Reduced quality to ${newQuality}`);
		}
	}

	/**
	 * Trigger garbage collection
	 */
	triggerGarbageCollection() {
		if (window.gc) {
			window.gc();
		}
	}

	/**
	 * Enable battery saver
	 */
	enableBatterySaver() {
		this.featureFlags.set("batterySaver", true);
		this.featureFlags.set("quality.frameRate", 30);
		this.featureFlags.set("quality.particles", "minimal");
		this.featureFlags.set("quality.effects", "minimal");
		console.log("Battery saver enabled");
	}

	/**
	 * Disable battery saver
	 */
	disableBatterySaver() {
		this.featureFlags.set("batterySaver", false);
		// Restore original quality settings
		this.applyQualitySettings(
			this.compatibilityProfile.recommendations.quality
		);
		console.log("Battery saver disabled");
	}

	/**
	 * Get feature flag
	 */
	getFeatureFlag(flag) {
		return this.featureFlags.get(flag);
	}

	/**
	 * Set feature flag
	 */
	setFeatureFlag(flag, value) {
		this.featureFlags.set(flag, value);
	}

	/**
	 * Check if feature is supported
	 */
	isFeatureSupported(feature) {
		return this.featureFlags.get(feature) === true;
	}

	/**
	 * Get compatibility profile
	 */
	getCompatibilityProfile() {
		return this.compatibilityProfile;
	}

	/**
	 * Get device recommendations
	 */
	getRecommendations() {
		return this.compatibilityProfile?.recommendations || {};
	}

	/**
	 * Get compatibility issues
	 */
	getIssues() {
		return this.compatibilityProfile?.issues || [];
	}

	/**
	 * Get workarounds
	 */
	getWorkarounds() {
		return this.compatibilityProfile?.workarounds || [];
	}
}

// Create singleton instance
const deviceCompatibilityLayer = new DeviceCompatibilityLayer();

export default deviceCompatibilityLayer;
export { DeviceCompatibilityLayer };
