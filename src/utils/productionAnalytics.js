/**
 * Production Analytics System
 * Comprehensive analytics for mobile deployment monitoring
 */
import { getDeviceInfo } from "./mobile.js";
import { getPerformanceMetrics } from "./mobileAnalytics.js";

class ProductionAnalytics {
	constructor() {
		this.events = [];
		this.sessionStart = Date.now();
		this.userId = this.getUserId();
		this.sessionId = this.generateSessionId();
		this.deviceInfo = getDeviceInfo();
		this.performanceMetrics = {};

		this.initialize();
	}

	initialize() {
		// Track session start
		this.trackEvent("session_start", {
			userId: this.userId,
			sessionId: this.sessionId,
			deviceInfo: this.deviceInfo,
			timestamp: Date.now(),
			userAgent: navigator.userAgent,
			referrer: document.referrer,
			landingPage: window.location.pathname,
		});

		// Track page views
		this.trackPageView();

		// Track performance metrics
		this.trackPerformance();

		// Track errors
		this.trackErrors();

		// Track user interactions
		this.trackInteractions();

		// Track mobile-specific events
		this.trackMobileEvents();

		// Setup periodic sync
		this.setupPeriodicSync();

		// Setup page unload tracking
		this.setupPageUnloadTracking();
	}

	getUserId() {
		let userId = localStorage.getItem("analytics_user_id");
		if (!userId) {
			userId =
				"user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
			localStorage.setItem("analytics_user_id", userId);
		}
		return userId;
	}

	generateSessionId() {
		return (
			"session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
		);
	}

	trackEvent(eventName, data = {}) {
		const event = {
			eventName,
			userId: this.userId,
			sessionId: this.sessionId,
			timestamp: Date.now(),
			url: window.location.href,
			...data,
		};

		this.events.push(event);

		// Send immediately for critical events
		if (this.isCriticalEvent(eventName)) {
			this.sendEvents([event]);
		}
	}

	trackPageView() {
		this.trackEvent("page_view", {
			page: window.location.pathname,
			title: document.title,
			referrer: document.referrer,
			search: window.location.search,
			hash: window.location.hash,
		});

		// Track SPA navigation
		let lastPath = window.location.pathname;
		const observer = new MutationObserver(() => {
			if (window.location.pathname !== lastPath) {
				lastPath = window.location.pathname;
				this.trackEvent("spa_navigation", {
					from: lastPath,
					to: window.location.pathname,
				});
			}
		});

		observer.observe(document, { subtree: true, childList: true });
	}

	trackPerformance() {
		// Track Core Web Vitals
		if ("web-vitals" in window) {
			import("web-vitals").then(
				({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
					getCLS((metric) => this.trackWebVital("CLS", metric));
					getFID((metric) => this.trackWebVital("FID", metric));
					getFCP((metric) => this.trackWebVital("FCP", metric));
					getLCP((metric) => this.trackWebVital("LCP", metric));
					getTTFB((metric) => this.trackWebVital("TTFB", metric));
				}
			);
		}

		// Track custom performance metrics
		this.trackCustomPerformance();

		// Track memory usage
		this.trackMemoryUsage();

		// Track network performance
		this.trackNetworkPerformance();
	}

	trackWebVital(name, metric) {
		this.trackEvent("web_vital", {
			vitalName: name,
			value: metric.value,
			rating: metric.rating,
			delta: metric.delta,
			id: metric.id,
		});
	}

	trackCustomPerformance() {
		// Track frame rate
		let frameCount = 0;
		let lastTime = performance.now();

		const measureFPS = () => {
			frameCount++;
			const currentTime = performance.now();

			if (currentTime >= lastTime + 1000) {
				const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

				this.trackEvent("fps_measurement", {
					fps,
					frameCount,
					duration: currentTime - lastTime,
				});

				frameCount = 0;
				lastTime = currentTime;
			}

			requestAnimationFrame(measureFPS);
		};

		requestAnimationFrame(measureFPS);

		// Track load time
		window.addEventListener("load", () => {
			const loadTime =
				performance.timing.loadEventEnd - performance.timing.navigationStart;
			this.trackEvent("page_load_time", {
				loadTime,
				domContentLoaded:
					performance.timing.domContentLoadedEventEnd -
					performance.timing.navigationStart,
				firstPaint: performance.getEntriesByType("paint")[0]?.startTime,
				firstContentfulPaint: performance.getEntriesByType("paint")[1]
					?.startTime,
			});
		});
	}

	trackMemoryUsage() {
		if (!performance.memory) return;

		setInterval(() => {
			const memory = performance.memory;
			this.trackEvent("memory_usage", {
				usedJSHeapSize: memory.usedJSHeapSize,
				totalJSHeapSize: memory.totalJSHeapSize,
				jsHeapSizeLimit: memory.jsHeapSizeLimit,
				usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
			});
		}, 30000); // Every 30 seconds
	}

	trackNetworkPerformance() {
		if (!navigator.connection) return;

		const trackConnection = () => {
			const connection = navigator.connection;
			this.trackEvent("network_info", {
				effectiveType: connection.effectiveType,
				downlink: connection.downlink,
				rtt: connection.rtt,
				saveData: connection.saveData,
				type: connection.type,
			});
		};

		trackConnection();
		navigator.connection.addEventListener("change", trackConnection);
	}

	trackErrors() {
		// Track JavaScript errors
		window.addEventListener("error", (event) => {
			this.trackEvent("javascript_error", {
				message: event.message,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				stack: event.error?.stack,
				userAgent: navigator.userAgent,
			});
		});

		// Track unhandled promise rejections
		window.addEventListener("unhandledrejection", (event) => {
			this.trackEvent("unhandled_promise_rejection", {
				reason: event.reason?.toString() || "Unknown",
				stack: event.reason?.stack,
				userAgent: navigator.userAgent,
			});
		});

		// Track resource loading errors
		window.addEventListener(
			"error",
			(event) => {
				if (event.target !== window) {
					this.trackEvent("resource_error", {
						elementType: event.target.tagName,
						source: event.target.src || event.target.href,
						type: event.type,
					});
				}
			},
			true
		);
	}

	trackInteractions() {
		// Track clicks
		document.addEventListener("click", (event) => {
			this.trackEvent("click", {
				elementType: event.target.tagName,
				elementId: event.target.id,
				elementClass: event.target.className,
				elementText: event.target.textContent?.substring(0, 100),
				x: event.clientX,
				y: event.clientY,
				pageX: event.pageX,
				pageY: event.pageY,
			});
		});

		// Track form submissions
		document.addEventListener("submit", (event) => {
			this.trackEvent("form_submit", {
				formId: event.target.id,
				formClass: event.target.className,
				formAction: event.target.action,
			});
		});

		// Track scroll depth
		let maxScrollDepth = 0;
		const trackScroll = () => {
			const scrollDepth = Math.round(
				(window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
					100
			);

			if (scrollDepth > maxScrollDepth) {
				maxScrollDepth = scrollDepth;
				this.trackEvent("scroll_depth", {
					depth: scrollDepth,
					maxDepth: maxScrollDepth,
					scrollY: window.scrollY,
					pageHeight: document.body.scrollHeight,
				});
			}
		};

		window.addEventListener("scroll", this.throttle(trackScroll, 1000));
	}

	trackMobileEvents() {
		// Track touch events
		document.addEventListener("touchstart", (event) => {
			this.trackEvent("touch_start", {
				touchCount: event.touches.length,
				x: event.touches[0]?.clientX,
				y: event.touches[0]?.clientY,
				timestamp: Date.now(),
			});
		});

		// Track gesture events
		let touchStartTime = 0;
		let touchStartX = 0;
		let touchStartY = 0;

		document.addEventListener("touchstart", (event) => {
			touchStartTime = Date.now();
			touchStartX = event.touches[0]?.clientX || 0;
			touchStartY = event.touches[0]?.clientY || 0;
		});

		document.addEventListener("touchend", (event) => {
			const touchEndTime = Date.now();
			const touchEndX = event.changedTouches[0]?.clientX || 0;
			const touchEndY = event.changedTouches[0]?.clientY || 0;

			const duration = touchEndTime - touchStartTime;
			const deltaX = touchEndX - touchStartX;
			const deltaY = touchEndY - touchStartY;

			this.trackEvent("touch_end", {
				duration,
				deltaX,
				deltaY,
				distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
			});

			// Detect swipe gestures
			if (duration < 500 && Math.abs(deltaX) > 50) {
				this.trackEvent("swipe_gesture", {
					direction: deltaX > 0 ? "right" : "left",
					distance: Math.abs(deltaX),
					duration,
				});
			}
		});

		// Track device orientation changes
		if (window.DeviceOrientationEvent) {
			window.addEventListener("deviceorientation", (event) => {
				this.trackEvent("device_orientation", {
					alpha: event.alpha,
					beta: event.beta,
					gamma: event.gamma,
					absolute: event.absolute,
				});
			});
		}

		// Track viewport changes (virtual keyboard)
		let initialViewportHeight =
			window.visualViewport?.height || window.innerHeight;

		const handleViewportChange = () => {
			const currentHeight = window.visualViewport?.height || window.innerHeight;
			const keyboardVisible = currentHeight < initialViewportHeight * 0.8;

			if (keyboardVisible) {
				this.trackEvent("virtual_keyboard_show", {
					viewportHeight: currentHeight,
					initialHeight: initialViewportHeight,
					reduction: initialViewportHeight - currentHeight,
				});
			} else {
				this.trackEvent("virtual_keyboard_hide", {
					viewportHeight: currentHeight,
					initialHeight: initialViewportHeight,
				});
			}
		};

		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", handleViewportChange);
		}
	}

	setupPeriodicSync() {
		// Send events every 30 seconds
		setInterval(() => {
			this.sendEvents();
		}, 30000);

		// Send events when tab becomes visible
		document.addEventListener("visibilitychange", () => {
			if (!document.hidden) {
				this.sendEvents();
			}
		});
	}

	setupPageUnloadTracking() {
		// Track session end
		const trackSessionEnd = () => {
			const sessionDuration = Date.now() - this.sessionStart;

			this.trackEvent("session_end", {
				sessionDuration,
				pageViews: this.events.filter((e) => e.eventName === "page_view")
					.length,
				interactions: this.events.filter(
					(e) =>
						e.eventName.startsWith("click") || e.eventName.startsWith("touch")
				).length,
				errors: this.events.filter((e) => e.eventName.includes("error")).length,
			});

			// Send final events
			this.sendEvents();
		};

		window.addEventListener("beforeunload", trackSessionEnd);
		window.addEventListener("pagehide", trackSessionEnd);
	}

	isCriticalEvent(eventName) {
		const criticalEvents = [
			"javascript_error",
			"unhandled_promise_rejection",
			"resource_error",
			"session_end",
		];

		return criticalEvents.includes(eventName);
	}

	async sendEvents(events = null) {
		const eventsToSend = events || this.events;

		if (eventsToSend.length === 0) return;

		try {
			const response = await fetch("/api/analytics", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					events: eventsToSend,
					timestamp: Date.now(),
					version: "1.0.0",
				}),
			});

			if (response.ok) {
				// Remove sent events from queue
				if (!events) {
					this.events = this.events.filter(
						(event) => !eventsToSend.includes(event)
					);
				}
			}
		} catch (error) {
			console.warn("Failed to send analytics events:", error);

			// Store events locally for retry
			const storedEvents = JSON.parse(
				localStorage.getItem("analytics_events") || "[]"
			);
			storedEvents.push(...eventsToSend);
			localStorage.setItem("analytics_events", JSON.stringify(storedEvents));
		}
	}

	throttle(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	// Public API
	trackCustomEvent(eventName, data) {
		this.trackEvent(eventName, data);
	}

	trackConversion(goal, value = 1, currency = "USD") {
		this.trackEvent("conversion", {
			goal,
			value,
			currency,
			timestamp: Date.now(),
		});
	}

	trackFeatureUsage(featureName, action, metadata = {}) {
		this.trackEvent("feature_usage", {
			featureName,
			action,
			...metadata,
		});
	}

	getAnalyticsData() {
		return {
			userId: this.userId,
			sessionId: this.sessionId,
			sessionStart: this.sessionStart,
			sessionDuration: Date.now() - this.sessionStart,
			events: this.events,
			deviceInfo: this.deviceInfo,
		};
	}
}

// Create singleton instance
let productionAnalytics = null;

export const initProductionAnalytics = () => {
	if (!productionAnalytics) {
		productionAnalytics = new ProductionAnalytics();
	}
	return productionAnalytics;
};

export default initProductionAnalytics;
