import { isAndroid, isIOS, isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";
import webglOptimizer from "./webglOptimizer";

class AdaptiveQualityManager {
	constructor() {
		this.deviceProfile = this.createDeviceProfile();
		this.currentQuality = "auto";
		this.qualityPresets = this.defineQualityPresets();
		this.performanceMetrics = {
			fps: 60,
			frameTime: 16.67,
			memoryUsage: 0,
			batteryLevel: 100,
			thermalState: "normal",
		};
		this.adaptationHistory = [];
		this.maxHistorySize = 20;

		this.init();
	}

	createDeviceProfile() {
		const profile = {
			isMobile: isMobile(),
			isIOS: isIOS(),
			isAndroid: isAndroid(),
			memory: navigator.deviceMemory || 4,
			cores: navigator.hardwareConcurrency || 4,
			pixelRatio: window.devicePixelRatio || 1,
			screenSize: {
				width: window.screen.width,
				height: window.screen.height,
				pixels: window.screen.width * window.screen.height,
			},
			gpu: this.getGPUInfo(),
			battery: this.getBatteryInfo(),
			connection: this.getConnectionInfo(),
			performance: this.getPerformanceScore(),
		};

		// Calculate device tier
		profile.tier = this.calculateDeviceTier(profile);

		return profile;
	}

	getGPUInfo() {
		const canvas = document.createElement("canvas");
		const gl =
			canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		if (!gl) return { type: "unknown", score: 0 };

		const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
		if (debugInfo) {
			const renderer = gl
				.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
				.toLowerCase();

			// Score GPUs based on known performance
			let score = 0;
			if (renderer.includes("adreno")) {
				if (renderer.includes("730") || renderer.includes("740")) score = 9;
				else if (renderer.includes("660") || renderer.includes("680"))
					score = 7;
				else if (renderer.includes("630") || renderer.includes("640"))
					score = 5;
				else score = 3;
			} else if (renderer.includes("mali")) {
				if (renderer.includes("g78") || renderer.includes("g77")) score = 8;
				else if (renderer.includes("g76") || renderer.includes("g72"))
					score = 6;
				else if (renderer.includes("g71") || renderer.includes("g52"))
					score = 4;
				else score = 2;
			} else if (renderer.includes("apple")) {
				if (renderer.includes("a15") || renderer.includes("a14")) score = 10;
				else if (renderer.includes("a13") || renderer.includes("a12"))
					score = 8;
				else if (renderer.includes("a11") || renderer.includes("a10"))
					score = 6;
				else score = 4;
			} else {
				score = 5; // Default for unknown GPUs
			}

			return { type: renderer, score };
		}

		return { type: "unknown", score: 3 };
	}

	getBatteryInfo() {
		if ("getBattery" in navigator) {
			return navigator.getBattery().then((battery) => ({
				level: battery.level,
				charging: battery.charging,
				supported: true,
			}));
		}

		return Promise.resolve({ level: 1, charging: true, supported: false });
	}

	getConnectionInfo() {
		if ("connection" in navigator) {
			const conn = navigator.connection;
			return {
				effectiveType: conn.effectiveType || "4g",
				downlink: conn.downlink || 10,
				rtt: conn.rtt || 50,
				saveData: conn.saveData || false,
			};
		}

		return { effectiveType: "4g", downlink: 10, rtt: 50, saveData: false };
	}

	getPerformanceScore() {
		// Calculate overall performance score
		let score = 0;

		// Memory score (0-10)
		score += Math.min(10, (navigator.deviceMemory || 4) * 2);

		// CPU score (0-10)
		score += Math.min(10, (navigator.hardwareConcurrency || 4) * 2.5);

		// Screen resolution penalty (high res = lower score on mobile)
		if (isMobile()) {
			const pixels = window.screen.width * window.screen.height;
			if (pixels > 2000000) score -= 2;
			// Very high resolution
			else if (pixels > 1000000) score -= 1; // High resolution
		}

		return Math.max(0, Math.min(20, score));
	}

	calculateDeviceTier(profile) {
		const score = profile.performance + profile.gpu.score;

		if (score >= 15) return "high";
		if (score >= 10) return "medium";
		if (score >= 5) return "low";
		return "very_low";
	}

	defineQualityPresets() {
		return {
			very_low: {
				name: "Very Low",
				resolution: 0.5,
				textureQuality: 0.5,
				shaderQuality: "low",
				shadowQuality: "off",
				particleCount: 0.25,
				antiAliasing: false,
				anisotropicFiltering: false,
				vsync: true,
				frameRate: 30,
				lodBias: 2.0,
				renderDistance: 0.5,
			},
			low: {
				name: "Low",
				resolution: 0.7,
				textureQuality: 0.7,
				shaderQuality: "low",
				shadowQuality: "low",
				particleCount: 0.5,
				antiAliasing: false,
				anisotropicFiltering: false,
				vsync: true,
				frameRate: 30,
				lodBias: 1.5,
				renderDistance: 0.7,
			},
			medium: {
				name: "Medium",
				resolution: 0.85,
				textureQuality: 0.85,
				shaderQuality: "medium",
				shadowQuality: "medium",
				particleCount: 0.75,
				antiAliasing: true,
				anisotropicFiltering: true,
				vsync: true,
				frameRate: 45,
				lodBias: 1.0,
				renderDistance: 0.85,
			},
			high: {
				name: "High",
				resolution: 1.0,
				textureQuality: 1.0,
				shaderQuality: "high",
				shadowQuality: "high",
				particleCount: 1.0,
				antiAliasing: true,
				anisotropicFiltering: true,
				vsync: true,
				frameRate: 60,
				lodBias: 0.5,
				renderDistance: 1.0,
			},
			ultra: {
				name: "Ultra",
				resolution: 1.5,
				textureQuality: 1.0,
				shaderQuality: "ultra",
				shadowQuality: "ultra",
				particleCount: 1.5,
				antiAliasing: true,
				anisotropicFiltering: true,
				vsync: false,
				frameRate: 60,
				lodBias: 0.0,
				renderDistance: 1.5,
			},
		};
	}

	init() {
		// Set initial quality based on device profile
		this.setInitialQuality();

		// Start performance monitoring
		this.startPerformanceMonitoring();

		// Setup battery monitoring
		this.setupBatteryMonitoring();

		// Setup thermal monitoring
		this.setupThermalMonitoring();

		// Start adaptive adjustments
		this.startAdaptiveAdjustments();
	}

	setInitialQuality() {
		const tier = this.deviceProfile.tier;
		let quality;

		switch (tier) {
			case "high":
				quality = "high";
				break;
			case "medium":
				quality = "medium";
				break;
			case "low":
				quality = "low";
				break;
			case "very_low":
				quality = "very_low";
				break;
			default:
				quality = "medium";
		}

		// Adjust for battery level if low
		if (this.deviceProfile.battery.level < 0.2) {
			quality = "very_low";
		} else if (this.deviceProfile.battery.level < 0.5) {
			quality = "low";
		}

		// Adjust for data saver mode
		if (this.deviceProfile.connection.saveData) {
			quality = "low";
		}

		this.applyQualitySettings(quality);
	}

	startPerformanceMonitoring() {
		let lastTime = performance.now();
		let frameCount = 0;

		const measurePerformance = (currentTime) => {
			frameCount++;

			if (currentTime - lastTime >= 1000) {
				const fps = frameCount;
				const frameTime = 1000 / fps;

				this.performanceMetrics.fps = fps;
				this.performanceMetrics.frameTime = frameTime;

				frameCount = 0;
				lastTime = currentTime;
			}

			requestAnimationFrame(measurePerformance);
		};

		requestAnimationFrame(measurePerformance);
	}

	setupBatteryMonitoring() {
		if ("getBattery" in navigator) {
			navigator.getBattery().then((battery) => {
				battery.addEventListener("levelchange", () => {
					this.performanceMetrics.batteryLevel = battery.level;
					this.adaptToBatteryLevel(battery.level);
				});

				battery.addEventListener("chargingchange", () => {
					this.adaptToChargingState(battery.charging);
				});
			});
		}
	}

	setupThermalMonitoring() {
		// Check for thermal throttling indicators
		setInterval(() => {
			const fps = this.performanceMetrics.fps;
			const targetFPS = this.qualityPresets[this.currentQuality].frameRate;

			// Detect thermal throttling (sustained low FPS)
			if (fps < targetFPS * 0.8) {
				this.performanceMetrics.thermalState = "hot";
			} else if (fps < targetFPS * 0.9) {
				this.performanceMetrics.thermalState = "warm";
			} else {
				this.performanceMetrics.thermalState = "normal";
			}
		}, 5000);
	}

	startAdaptiveAdjustments() {
		// Check every 5 seconds for quality adjustments
		setInterval(() => {
			this.evaluateAndAdjust();
		}, 5000);
	}

	adaptToBatteryLevel(level) {
		if (level < 0.1 && this.currentQuality !== "very_low") {
			this.applyQualitySettings("very_low");
			trackMobileEvent("adaptive_quality_battery_critical", { level });
		} else if (level < 0.3 && this.currentQuality === "high") {
			this.applyQualitySettings("medium");
			trackMobileEvent("adaptive_quality_battery_low", { level });
		}
	}

	adaptToChargingState(charging) {
		if (
			charging &&
			this.deviceProfile.tier === "high" &&
			this.currentQuality !== "high"
		) {
			this.applyQualitySettings("high");
			trackMobileEvent("adaptive_quality_charging", { charging });
		}
	}

	evaluateAndAdjust() {
		const {
			fps,
			frameTime,
			batteryLevel,
			thermalState,
		} = this.performanceMetrics;
		const currentPreset = this.qualityPresets[this.currentQuality];
		const targetFPS = currentPreset.frameRate;

		// Performance-based adjustments
		if (fps < targetFPS * 0.7 && thermalState === "hot") {
			// Significant performance drop and thermal throttling
			this.decreaseQuality("thermal_throttling");
		} else if (fps < targetFPS * 0.8) {
			// Performance drop
			this.decreaseQuality("performance_drop");
		} else if (
			fps > targetFPS * 1.1 &&
			thermalState === "normal" &&
			batteryLevel > 0.5
		) {
			// Good performance and conditions
			this.increaseQuality("performance_headroom");
		}
	}

	decreaseQuality(reason) {
		const qualities = ["ultra", "high", "medium", "low", "very_low"];
		const currentIndex = qualities.indexOf(this.currentQuality);

		if (currentIndex < qualities.length - 1) {
			const newQuality = qualities[currentIndex + 1];
			this.applyQualitySettings(newQuality);

			this.adaptationHistory.push({
				type: "decrease",
				from: this.currentQuality,
				to: newQuality,
				reason,
				timestamp: Date.now(),
			});

			trackMobileEvent("adaptive_quality_decreased", {
				from: this.currentQuality,
				to: newQuality,
				reason,
			});
		}
	}

	increaseQuality(reason) {
		const qualities = ["ultra", "high", "medium", "low", "very_low"];
		const currentIndex = qualities.indexOf(this.currentQuality);

		if (currentIndex > 0) {
			const newQuality = qualities[currentIndex - 1];
			this.applyQualitySettings(newQuality);

			this.adaptationHistory.push({
				type: "increase",
				from: this.currentQuality,
				to: newQuality,
				reason,
				timestamp: Date.now(),
			});

			trackMobileEvent("adaptive_quality_increased", {
				from: this.currentQuality,
				to: newQuality,
				reason,
			});
		}
	}

	applyQualitySettings(quality) {
		const preset = this.qualityPresets[quality];
		if (!preset) return;

		this.currentQuality = quality;

		// Apply resolution scale
		this.setResolutionScale(preset.resolution);

		// Apply texture quality
		this.setTextureQuality(preset.textureQuality);

		// Apply shader quality
		this.setShaderQuality(preset.shaderQuality);

		// Apply shadow quality
		this.setShadowQuality(preset.shadowQuality);

		// Apply particle count
		this.setParticleCount(preset.particleCount);

		// Apply anti-aliasing
		this.setAntiAliasing(preset.antiAliasing);

		// Apply anisotropic filtering
		this.setAnisotropicFiltering(preset.anisotropicFiltering);

		// Apply vsync
		this.setVSync(preset.vsync);

		// Apply frame rate limit
		this.setFrameRateLimit(preset.frameRate);

		// Apply LOD bias
		this.setLODBias(preset.lodBias);

		// Apply render distance
		this.setRenderDistance(preset.renderDistance);

		// Notify WebGL optimizer
		if (webglOptimizer.isSupported) {
			webglOptimizer.setPerformanceMode(
				quality === "very_low"
					? "low"
					: quality === "low"
					? "low"
					: quality === "medium"
					? "medium"
					: "high"
			);
		}
	}

	setResolutionScale(scale) {
		// Implementation for resolution scaling
		document.documentElement.style.setProperty("--resolution-scale", scale);
	}

	setTextureQuality(quality) {
		// Implementation for texture quality
		document.documentElement.style.setProperty("--texture-quality", quality);
	}

	setShaderQuality(quality) {
		// Implementation for shader quality
		document.documentElement.style.setProperty("--shader-quality", quality);
	}

	setShadowQuality(quality) {
		// Implementation for shadow quality
		document.documentElement.style.setProperty("--shadow-quality", quality);
	}

	setParticleCount(count) {
		// Implementation for particle count
		document.documentElement.style.setProperty("--particle-count", count);
	}

	setAntiAliasing(enabled) {
		// Implementation for anti-aliasing
		document.documentElement.style.setProperty(
			"--anti-aliasing",
			enabled ? "1" : "0"
		);
	}

	setAnisotropicFiltering(enabled) {
		// Implementation for anisotropic filtering
		document.documentElement.style.setProperty(
			"--anisotropic-filtering",
			enabled ? "1" : "0"
		);
	}

	setVSync(enabled) {
		// Implementation for vsync
		document.documentElement.style.setProperty("--vsync", enabled ? "1" : "0");
	}

	setFrameRateLimit(fps) {
		// Implementation for frame rate limiting
		document.documentElement.style.setProperty("--frame-rate-limit", fps);
	}

	setLODBias(bias) {
		// Implementation for LOD bias
		document.documentElement.style.setProperty("--lod-bias", bias);
	}

	setRenderDistance(distance) {
		// Implementation for render distance
		document.documentElement.style.setProperty("--render-distance", distance);
	}

	// Public API
	getCurrentQuality() {
		return this.currentQuality;
	}

	getDeviceProfile() {
		return this.deviceProfile;
	}

	getPerformanceMetrics() {
		return { ...this.performanceMetrics };
	}

	getAdaptationHistory() {
		return [...this.adaptationHistory];
	}

	setManualQuality(quality) {
		if (this.qualityPresets[quality]) {
			this.applyQualitySettings(quality);
			trackMobileEvent("adaptive_quality_manual_override", { quality });
		}
	}

	resetToAuto() {
		this.currentQuality = "auto";
		this.setInitialQuality();
		trackMobileEvent("adaptive_quality_reset_to_auto");
	}
}

// Get adaptive quality settings for device compatibility
export const getAdaptiveQuality = () => {
	const profile = adaptiveQualityManager.getDeviceProfile();
	const currentQuality = adaptiveQualityManager.getCurrentQuality();
	const qualityPresets = adaptiveQualityManager.qualityPresets;

	return {
		deviceProfile: profile,
		currentQuality,
		qualityPresets,
		recommendedQuality:
			currentQuality === "auto" ? profile.tier : currentQuality,
		performanceMetrics: adaptiveQualityManager.getPerformanceMetrics(),
		adaptationHistory: adaptiveQualityManager.getAdaptationHistory(),
	};
};

// Create singleton instance
const adaptiveQualityManager = new AdaptiveQualityManager();

export default adaptiveQualityManager;
