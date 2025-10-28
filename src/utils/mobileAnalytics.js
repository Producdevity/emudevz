import { isAndroid, isIOS, isMobile, isTouchDevice } from "./mobile";

class MobileAnalytics {
	constructor() {
		this.events = [];
		this.sessionStart = Date.now();
		this.deviceInfo = this.getDeviceInfo();
		this.performanceMetrics = {
			fps: [],
			memoryUsage: [],
			interactionTimes: [],
		};

		// Start session tracking
		this.startSession();
	}

	getDeviceInfo() {
		return {
			isMobile: isMobile(),
			isTouch: isTouchDevice(),
			isIOS: isIOS(),
			isAndroid: isAndroid(),
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			devicePixelRatio: window.devicePixelRatio || 1,
			userAgent: navigator.userAgent,
			language: navigator.language,
			hardwareConcurrency: navigator.hardwareConcurrency,
			connection: this.getConnectionInfo(),
		};
	}

	getConnectionInfo() {
		if (navigator.connection) {
			return {
				effectiveType: navigator.connection.effectiveType,
				downlink: navigator.connection.downlink,
				rtt: navigator.connection.rtt,
			};
		}
		return null;
	}

	startSession() {
		this.trackEvent("session_start", {
			deviceInfo: this.deviceInfo,
			timestamp: Date.now(),
		});

		// Track page visibility changes
		document.addEventListener(
			"visibilitychange",
			this.handleVisibilityChange.bind(this)
		);

		// Track orientation changes
		window.addEventListener(
			"orientationchange",
			this.handleOrientationChange.bind(this)
		);

		// Track errors
		window.addEventListener("error", this.handleError.bind(this));
		window.addEventListener(
			"unhandledrejection",
			this.handlePromiseRejection.bind(this)
		);
	}

	handleVisibilityChange() {
		const isVisible = !document.hidden;
		this.trackEvent("visibility_change", {
			isVisible,
			timestamp: Date.now(),
		});
	}

	handleOrientationChange() {
		const orientation =
			window.orientation ||
			(window.innerWidth > window.innerHeight ? "landscape" : "portrait");
		this.trackEvent("orientation_change", {
			orientation,
			timestamp: Date.now(),
		});
	}

	handleError(event) {
		this.trackEvent("javascript_error", {
			message: event.message,
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			stack: event.error?.stack,
			timestamp: Date.now(),
		});
	}

	handlePromiseRejection(event) {
		this.trackEvent("promise_rejection", {
			reason: event.reason,
			timestamp: Date.now(),
		});
	}

	trackEvent(eventName, data = {}) {
		const event = {
			name: eventName,
			data: {
				...data,
				deviceInfo: this.deviceInfo,
				sessionDuration: Date.now() - this.sessionStart,
			},
			timestamp: Date.now(),
		};

		this.events.push(event);

		// Store events locally for offline usage
		this.storeEvent(event);

		// Send events if online
		if (navigator.onLine) {
			this.sendEvents();
		}
	}

	trackPerformance(metricType, value) {
		this.performanceMetrics[metricType].push({
			value,
			timestamp: Date.now(),
		});

		// Keep only last 100 metrics to prevent memory issues
		if (this.performanceMetrics[metricType].length > 100) {
			this.performanceMetrics[metricType] = this.performanceMetrics[
				metricType
			].slice(-100);
		}

		// Track performance issues
		if (metricType === "fps" && value < 30) {
			this.trackEvent("low_fps", { fps: value });
		}

		if (metricType === "memoryUsage" && value > 80) {
			this.trackEvent("high_memory", { percentage: value });
		}
	}

	trackInteraction(interactionType, duration, target) {
		this.trackEvent("user_interaction", {
			type: interactionType,
			duration,
			target: target?.tagName || "unknown",
			timestamp: Date.now(),
		});

		this.performanceMetrics.interactionTimes.push(duration);
	}

	trackTabSwitch(fromTab, toTab) {
		this.trackEvent("tab_switch", {
			fromTab,
			toTab,
			timestamp: Date.now(),
		});
	}

	trackLevelStart(levelId) {
		this.trackEvent("level_start", {
			levelId,
			timestamp: Date.now(),
		});
	}

	trackLevelComplete(levelId, duration) {
		this.trackEvent("level_complete", {
			levelId,
			duration,
			timestamp: Date.now(),
		});
	}

	storeEvent(event) {
		try {
			const storedEvents = JSON.parse(
				localStorage.getItem("mobileAnalyticsEvents") || "[]"
			);
			storedEvents.push(event);

			// Keep only last 50 events
			if (storedEvents.length > 50) {
				storedEvents.splice(0, storedEvents.length - 50);
			}

			localStorage.setItem(
				"mobileAnalyticsEvents",
				JSON.stringify(storedEvents)
			);
		} catch (e) {
			console.warn("Failed to store analytics event:", e);
		}
	}

	async sendEvents() {
		if (this.events.length === 0) return;

		const eventsToSend = [...this.events];
		this.events = [];

		try {
			// In a real app, send to your analytics endpoint
			// await fetch('/api/analytics', {
			//     method: 'POST',
			//     headers: { 'Content-Type': 'application/json' },
			//     body: JSON.stringify(eventsToSend)
			// });

			// For now, just log to console
			console.log("Analytics events:", eventsToSend);

			// Clear stored events on successful send
			localStorage.removeItem("mobileAnalyticsEvents");
		} catch (e) {
			console.warn("Failed to send analytics events:", e);
			// Re-add events to queue if send failed
			this.events.unshift(...eventsToSend);
		}
	}

	getPerformanceReport() {
		const fps = this.performanceMetrics.fps;
		const memory = this.performanceMetrics.memoryUsage;
		const interactions = this.performanceMetrics.interactionTimes;

		return {
			averageFPS:
				fps.length > 0 ? fps.reduce((a, b) => a + b.value, 0) / fps.length : 0,
			minFPS: fps.length > 0 ? Math.min(...fps.map((f) => f.value)) : 0,
			maxFPS: fps.length > 0 ? Math.max(...fps.map((f) => f.value)) : 0,
			averageMemory:
				memory.length > 0
					? memory.reduce((a, b) => a + b.value, 0) / memory.length
					: 0,
			averageInteractionTime:
				interactions.length > 0
					? interactions.reduce((a, b) => a + b, 0) / interactions.length
					: 0,
			totalEvents: this.events.length,
			sessionDuration: Date.now() - this.sessionStart,
		};
	}

	endSession() {
		this.trackEvent("session_end", {
			duration: Date.now() - this.sessionStart,
			performanceReport: this.getPerformanceReport(),
			timestamp: Date.now(),
		});

		// Send any remaining events
		this.sendEvents();
	}
}

// Singleton instance
let mobileAnalytics = null;

export const initMobileAnalytics = () => {
	if (!mobileAnalytics) {
		mobileAnalytics = new MobileAnalytics();
	}
	return mobileAnalytics;
};

export const trackMobileEvent = (eventName, data) => {
	if (mobileAnalytics) {
		mobileAnalytics.trackEvent(eventName, data);
	}
};

export const trackMobilePerformance = (metricType, value) => {
	if (mobileAnalytics) {
		mobileAnalytics.trackPerformance(metricType, value);
	}
};

export const trackMobileInteraction = (interactionType, duration, target) => {
	if (mobileAnalytics) {
		mobileAnalytics.trackInteraction(interactionType, duration, target);
	}
};

// Get performance metrics for device compatibility
export const getPerformanceMetrics = () => {
	const deviceInfo = {
		cpu: {
			cores: navigator.hardwareConcurrency || 1,
			score: calculateCPUScore(),
		},
		gpu: {
			score: calculateGPUScore(),
			vendor: getGPUVendor(),
			renderer: getGPURenderer(),
		},
		memory: {
			total: navigator.deviceMemory || 4,
			used: performance.memory
				? performance.memory.usedJSHeapSize / 1024 / 1024
				: 0,
			score: calculateMemoryScore(),
		},
		network: {
			type: navigator.connection?.effectiveType || "unknown",
			speed: navigator.connection?.downlink || 0,
			score: calculateNetworkScore(),
		},
		battery: {
			level: 0.5, // Default value
			score: 50,
		},
		score: 0,
	};

	// Calculate overall performance score
	deviceInfo.score = Math.round(
		deviceInfo.cpu.score * 0.3 +
			deviceInfo.gpu.score * 0.3 +
			deviceInfo.memory.score * 0.2 +
			deviceInfo.network.score * 0.2
	);

	return deviceInfo;
};

// Calculate CPU score based on available information
const calculateCPUScore = () => {
	const cores = navigator.hardwareConcurrency || 1;
	let score = cores * 10; // Base score from core count

	// Add bonus for known high-performance CPUs
	const userAgent = navigator.userAgent;
	if (userAgent.includes("Snapdragon")) score += 20;
	if (userAgent.includes("Apple")) score += 30;
	if (userAgent.includes("Intel")) score += 25;

	return Math.min(score, 100);
};

// Calculate GPU score
const calculateGPUScore = () => {
	const canvas = document.createElement("canvas");
	const gl =
		canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

	if (!gl) return 0;

	let score = 20; // Base score for WebGL support

	// Check for extensions
	const extensions = [
		"WEBGL_depth_texture",
		"OES_texture_float",
		"OES_texture_half_float",
		"WEBGL_lose_context",
		"OES_standard_derivatives",
		"OES_vertex_array_object",
		"WEBGL_draw_buffers",
		"OES_element_index_uint",
	];

	extensions.forEach((ext) => {
		if (gl.getExtension(ext)) score += 5;
	});

	// Check capabilities
	const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	const maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	score += Math.min(maxTextureSize / 1000, 20);
	score += Math.min(maxVertexAttributes, 15);
	score += Math.min(maxTextureUnits, 10);

	return Math.min(score, 100);
};

// Get GPU vendor
const getGPUVendor = () => {
	const canvas = document.createElement("canvas");
	const gl =
		canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

	if (!gl) return "Unknown";

	const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
	if (debugInfo) {
		return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
	}

	return "Unknown";
};

// Get GPU renderer
const getGPURenderer = () => {
	const canvas = document.createElement("canvas");
	const gl =
		canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

	if (!gl) return "Unknown";

	const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
	if (debugInfo) {
		return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
	}

	return gl.getParameter(gl.RENDERER);
};

// Calculate memory score
const calculateMemoryScore = () => {
	const memory = navigator.deviceMemory || 4;
	return Math.min(memory * 15, 100);
};

// Calculate network score
const calculateNetworkScore = () => {
	if (!navigator.connection) return 50;

	const connection = navigator.connection;
	const effectiveType = connection.effectiveType;
	const downlink = connection.downlink || 0;

	let score = 50;

	switch (effectiveType) {
		case "slow-2g":
			score = 10;
			break;
		case "2g":
			score = 20;
			break;
		case "3g":
			score = 40;
			break;
		case "4g":
			score = 70;
			break;
		default:
			score = 50;
	}

	// Add bonus for fast downlink
	score += Math.min(downlink * 5, 30);

	return Math.min(score, 100);
};

export default initMobileAnalytics;
