/**
 * Mobile Performance Monitor
 * Real-time performance monitoring and optimization for mobile devices
 */
import { getDeviceInfo, isMobile } from "./mobile.js";
import { trackMobileEvent } from "./mobileAnalytics.js";

class MobilePerformanceMonitor {
	constructor() {
		this.isMonitoring = false;
		this.metrics = {
			fps: [],
			memory: [],
			network: [],
			battery: [],
			thermal: [],
			userInteractions: [],
		};

		this.thresholds = {
			fps: { min: 30, target: 60, critical: 15 },
			memory: { warning: 70, critical: 85 }, // percentage
			battery: { low: 20, critical: 10 }, // percentage
			thermal: { normal: "normal", warning: "warm", critical: "hot" },
		};

		this.callbacks = new Set();
		this.adaptiveQuality = null;
		this.lastOptimization = Date.now();
		this.optimizationCooldown = 5000; // 5 seconds

		this.deviceInfo = getDeviceInfo();
		this.initialize();
	}

	initialize() {
		if (!isMobile()) {
			console.log("Performance monitoring disabled on desktop");
			return;
		}

		this.startMonitoring();
		this.setupEventListeners();
		this.loadAdaptiveQuality();
	}

	async loadAdaptiveQuality() {
		try {
			const module = await import("./adaptiveQuality.js");
			this.adaptiveQuality = module.default;
		} catch (error) {
			console.warn("Adaptive quality module not available:", error);
		}
	}

	startMonitoring() {
		if (this.isMonitoring) return;

		this.isMonitoring = true;
		console.log("Starting mobile performance monitoring...");

		// Start FPS monitoring
		this.startFPSMonitoring();

		// Start memory monitoring
		this.startMemoryMonitoring();

		// Start network monitoring
		this.startNetworkMonitoring();

		// Start battery monitoring
		this.startBatteryMonitoring();

		// Start thermal monitoring (if available)
		this.startThermalMonitoring();

		// Start user interaction monitoring
		this.startInteractionMonitoring();

		// Start periodic analysis
		this.startPeriodicAnalysis();
	}

	startFPSMonitoring() {
		let lastTime = performance.now();
		let frames = 0;
		let frameTimeHistory = [];

		const measureFPS = () => {
			frames++;
			const currentTime = performance.now();

			if (currentTime >= lastTime + 1000) {
				const fps = Math.round((frames * 1000) / (currentTime - lastTime));
				const avgFrameTime = (currentTime - lastTime) / frames;

				this.metrics.fps.push({
					value: fps,
					timestamp: currentTime,
					frameTime: avgFrameTime,
				});

				// Keep only last 60 seconds of data
				const cutoff = currentTime - 60000;
				this.metrics.fps = this.metrics.fps.filter((m) => m.timestamp > cutoff);

				// Check FPS thresholds
				this.checkFPSThresholds(fps);

				frames = 0;
				lastTime = currentTime;
			}

			if (this.isMonitoring) {
				requestAnimationFrame(measureFPS);
			}
		};

		requestAnimationFrame(measureFPS);
	}

	startMemoryMonitoring() {
		if (!performance.memory) {
			console.warn("Memory monitoring not available");
			return;
		}

		const measureMemory = () => {
			const memory = performance.memory;
			const usedPercentage =
				(memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

			this.metrics.memory.push({
				used: memory.usedJSHeapSize,
				total: memory.totalJSHeapSize,
				limit: memory.jsHeapSizeLimit,
				percentage: usedPercentage,
				timestamp: Date.now(),
			});

			// Keep only last 60 seconds of data
			const cutoff = Date.now() - 60000;
			this.metrics.memory = this.metrics.memory.filter(
				(m) => m.timestamp > cutoff
			);

			// Check memory thresholds
			this.checkMemoryThresholds(usedPercentage);
		};

		// Measure memory every 5 seconds
		setInterval(measureMemory, 5000);
	}

	startNetworkMonitoring() {
		if (!navigator.connection) {
			console.warn("Network monitoring not available");
			return;
		}

		const measureNetwork = () => {
			const connection = navigator.connection;

			this.metrics.network.push({
				effectiveType: connection.effectiveType,
				downlink: connection.downlink,
				rtt: connection.rtt,
				saveData: connection.saveData,
				type: connection.type,
				timestamp: Date.now(),
			});

			// Keep only last 5 minutes of data
			const cutoff = Date.now() - 300000;
			this.metrics.network = this.metrics.network.filter(
				(m) => m.timestamp > cutoff
			);
		};

		measureNetwork();

		// Monitor network changes
		navigator.connection.addEventListener("change", measureNetwork);
	}

	startBatteryMonitoring() {
		if (!("getBattery" in navigator)) {
			console.warn("Battery monitoring not available");
			return;
		}

		navigator
			.getBattery()
			.then((battery) => {
				const measureBattery = () => {
					this.metrics.battery.push({
						level: battery.level,
						charging: battery.charging,
						chargingTime: battery.chargingTime,
						dischargingTime: battery.dischargingTime,
						timestamp: Date.now(),
					});

					// Keep only last 10 minutes of data
					const cutoff = Date.now() - 600000;
					this.metrics.battery = this.metrics.battery.filter(
						(m) => m.timestamp > cutoff
					);

					// Check battery thresholds
					this.checkBatteryThresholds(battery.level, battery.charging);
				};

				measureBattery();

				battery.addEventListener("levelchange", measureBattery);
				battery.addEventListener("chargingchange", measureBattery);
			})
			.catch((error) => {
				console.warn("Battery monitoring failed:", error);
			});
	}

	startThermalMonitoring() {
		// Thermal monitoring is not widely available
		// We'll infer thermal state from performance degradation
		let thermalState = "normal";
		let performanceDegradationCount = 0;

		const checkThermalState = () => {
			const recentFPS = this.metrics.fps.slice(-10); // Last 10 FPS measurements
			if (recentFPS.length < 5) return;

			const avgFPS =
				recentFPS.reduce((sum, m) => sum + m.value, 0) / recentFPS.length;
			const targetFPS = this.thresholds.fps.target;

			if (avgFPS < targetFPS * 0.7) {
				performanceDegradationCount++;

				if (performanceDegradationCount > 5) {
					thermalState = "hot";
				} else if (performanceDegradationCount > 2) {
					thermalState = "warm";
				}
			} else {
				performanceDegradationCount = Math.max(
					0,
					performanceDegradationCount - 1
				);
				if (performanceDegradationCount === 0) {
					thermalState = "normal";
				}
			}

			this.metrics.thermal.push({
				state: thermalState,
				degradationCount: performanceDegradationCount,
				avgFPS: avgFPS,
				timestamp: Date.now(),
			});

			// Keep only last 5 minutes of data
			const cutoff = Date.now() - 300000;
			this.metrics.thermal = this.metrics.thermal.filter(
				(m) => m.timestamp > cutoff
			);
		};

		setInterval(checkThermalState, 10000); // Check every 10 seconds
	}

	startInteractionMonitoring() {
		let interactionCount = 0;
		let lastInteractionTime = Date.now();

		const trackInteraction = (event) => {
			const now = Date.now();
			const timeSinceLastInteraction = now - lastInteractionTime;

			this.metrics.userInteractions.push({
				type: event.type,
				target: event.target.tagName,
				timestamp: now,
				timeSinceLastInteraction,
			});

			interactionCount++;
			lastInteractionTime = now;

			// Keep only last 5 minutes of data
			const cutoff = now - 300000;
			this.metrics.userInteractions = this.metrics.userInteractions.filter(
				(m) => m.timestamp > cutoff
			);
		};

		// Track various interaction types
		["click", "touchstart", "keydown", "scroll"].forEach((eventType) => {
			document.addEventListener(eventType, trackInteraction, { passive: true });
		});
	}

	startPeriodicAnalysis() {
		setInterval(() => {
			this.analyzePerformance();
		}, 30000); // Analyze every 30 seconds
	}

	checkFPSThresholds(fps) {
		const { min, target, critical } = this.thresholds.fps;

		if (fps < critical) {
			this.handlePerformanceIssue("critical_fps", {
				current: fps,
				threshold: critical,
				severity: "critical",
			});
		} else if (fps < min) {
			this.handlePerformanceIssue("low_fps", {
				current: fps,
				threshold: min,
				severity: "warning",
			});
		} else if (fps >= target) {
			this.handlePerformanceRecovery("fps_optimized", {
				current: fps,
				target: target,
			});
		}
	}

	checkMemoryThresholds(percentage) {
		const { warning, critical } = this.thresholds.memory;

		if (percentage > critical) {
			this.handlePerformanceIssue("critical_memory", {
				current: percentage,
				threshold: critical,
				severity: "critical",
			});
		} else if (percentage > warning) {
			this.handlePerformanceIssue("high_memory", {
				current: percentage,
				threshold: warning,
				severity: "warning",
			});
		}
	}

	checkBatteryThresholds(level, charging) {
		const { low, critical } = this.thresholds.battery;

		if (!charging && level < critical) {
			this.handlePerformanceIssue("critical_battery", {
				current: level,
				threshold: critical,
				severity: "critical",
			});
		} else if (!charging && level < low) {
			this.handlePerformanceIssue("low_battery", {
				current: level,
				threshold: low,
				severity: "warning",
			});
		}
	}

	handlePerformanceIssue(issue, data) {
		const now = Date.now();

		// Prevent spamming optimizations
		if (now - this.lastOptimization < this.optimizationCooldown) {
			return;
		}

		console.warn(`Performance issue detected: ${issue}`, data);

		// Track analytics
		trackMobileEvent("performance_issue", {
			issue,
			...data,
			deviceInfo: this.deviceInfo,
		});

		// Apply automatic optimizations
		this.applyAutomaticOptimizations(issue, data);

		// Notify callbacks
		this.callbacks.forEach((callback) => {
			try {
				callback("issue", issue, data);
			} catch (error) {
				console.error("Performance callback error:", error);
			}
		});

		this.lastOptimization = now;
	}

	handlePerformanceRecovery(recovery, data) {
		console.log(`Performance recovery: ${recovery}`, data);

		// Track analytics
		trackMobileEvent("performance_recovery", {
			recovery,
			...data,
			deviceInfo: this.deviceInfo,
		});

		// Notify callbacks
		this.callbacks.forEach((callback) => {
			try {
				callback("recovery", recovery, data);
			} catch (error) {
				console.error("Performance callback error:", error);
			}
		});
	}

	applyAutomaticOptimizations(issue, data) {
		switch (issue) {
			case "critical_fps":
			case "low_fps":
				this.optimizeForFPS(data.current);
				break;

			case "critical_memory":
			case "high_memory":
				this.optimizeForMemory(data.current);
				break;

			case "critical_battery":
			case "low_battery":
				this.optimizeForBattery(data.current);
				break;

			default:
				break;
		}
	}

	optimizeForFPS(currentFPS) {
		if (this.adaptiveQuality) {
			if (currentFPS < 20) {
				this.adaptiveQuality.setManualQuality("very-low");
			} else if (currentFPS < 30) {
				this.adaptiveQuality.setManualQuality("low");
			} else if (currentFPS < 45) {
				this.adaptiveQuality.setManualQuality("medium");
			}
		}

		// Apply immediate optimizations
		this.applyImmediateOptimizations({
			reduceParticles: true,
			disableShadows: currentFPS < 25,
			lowerResolution: currentFPS < 20,
			reduceEffects: true,
		});
	}

	optimizeForMemory(memoryPercentage) {
		if (memoryPercentage > 85) {
			// Force garbage collection if available
			if (window.gc) {
				window.gc();
			}

			// Clear caches
			if ("caches" in window) {
				caches.keys().then((names) => {
					names.forEach((name) => {
						if (name.includes("temp") || name.includes("cache")) {
							caches.delete(name);
						}
					});
				});
			}
		}

		// Apply memory optimizations
		this.applyImmediateOptimizations({
			reduceTextureQuality: true,
			reduceCacheSize: true,
			disableAnimations: memoryPercentage > 90,
		});
	}

	optimizeForBattery(batteryLevel) {
		if (batteryLevel < 20) {
			// Enable battery saver mode
			this.applyImmediateOptimizations({
				reduceFrameRate: true,
				targetFrameRate: 30,
				disableBackgroundProcesses: true,
				reduceNetworkActivity: true,
			});
		}
	}

	applyImmediateOptimizations(optimizations) {
		const root = document.documentElement;

		if (optimizations.reduceParticles) {
			root.style.setProperty("--particle-count", "low");
		}

		if (optimizations.disableShadows) {
			root.style.setProperty("--shadow-quality", "disabled");
		}

		if (optimizations.lowerResolution) {
			root.style.setProperty("--resolution-scale", "0.7");
		}

		if (optimizations.reduceEffects) {
			root.style.setProperty("--effects-quality", "low");
		}

		if (optimizations.reduceTextureQuality) {
			root.style.setProperty("--texture-quality", "low");
		}

		if (optimizations.reduceCacheSize) {
			root.style.setProperty("--cache-size", "small");
		}

		if (optimizations.disableAnimations) {
			root.style.setProperty("--animation-duration", "0.01ms");
		}

		if (optimizations.reduceFrameRate) {
			root.style.setProperty(
				"--frame-rate-limit",
				optimizations.targetFrameRate || 30
			);
		}

		if (optimizations.disableBackgroundProcesses) {
			// Disable background processes
			this.disableBackgroundProcesses();
		}

		if (optimizations.reduceNetworkActivity) {
			// Reduce network polling
			this.reduceNetworkActivity();
		}
	}

	disableBackgroundProcesses() {
		// Disable background timers and intervals
		// This would need to be implemented based on specific application logic
		console.log("Disabling background processes for battery saving");
	}

	reduceNetworkActivity() {
		// Reduce network polling and sync frequency
		console.log("Reducing network activity for battery saving");
	}

	analyzePerformance() {
		const analysis = this.getPerformanceAnalysis();

		// Track analytics
		trackMobileEvent("performance_analysis", {
			...analysis,
			deviceInfo: this.deviceInfo,
		});

		// Apply optimizations if needed
		if (analysis.overallScore < 50) {
			this.applyAutomaticOptimizations("poor_performance", analysis);
		}
	}

	getPerformanceAnalysis() {
		const recentFPS = this.metrics.fps.slice(-10);
		const recentMemory = this.metrics.memory.slice(-5);
		const recentBattery = this.metrics.battery.slice(-3);

		const avgFPS =
			recentFPS.length > 0
				? recentFPS.reduce((sum, m) => sum + m.value, 0) / recentFPS.length
				: 60;

		const avgMemory =
			recentMemory.length > 0
				? recentMemory[recentMemory.length - 1].percentage
				: 50;

		const currentBattery =
			recentBattery.length > 0
				? recentBattery[recentBattery.length - 1].level
				: 1;

		const fpsScore = Math.min(100, (avgFPS / 60) * 100);
		const memoryScore = Math.max(0, 100 - avgMemory);
		const batteryScore = currentBattery * 100;

		const overallScore =
			fpsScore * 0.4 + memoryScore * 0.3 + batteryScore * 0.3;

		return {
			fpsScore,
			memoryScore,
			batteryScore,
			overallScore,
			grade: this.getPerformanceGrade(overallScore),
			recommendations: this.getRecommendations(
				overallScore,
				avgFPS,
				avgMemory,
				currentBattery
			),
		};
	}

	getPerformanceGrade(score) {
		if (score >= 90) return "A";
		if (score >= 80) return "B";
		if (score >= 70) return "C";
		if (score >= 60) return "D";
		return "F";
	}

	getRecommendations(overallScore, fps, memory, battery) {
		const recommendations = [];

		if (fps < 30) {
			recommendations.push("Reduce graphics quality for better frame rate");
		}

		if (memory > 70) {
			recommendations.push("Close other tabs to free up memory");
		}

		if (battery < 30) {
			recommendations.push("Enable battery saver mode");
		}

		if (overallScore < 50) {
			recommendations.push(
				"Consider using a more powerful device for best experience"
			);
		}

		return recommendations;
	}

	setupEventListeners() {
		// Monitor visibility changes
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) {
				this.pauseMonitoring();
			} else {
				this.resumeMonitoring();
			}
		});

		// Monitor page unload
		window.addEventListener("beforeunload", () => {
			this.stopMonitoring();
		});
	}

	pauseMonitoring() {
		this.isMonitoring = false;
		console.log("Performance monitoring paused");
	}

	resumeMonitoring() {
		if (!this.isMonitoring) {
			this.isMonitoring = true;
			console.log("Performance monitoring resumed");
		}
	}

	stopMonitoring() {
		this.isMonitoring = false;
		console.log("Performance monitoring stopped");
	}

	// Public API
	onPerformanceChange(callback) {
		this.callbacks.add(callback);
		return () => this.callbacks.delete(callback);
	}

	getCurrentMetrics() {
		return {
			fps: this.metrics.fps.slice(-1)[0]?.value || 60,
			memory: this.metrics.memory.slice(-1)[0]?.percentage || 50,
			battery: this.metrics.battery.slice(-1)[0]?.level || 1,
			thermal: this.metrics.thermal.slice(-1)[0]?.state || "normal",
		};
	}

	getDetailedMetrics() {
		return { ...this.metrics };
	}

	forceOptimization(level) {
		switch (level) {
			case "aggressive":
				this.applyImmediateOptimizations({
					reduceParticles: true,
					disableShadows: true,
					lowerResolution: true,
					reduceEffects: true,
					reduceTextureQuality: true,
					reduceCacheSize: true,
					disableAnimations: true,
					reduceFrameRate: true,
					targetFrameRate: 30,
				});
				break;

			case "moderate":
				this.applyImmediateOptimizations({
					reduceParticles: true,
					disableShadows: false,
					lowerResolution: false,
					reduceEffects: true,
					reduceTextureQuality: false,
					reduceCacheSize: true,
					disableAnimations: false,
					reduceFrameRate: false,
				});
				break;

			case "none":
				// Reset all optimizations
				const root = document.documentElement;
				root.style.removeProperty("--particle-count");
				root.style.removeProperty("--shadow-quality");
				root.style.removeProperty("--resolution-scale");
				root.style.removeProperty("--effects-quality");
				root.style.removeProperty("--texture-quality");
				root.style.removeProperty("--cache-size");
				root.style.removeProperty("--animation-duration");
				root.style.removeProperty("--frame-rate-limit");
				break;
		}
	}
}

// Create singleton instance
const mobilePerformanceMonitor = new MobilePerformanceMonitor();

export default mobilePerformanceMonitor;
export { MobilePerformanceMonitor };
