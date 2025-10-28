import { isMobile } from "./mobile";

class CrashReporter {
	constructor() {
		this.errors = [];
		this.maxErrors = 50;
		this.isInitialized = false;
		this.deviceInfo = this.getDeviceInfo();
	}

	init() {
		if (this.isInitialized) return;

		// Global error handler
		window.onerror = (message, source, lineno, colno, error) => {
			this.captureError(error || new Error(message), {
				type: "javascript",
				source,
				lineno,
				colno,
			});
			return false;
		};

		// Unhandled promise rejection handler
		window.onunhandledrejection = (event) => {
			this.captureError(event.reason, {
				type: "promise",
				promise: event.promise,
			});
		};

		// React error boundaries can call this directly
		window.captureError = (error, errorInfo) => {
			this.captureError(error, errorInfo);
		};

		this.isInitialized = true;
	}

	getDeviceInfo() {
		return {
			isMobile: isMobile(),
			userAgent: navigator.userAgent,
			url: window.location.href,
			timestamp: new Date().toISOString(),
			screen: {
				width: window.screen.width,
				height: window.screen.height,
				colorDepth: window.screen.colorDepth,
			},
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight,
			},
			memory: performance.memory
				? {
						usedJSHeapSize: performance.memory.usedJSHeapSize,
						totalJSHeapSize: performance.memory.totalJSHeapSize,
						jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
				  }
				: null,
		};
	}

	captureError(error, errorInfo = {}) {
		const errorReport = {
			id: Date.now() + Math.random(),
			message: error?.message || error?.toString() || "Unknown error",
			stack: error?.stack || "",
			errorInfo,
			deviceInfo: this.deviceInfo,
			timestamp: new Date().toISOString(),
			userAction: this.getLastUserAction(),
		};

		this.errors.push(errorReport);

		// Keep only the last maxErrors
		if (this.errors.length > this.maxErrors) {
			this.errors = this.errors.slice(-this.maxErrors);
		}

		// Log to console with mobile-friendly formatting
		console.group(`🚨 Error captured: ${errorReport.message}`);
		console.error("Error:", error);
		console.info("Context:", errorInfo);
		console.info("Device:", this.deviceInfo);
		console.groupEnd();

		// In development, show a toast or notification
		if (process.env.NODE_ENV === "development") {
			this.showErrorNotification(errorReport);
		}

		// Store in localStorage for debugging
		this.saveErrorReport(errorReport);
	}

	getLastUserAction() {
		// Track last user interaction for better debugging
		const actions = ["click", "touchstart", "keydown", "scroll"];
		return actions
			.map((action) => ({
				action,
				timestamp: localStorage.getItem(`last_${action}`),
			}))
			.filter((item) => item.timestamp);
	}

	saveErrorReport(errorReport) {
		try {
			const reports = JSON.parse(localStorage.getItem("errorReports") || "[]");
			reports.push(errorReport);
			// Keep only last 10 reports in localStorage
			if (reports.length > 10) {
				reports.splice(0, reports.length - 10);
			}
			localStorage.setItem("errorReports", JSON.stringify(reports));
		} catch (e) {
			console.warn("Could not save error report to localStorage:", e);
		}
	}

	getErrorReports() {
		try {
			return JSON.parse(localStorage.getItem("errorReports") || "[]");
		} catch (e) {
			return [];
		}
	}

	clearErrorReports() {
		this.errors = [];
		localStorage.removeItem("errorReports");
	}

	showErrorNotification(errorReport) {
		// Create a simple notification for development
		const notification = document.createElement("div");
		notification.style.cssText = `
			position: fixed;
			bottom: 20px;
			right: 20px;
			background: #ff4444;
			color: white;
			padding: 10px 15px;
			border-radius: 5px;
			z-index: 10000;
			max-width: 300px;
			font-family: monospace;
			font-size: 12px;
		`;
		notification.innerHTML = `
			<strong>Error:</strong> ${errorReport.message}<br>
			<small>Check console for details</small>
		`;

		document.body.appendChild(notification);

		setTimeout(() => {
			if (notification.parentNode) {
				notification.parentNode.removeChild(notification);
			}
		}, 5000);
	}

	// Mobile-specific error handling
	handleMobileSpecificErrors(error) {
		if (!isMobile()) return;

		// Handle common mobile errors
		if (error.message.includes("Network request failed")) {
			console.info("💡 Mobile tip: Check your internet connection");
		}

		if (
			error.message.includes("NotAllowedError") &&
			error.message.includes("play")
		) {
			console.info("💡 Mobile tip: Audio requires user interaction on mobile");
		}

		if (error.message.includes("QuotaExceededError")) {
			console.info("💡 Mobile tip: Storage quota exceeded. Try clearing cache");
		}
	}
}

// Create singleton instance
const crashReporter = new CrashReporter();

// Auto-initialize
if (typeof window !== "undefined") {
	crashReporter.init();
}

export default crashReporter;
