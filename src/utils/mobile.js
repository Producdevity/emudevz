// Mobile-specific utilities and optimizations

export const isMobile = () => {
	return window.innerWidth <= 767.98;
};

// Get device information
export const getDeviceInfo = () => {
	const userAgent = navigator.userAgent;
	const platform = navigator.platform;

	return {
		userAgent,
		platform,
		browser: getBrowserName(userAgent),
		version: getBrowserVersion(userAgent),
		os: getOperatingSystem(userAgent, platform),
		isMobile: isMobile(),
		isTablet: window.innerWidth >= 768 && window.innerWidth <= 1024,
		isDesktop: window.innerWidth > 1024,
		screen: {
			width: screen.width,
			height: screen.height,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			colorDepth: screen.colorDepth,
			pixelDepth: screen.pixelDepth,
		},
		viewport: {
			width: window.innerWidth,
			height: window.innerHeight,
			outerWidth: window.outerWidth,
			outerHeight: window.outerHeight,
		},
		devicePixelRatio: window.devicePixelRatio || 1,
		touchSupport: "ontouchstart" in window,
		maxTouchPoints: navigator.maxTouchPoints || 0,
		online: navigator.onLine,
		language: navigator.language,
		languages: navigator.languages,
		hardwareConcurrency: navigator.hardwareConcurrency || 1,
		deviceMemory: navigator.deviceMemory || 0,
		connection: navigator.connection
			? {
					effectiveType: navigator.connection.effectiveType,
					downlink: navigator.connection.downlink,
					rtt: navigator.connection.rtt,
					saveData: navigator.connection.saveData,
			  }
			: null,
	};
};

// Get browser name
const getBrowserName = (userAgent) => {
	if (userAgent.includes("Firefox")) return "Firefox";
	if (userAgent.includes("Chrome")) return "Chrome";
	if (userAgent.includes("Safari")) return "Safari";
	if (userAgent.includes("Edge")) return "Edge";
	if (userAgent.includes("Opera")) return "Opera";
	return "Unknown";
};

// Get browser version
const getBrowserVersion = (userAgent) => {
	const match = userAgent.match(/(Firefox|Chrome|Safari|Edge|Opera)\/(\d+)/);
	return match ? match[2] : "Unknown";
};

// Get operating system
const getOperatingSystem = (userAgent, platform) => {
	if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
	if (userAgent.includes("Android")) return "Android";
	if (userAgent.includes("Windows Phone")) return "Windows Phone";
	if (platform.includes("Mac")) return "macOS";
	if (platform.includes("Win")) return "Windows";
	if (platform.includes("Linux")) return "Linux";
	return "Unknown";
};

// Browser detection functions
export const isChrome = () => {
	return (
		/Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)
	);
};

export const isSafari = () => {
	return (
		/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
	);
};

export const isFirefox = () => {
	return /Firefox/.test(navigator.userAgent);
};

export const isEdge = () => {
	return /Edge/.test(navigator.userAgent);
};

export const isTouchDevice = () => {
	return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

// Debounce function for mobile performance
export const debounce = (func, wait) => {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

// Throttle scroll events for better mobile performance
export const throttleScroll = (callback) => {
	let ticking = false;
	return function () {
		if (!ticking) {
			window.requestAnimationFrame(() => {
				callback();
				ticking = false;
			});
			ticking = true;
		}
	};
};

// Optimize touch events by preventing default on certain elements
export const optimizeTouchEvents = () => {
	if (!isTouchDevice()) return;

	// Add touch-action CSS to prevent unnecessary touch delays
	document.addEventListener(
		"touchstart",
		function (e) {
			// Only prevent default on certain elements to maintain functionality
			if (e.target.closest("button, a, input, textarea, select")) {
				return;
			}
		},
		{ passive: true }
	);

	// Optimize scroll performance
	document.addEventListener(
		"touchmove",
		throttleScroll(() => {
			// Scroll handling logic here if needed
		}),
		{ passive: true }
	);
};

// Detect if device is iOS for specific optimizations
export const isIOS = () => {
	return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Detect if device is Android for specific optimizations
export const isAndroid = () => {
	return /Android/.test(navigator.userAgent);
};

// Get device pixel ratio for high-DPI displays
export const getDevicePixelRatio = () => {
	return window.devicePixelRatio || 1;
};

// Optimize animations for mobile
export const optimizeAnimations = () => {
	if (!isMobile()) return;

	// Reduce motion for users who prefer it
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		document.documentElement.style.setProperty(
			"--animation-duration",
			"0.01ms"
		);
	}
};

// Handle mobile-specific errors
export const handleMobileError = (error, context = "") => {
	console.error(`Mobile Error [${context}]:`, error);

	// Show user-friendly error message on mobile
	if (isMobile()) {
		const { showMobileToast } = require("../gui/components/MobileToast");

		let message = "Something went wrong";
		if (error.message) {
			// Truncate long error messages for mobile
			message =
				error.message.length > 50
					? error.message.substring(0, 50) + "..."
					: error.message;
		}

		showMobileToast(message, "error", 5000);
	}
};

// Optimize resource usage on mobile
export const optimizeResources = () => {
	if (!isMobile()) return;

	// Reduce image quality on mobile
	const images = document.querySelectorAll("img");
	images.forEach((img) => {
		if (img.naturalWidth > 1024) {
			// Scale down large images for mobile
			img.style.imageRendering = "auto";
		}
	});

	// Disable animations on low-end devices
	if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
		document.documentElement.style.setProperty(
			"--animation-duration",
			"0.01ms"
		);
	}

	// Optimize canvas rendering
	const canvases = document.querySelectorAll("canvas");
	canvases.forEach((canvas) => {
		// Reduce canvas resolution on mobile for better performance
		const ctx = canvas.getContext("2d");
		if (ctx) {
			const scale = window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio;
			canvas.style.imageRendering = "pixelated";
		}
	});
};

// Monitor mobile performance
export const monitorMobilePerformance = () => {
	if (!isMobile()) return;

	let performanceWarningShown = false;

	// Monitor memory usage if available
	if ("memory" in performance) {
		setInterval(() => {
			const memory = performance.memory;
			const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
			const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

			// Warn if memory usage is high
			if (usedMB > limitMB * 0.8 && !performanceWarningShown) {
				console.warn(`High memory usage: ${usedMB}MB / ${limitMB}MB`);
				performanceWarningShown = true;

				const { showMobileToast } = require("../gui/components/MobileToast");
				showMobileToast("Low memory - consider refreshing", "warning", 3000);
			}
		}, 30000); // Check every 30 seconds
	}

	// Monitor FPS with adaptive quality
	let lastTime = performance.now();
	let frames = 0;
	let lowFPSCount = 0;

	const checkFPS = () => {
		frames++;
		const currentTime = performance.now();

		if (currentTime >= lastTime + 1000) {
			const fps = Math.round((frames * 1000) / (currentTime - lastTime));

			if (fps < 30) {
				lowFPSCount++;
				console.warn(`Low FPS detected: ${fps}`);

				// Auto-adjust quality after sustained low FPS
				if (lowFPSCount > 3) {
					optimizeResources();
					lowFPSCount = 0; // Reset counter
				}
			} else {
				lowFPSCount = Math.max(0, lowFPSCount - 1);
			}

			frames = 0;
			lastTime = currentTime;
		}

		requestAnimationFrame(checkFPS);
	};

	requestAnimationFrame(checkFPS);
};

// Optimize virtual keyboard behavior on mobile
export const optimizeVirtualKeyboard = () => {
	if (!isMobile()) return;

	// Handle viewport resize when virtual keyboard appears
	let initialViewportHeight =
		window.visualViewport?.height || window.innerHeight;

	const handleViewportChange = () => {
		const currentHeight = window.visualViewport?.height || window.innerHeight;
		const keyboardVisible = currentHeight < initialViewportHeight * 0.8;

		if (keyboardVisible) {
			document.body.classList.add("virtual-keyboard-open");
			// Adjust layout for keyboard
			const mobileLayout = document.querySelector(".mobileTabLayout");
			if (mobileLayout) {
				mobileLayout.style.height = `${currentHeight}px`;
			}
		} else {
			document.body.classList.remove("virtual-keyboard-open");
			const mobileLayout = document.querySelector(".mobileTabLayout");
			if (mobileLayout) {
				mobileLayout.style.height = "100%";
			}
		}
	};

	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", handleViewportChange);
	} else {
		// Fallback for older browsers
		window.addEventListener("resize", handleViewportChange);
	}
};

// Prevent zoom on input focus (iOS Safari)
export const preventInputZoom = () => {
	if (!isIOS()) return;

	const inputs = document.querySelectorAll("input, textarea, select");
	inputs.forEach((input) => {
		input.addEventListener("touchstart", () => {
			input.style.fontSize = "16px"; // Prevents zoom
		});

		input.addEventListener("blur", () => {
			input.style.fontSize = ""; // Restore original size
		});
	});
};

// Add mobile keyboard shortcuts
export const initMobileKeyboardShortcuts = () => {
	if (!isMobile()) return;

	document.addEventListener("keydown", (e) => {
		// Ctrl/Cmd + Enter to run commands in terminal
		if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
			e.preventDefault();
			bus.emit("terminal-execute");
		}

		// Escape to close modals and dialogs
		if (e.key === "Escape") {
			e.preventDefault();
			bus.emit("close-modal");
		}

		// Tab to switch between mobile tabs
		if (e.key === "Tab" && !e.ctrlKey && !e.metaKey) {
			e.preventDefault();
			bus.emit("mobile-next-tab");
		}
	});
};

// Initialize mobile optimizations
export const initMobileOptimizations = () => {
	optimizeTouchEvents();
	optimizeAnimations();
	optimizeVirtualKeyboard();
	preventInputZoom();
	initMobileKeyboardShortcuts();
	optimizeResources();

	// Add mobile-specific CSS classes
	if (isMobile()) {
		document.body.classList.add("mobile-device");
		monitorMobilePerformance();
	}

	if (isTouchDevice()) {
		document.body.classList.add("touch-device");
	}

	if (isIOS()) {
		document.body.classList.add("ios-device");
	}

	if (isAndroid()) {
		document.body.classList.add("android-device");
	}
};
