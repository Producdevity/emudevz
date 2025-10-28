/**
 * Mobile Device Testing Suite
 * Provides comprehensive testing and compatibility checks for mobile devices
 */
import { getDeviceInfo, isMobile } from "./mobile.js";
import { getPerformanceMetrics } from "./mobileAnalytics.js";
import { getWebGLCapabilities } from "./webglOptimizer.js";

class MobileTestingSuite {
	constructor() {
		this.testResults = new Map();
		this.deviceProfile = null;
		this.testCallbacks = new Set();
	}

	/**
	 * Initialize testing suite
	 */
	async initialize() {
		this.deviceProfile = await this.createDeviceProfile();
		console.log("Mobile Testing Suite initialized for:", this.deviceProfile);
		return this.deviceProfile;
	}

	/**
	 * Create comprehensive device profile
	 */
	async createDeviceProfile() {
		const deviceInfo = getDeviceInfo();
		const performance = getPerformanceMetrics();
		const webglCaps = getWebGLCapabilities();

		return {
			// Basic device info
			...deviceInfo,

			// Performance metrics
			performance: {
				...performance,
				estimatedClass: this.getDeviceClass(performance),
				recommendedQuality: this.getRecommendedQuality(performance, webglCaps),
			},

			// WebGL capabilities
			webgl: webglCaps,

			// Feature support
			features: {
				touch: "ontouchstart" in window,
				haptic: "vibrate" in navigator,
				webgl: !!window.WebGLRenderingContext,
				webgl2: !!window.WebGL2RenderingContext,
				webgpu: !!navigator.gpu,
				wasm: typeof WebAssembly === "object",
				serviceWorker: "serviceWorker" in navigator,
				indexedDB: "indexedDB" in window,
				localStorage: this.testLocalStorage(),
				sessionStorage: this.testSessionStorage(),
				audio: this.testAudioSupport(),
				video: this.testVideoSupport(),
				canvas: this.testCanvasSupport(),
				webWorkers: typeof Worker !== "undefined",
				sharedWorkers: typeof SharedWorker !== "undefined",
				geolocation: "geolocation" in navigator,
				camera: await this.testCameraSupport(),
				microphone: await this.testMicrophoneSupport(),
				deviceOrientation: "DeviceOrientationEvent" in window,
				deviceMotion: "DeviceMotionEvent" in window,
				gamepad: "getGamepads" in navigator,
				pointerLock: "pointerLockElement" in document,
				fullscreen: "fullscreenElement" in document,
				webShare: "share" in navigator,
				clipboard: "clipboard" in navigator,
				notifications: "Notification" in window,
				push: "PushManager" in window,
				pwa: this.testPWASupport(),
				installPrompt: "BeforeInstallPromptEvent" in window,
			},

			// Browser-specific info
			browser: {
				name: this.getBrowserName(),
				version: this.getBrowserVersion(),
				engine: this.getBrowserEngine(),
				platform: this.getPlatform(),
				language: navigator.language,
				languages: navigator.languages,
				cookieEnabled: navigator.cookieEnabled,
				doNotTrack: navigator.doNotTrack,
				onLine: navigator.onLine,
				hardwareConcurrency: navigator.hardwareConcurrency,
				maxTouchPoints: navigator.maxTouchPoints,
				vendor: navigator.vendor,
				vendorSub: navigator.vendorSub,
			},

			// Screen and display info
			display: {
				width: screen.width,
				height: screen.height,
				availWidth: screen.availWidth,
				availHeight: screen.availHeight,
				colorDepth: screen.colorDepth,
				pixelDepth: screen.pixelDepth,
				orientation: screen.orientation?.type || "unknown",
				devicePixelRatio: window.devicePixelRatio,
				screenWidth: window.screen.width,
				screenHeight: window.screen.height,
				innerWidth: window.innerWidth,
				innerHeight: window.innerHeight,
				outerWidth: window.outerWidth,
				outerHeight: window.outerHeight,
			},

			// Network info
			network: {
				online: navigator.onLine,
				effectiveType: navigator.connection?.effectiveType || "unknown",
				downlink: navigator.connection?.downlink || 0,
				rtt: navigator.connection?.rtt || 0,
				saveData: navigator.connection?.saveData || false,
				type: navigator.connection?.type || "unknown",
			},

			// Memory info (if available)
			memory: navigator.deviceMemory
				? {
						deviceMemory: navigator.deviceMemory,
						totalJSHeapSize: performance.memory?.totalJSHeapSize,
						usedJSHeapSize: performance.memory?.usedJSHeapSize,
						jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit,
				  }
				: null,

			// Battery info (if available)
			battery: await this.getBatteryInfo(),

			// Timestamp
			timestamp: Date.now(),
		};
	}

	/**
	 * Get device performance class
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
	 * Get recommended quality settings
	 */
	getRecommendedQuality(performance, webglCaps) {
		const deviceClass = this.getDeviceClass(performance);
		const { maxTextureSize, maxVertexAttributes, maxTextureUnits } = webglCaps;

		const qualityMap = {
			high: {
				resolution: "native",
				shadows: true,
				antialiasing: true,
				particles: "high",
				textures: "high",
				effects: "all",
				maxTextureSize,
				maxVertexAttributes,
				maxTextureUnits,
			},
			medium: {
				resolution: "1080p",
				shadows: true,
				antialiasing: "fxaa",
				particles: "medium",
				textures: "medium",
				effects: "most",
				maxTextureSize: Math.min(maxTextureSize, 2048),
				maxVertexAttributes: Math.min(maxVertexAttributes, 16),
				maxTextureUnits: Math.min(maxTextureUnits, 16),
			},
			low: {
				resolution: "720p",
				shadows: false,
				antialiasing: false,
				particles: "low",
				textures: "low",
				effects: "basic",
				maxTextureSize: Math.min(maxTextureSize, 1024),
				maxVertexAttributes: Math.min(maxVertexAttributes, 8),
				maxTextureUnits: Math.min(maxTextureUnits, 8),
			},
			"very-low": {
				resolution: "480p",
				shadows: false,
				antialiasing: false,
				particles: "minimal",
				textures: "basic",
				effects: "minimal",
				maxTextureSize: Math.min(maxTextureSize, 512),
				maxVertexAttributes: Math.min(maxVertexAttributes, 4),
				maxTextureUnits: Math.min(maxTextureUnits, 4),
			},
		};

		return qualityMap[deviceClass];
	}

	/**
	 * Run comprehensive compatibility tests
	 */
	async runCompatibilityTests() {
		const tests = [
			this.testTouchInteractions(),
			this.testHapticFeedback(),
			this.testAudioPlayback(),
			this.testVideoPlayback(),
			this.testWebGLRendering(),
			this.testCanvasPerformance(),
			this.testLocalStorage(),
			this.testIndexedDB(),
			this.testServiceWorker(),
			this.testWebWorkers(),
			this.testGeolocation(),
			this.testCamera(),
			this.testMicrophone(),
			this.testDeviceOrientation(),
			this.testGamepad(),
			this.testFullscreen(),
			this.testWebShare(),
			this.testClipboard(),
			this.testNotifications(),
			this.testPWAFeatures(),
			this.testNetworkConditions(),
			this.testBatteryOptimization(),
		];

		const results = await Promise.allSettled(tests);
		const testResults = {};

		results.forEach((result, index) => {
			const testName = tests[index].name || `test_${index}`;
			testResults[testName] = {
				status: result.status,
				value: result.status === "fulfilled" ? result.value : null,
				error: result.status === "rejected" ? result.reason.message : null,
			};
		});

		this.testResults = new Map(Object.entries(testResults));
		this.notifyTestCallbacks(testResults);

		return testResults;
	}

	/**
	 * Test touch interactions
	 */
	async testTouchInteractions() {
		if (!("ontouchstart" in window)) {
			return { supported: false, reason: "Touch events not supported" };
		}

		return new Promise((resolve) => {
			const testElement = document.createElement("div");
			testElement.style.position = "fixed";
			testElement.style.top = "0";
			testElement.style.left = "0";
			testElement.style.width = "10px";
			testElement.style.height = "10px";
			testElement.style.zIndex = "9999";
			testElement.style.backgroundColor = "red";

			document.body.appendChild(testElement);

			let touchReceived = false;
			let touchCount = 0;

			const handleTouch = (e) => {
				touchReceived = true;
				touchCount = e.touches.length;

				testElement.removeEventListener("touchstart", handleTouch);
				document.body.removeChild(testElement);

				resolve({
					supported: true,
					touchReceived,
					touchCount,
					maxTouchPoints: navigator.maxTouchPoints,
					multiTouch: navigator.maxTouchPoints > 1,
				});
			};

			testElement.addEventListener("touchstart", handleTouch);

			// Timeout after 5 seconds
			setTimeout(() => {
				if (!touchReceived) {
					testElement.removeEventListener("touchstart", handleTouch);
					if (document.body.contains(testElement)) {
						document.body.removeChild(testElement);
					}
					resolve({
						supported: true,
						touchReceived: false,
						reason: "No touch detected within timeout",
						maxTouchPoints: navigator.maxTouchPoints,
					});
				}
			}, 5000);
		});
	}

	/**
	 * Test haptic feedback
	 */
	async testHapticFeedback() {
		if (!("vibrate" in navigator)) {
			return { supported: false, reason: "Vibration API not supported" };
		}

		try {
			// Test basic vibration
			const vibrateResult = navigator.vibrate(100);

			// Test vibration pattern
			const patternResult = navigator.vibrate([100, 50, 100]);

			return {
				supported: true,
				basicVibration: vibrateResult,
				patternVibration: patternResult,
				maxVibrationDuration: this.getMaxVibrationDuration(),
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
			};
		}
	}

	/**
	 * Test audio playback
	 */
	async testAudioPlayback() {
		const audio = new Audio();

		try {
			// Test audio context creation
			const audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();

			// Test audio formats
			const formats = {
				mp3: audio.canPlayType("audio/mpeg"),
				wav: audio.canPlayType("audio/wav"),
				ogg: audio.canPlayType("audio/ogg"),
				aac: audio.canPlayType("audio/aac"),
				flac: audio.canPlayType("audio/flac"),
			};

			// Test audio features
			const features = {
				webAudio: !!audioContext,
				audioWorklet: !!audioContext.audioWorklet,
				stereoPanner: !!audioContext.createStereoPanner,
				analyser: !!audioContext.createAnalyser,
				dynamicsCompressor: !!audioContext.createDynamicsCompressor,
				oscillator: !!audioContext.createOscillator,
				gain: !!audioContext.createGain,
			};

			audioContext.close();

			return {
				supported: true,
				formats,
				features,
				sampleRate: audioContext.sampleRate,
				state: audioContext.state,
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
			};
		}
	}

	/**
	 * Test video playback
	 */
	async testVideoPlayback() {
		const video = document.createElement("video");

		try {
			// Test video formats
			const formats = {
				mp4: video.canPlayType("video/mp4"),
				webm: video.canPlayType("video/webm"),
				ogg: video.canPlayType("video/ogg"),
				hls: video.canPlayType("application/x-mpegURL"),
				dash: video.canPlayType("application/dash+xml"),
			};

			// Test video features
			const features = {
				pictureInPicture: "pictureInPictureEnabled" in document,
				fullscreen: "requestFullscreen" in video,
				playbackRate: "playbackRate" in video,
				volume: "volume" in video,
				muted: "muted" in video,
				controls: "controls" in video,
				autoplay: "autoplay" in video,
				loop: "loop" in video,
				poster: "poster" in video,
			};

			return {
				supported: true,
				formats,
				features,
				width: screen.width,
				height: screen.height,
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
			};
		}
	}

	/**
	 * Test WebGL rendering
	 */
	async testWebGLRendering() {
		const canvas = document.createElement("canvas");
		const gl =
			canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		if (!gl) {
			return { supported: false, reason: "WebGL not supported" };
		}

		try {
			// Test basic rendering
			const program = gl.createProgram();

			// Test extensions
			const extensions = {
				WEBGL_depth_texture: gl.getExtension("WEBGL_depth_texture"),
				OES_texture_float: gl.getExtension("OES_texture_float"),
				OES_texture_half_float: gl.getExtension("OES_texture_half_float"),
				WEBGL_lose_context: gl.getExtension("WEBGL_lose_context"),
				OES_standard_derivatives: gl.getExtension("OES_standard_derivatives"),
				OES_vertex_array_object: gl.getExtension("OES_vertex_array_object"),
				WEBGL_draw_buffers: gl.getExtension("WEBGL_draw_buffers"),
				OES_element_index_uint: gl.getExtension("OES_element_index_uint"),
			};

			// Test capabilities
			const capabilities = {
				maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
				maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
				maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
				maxVertexTextureImageUnits: gl.getParameter(
					gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS
				),
				maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
				maxFragmentUniformVectors: gl.getParameter(
					gl.MAX_FRAGMENT_UNIFORM_VECTORS
				),
				maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
				aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
				aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
				maxTextureMaxAnisotropy:
					gl.getParameter(gl.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1,
			};

			// Test WebGL2 if available
			const gl2 = canvas.getContext("webgl2");
			const webgl2Supported = !!gl2;

			return {
				supported: true,
				webgl2: webgl2Supported,
				extensions: Object.keys(extensions).filter((key) => !!extensions[key]),
				capabilities,
				vendor: gl.getParameter(gl.VENDOR),
				renderer: gl.getParameter(gl.RENDERER),
				version: gl.getParameter(gl.VERSION),
				shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
			};
		}
	}

	/**
	 * Test canvas performance
	 */
	async testCanvasPerformance() {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			return { supported: false, reason: "Canvas 2D not supported" };
		}

		try {
			// Test basic drawing performance
			const startTime = performance.now();

			for (let i = 0; i < 1000; i++) {
				ctx.fillStyle = `hsl(${i % 360}, 50%, 50%)`;
				ctx.fillRect(i % 100, Math.floor(i / 100), 10, 10);
			}

			const endTime = performance.now();
			const drawTime = endTime - startTime;

			// Test canvas features
			const features = {
				fillText: typeof ctx.fillText === "function",
				strokeText: typeof ctx.strokeText === "function",
				drawImage: typeof ctx.drawImage === "function",
				createImageData: typeof ctx.createImageData === "function",
				createLinearGradient: typeof ctx.createLinearGradient === "function",
				createRadialGradient: typeof ctx.createRadialGradient === "function",
				createPattern: typeof ctx.createPattern === "function",
				save: typeof ctx.save === "function",
				restore: typeof ctx.restore === "function",
				transform: typeof ctx.transform === "function",
			};

			return {
				supported: true,
				performance: {
					drawTime,
					drawRate: 1000 / drawTime,
					fast: drawTime < 100,
				},
				features,
				width: canvas.width,
				height: canvas.height,
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
			};
		}
	}

	/**
	 * Test local storage
	 */
	testLocalStorage() {
		try {
			const testKey = "test_local_storage";
			const testValue = "test_value";

			localStorage.setItem(testKey, testValue);
			const retrieved = localStorage.getItem(testKey);
			localStorage.removeItem(testKey);

			return retrieved === testValue;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Test session storage
	 */
	testSessionStorage() {
		try {
			const testKey = "test_session_storage";
			const testValue = "test_value";

			sessionStorage.setItem(testKey, testValue);
			const retrieved = sessionStorage.getItem(testKey);
			sessionStorage.removeItem(testKey);

			return retrieved === testValue;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Test audio support
	 */
	testAudioSupport() {
		const audio = document.createElement("audio");
		return {
			element: !!audio,
			canPlayType: typeof audio.canPlayType === "function",
			context: !!(window.AudioContext || window.webkitAudioContext),
		};
	}

	/**
	 * Test video support
	 */
	testVideoSupport() {
		const video = document.createElement("video");
		return {
			element: !!video,
			canPlayType: typeof video.canPlayType === "function",
		};
	}

	/**
	 * Test canvas support
	 */
	testCanvasSupport() {
		const canvas = document.createElement("canvas");
		return {
			element: !!canvas,
			context2d: !!canvas.getContext("2d"),
			webgl: !!(
				canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
			),
			webgl2: !!canvas.getContext("webgl2"),
		};
	}

	/**
	 * Test camera support
	 */
	async testCameraSupport() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			stream.getTracks().forEach((track) => track.stop());
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Test microphone support
	 */
	async testMicrophoneSupport() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().forEach((track) => track.stop());
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Test PWA support
	 */
	testPWASupport() {
		return {
			serviceWorker: "serviceWorker" in navigator,
			manifest: "onbeforeinstallprompt" in window,
			push: "PushManager" in window,
			notifications: "Notification" in window,
			splashScreen: "splashScreen" in window,
			standalone: window.matchMedia("(display-mode: standalone)").matches,
		};
	}

	/**
	 * Get battery info
	 */
	async getBatteryInfo() {
		if (!("getBattery" in navigator)) {
			return null;
		}

		try {
			const battery = await navigator.getBattery();
			return {
				level: battery.level,
				charging: battery.charging,
				chargingTime: battery.chargingTime,
				dischargingTime: battery.dischargingTime,
			};
		} catch (error) {
			return null;
		}
	}

	/**
	 * Get browser name
	 */
	getBrowserName() {
		const userAgent = navigator.userAgent;

		if (userAgent.includes("Firefox")) return "Firefox";
		if (userAgent.includes("Chrome")) return "Chrome";
		if (userAgent.includes("Safari")) return "Safari";
		if (userAgent.includes("Edge")) return "Edge";
		if (userAgent.includes("Opera")) return "Opera";

		return "Unknown";
	}

	/**
	 * Get browser version
	 */
	getBrowserVersion() {
		const userAgent = navigator.userAgent;
		const match = userAgent.match(/(Firefox|Chrome|Safari|Edge|Opera)\/(\d+)/);
		return match ? match[2] : "Unknown";
	}

	/**
	 * Get browser engine
	 */
	getBrowserEngine() {
		const userAgent = navigator.userAgent;

		if (userAgent.includes("WebKit")) return "WebKit";
		if (userAgent.includes("Gecko")) return "Gecko";
		if (userAgent.includes("Trident")) return "Trident";
		if (userAgent.includes("Presto")) return "Presto";

		return "Unknown";
	}

	/**
	 * Get platform
	 */
	getPlatform() {
		const userAgent = navigator.userAgent;

		if (userAgent.includes("iPhone")) return "iOS";
		if (userAgent.includes("iPad")) return "iPadOS";
		if (userAgent.includes("Android")) return "Android";
		if (userAgent.includes("Windows Phone")) return "Windows Phone";
		if (userAgent.includes("Mac")) return "macOS";
		if (userAgent.includes("Windows")) return "Windows";
		if (userAgent.includes("Linux")) return "Linux";

		return "Unknown";
	}

	/**
	 * Get max vibration duration
	 */
	getMaxVibrationDuration() {
		// Most devices limit vibration to 5 seconds
		return 5000;
	}

	/**
	 * Test indexedDB
	 */
	async testIndexedDB() {
		if (!("indexedDB" in window)) {
			return { supported: false, reason: "IndexedDB not supported" };
		}

		try {
			const request = indexedDB.open("test_db", 1);

			return new Promise((resolve) => {
				request.onsuccess = () => {
					request.result.close();
					resolve({ supported: true });
				};

				request.onerror = () => {
					resolve({ supported: false, error: request.error.message });
				};
			});
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Test service worker
	 */
	async testServiceWorker() {
		if (!("serviceWorker" in navigator)) {
			return { supported: false, reason: "Service Worker not supported" };
		}

		try {
			const registration = await navigator.serviceWorker.register(
				"/test-sw.js",
				{ scope: "/" }
			);
			await registration.unregister();
			return { supported: true };
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Test web workers
	 */
	async testWebWorkers() {
		if (typeof Worker === "undefined") {
			return { supported: false, reason: "Web Workers not supported" };
		}

		try {
			const worker = new Worker(
				"data:text/javascript;base64," + btoa('self.postMessage("test")')
			);

			return new Promise((resolve) => {
				worker.onmessage = (e) => {
					worker.terminate();
					resolve({ supported: true, message: e.data });
				};

				worker.onerror = (error) => {
					worker.terminate();
					resolve({ supported: false, error: error.message });
				};

				setTimeout(() => {
					worker.terminate();
					resolve({ supported: false, reason: "Worker timeout" });
				}, 5000);
			});
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Test geolocation
	 */
	async testGeolocation() {
		if (!("geolocation" in navigator)) {
			return { supported: false, reason: "Geolocation not supported" };
		}

		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					resolve({
						supported: true,
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy,
					});
				},
				(error) => {
					resolve({
						supported: true,
						error: error.message,
						permissionDenied: error.code === error.PERMISSION_DENIED,
					});
				},
				{ timeout: 5000 }
			);
		});
	}

	/**
	 * Test camera
	 */
	async testCamera() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			const track = stream.getVideoTracks()[0];
			const capabilities = track.getCapabilities();

			stream.getTracks().forEach((track) => track.stop());

			return {
				supported: true,
				capabilities: {
					width: capabilities?.width,
					height: capabilities?.height,
					facingMode: capabilities?.facingMode,
					torch: capabilities?.torch,
				},
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
				permissionDenied: error.name === "NotAllowedError",
			};
		}
	}

	/**
	 * Test microphone
	 */
	async testMicrophone() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const track = stream.getAudioTracks()[0];
			const capabilities = track.getCapabilities();

			stream.getTracks().forEach((track) => track.stop());

			return {
				supported: true,
				capabilities: {
					sampleRate: capabilities?.sampleRate,
					channelCount: capabilities?.channelCount,
					echoCancellation: capabilities?.echoCancellation,
					noiseSuppression: capabilities?.noiseSuppression,
				},
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
				permissionDenied: error.name === "NotAllowedError",
			};
		}
	}

	/**
	 * Test device orientation
	 */
	async testDeviceOrientation() {
		if (!("DeviceOrientationEvent" in window)) {
			return {
				supported: false,
				reason: "DeviceOrientationEvent not supported",
			};
		}

		return new Promise((resolve) => {
			const handleOrientation = (event) => {
				window.removeEventListener("deviceorientation", handleOrientation);
				resolve({
					supported: true,
					alpha: event.alpha,
					beta: event.beta,
					gamma: event.gamma,
					absolute: event.absolute,
				});
			};

			window.addEventListener("deviceorientation", handleOrientation);

			// Check for permission (iOS 13+)
			if (typeof DeviceOrientationEvent.requestPermission === "function") {
				DeviceOrientationEvent.requestPermission()
					.then((response) => {
						if (response !== "granted") {
							window.removeEventListener(
								"deviceorientation",
								handleOrientation
							);
							resolve({ supported: false, reason: "Permission denied" });
						}
					})
					.catch((error) => {
						window.removeEventListener("deviceorientation", handleOrientation);
						resolve({ supported: false, error: error.message });
					});
			}

			// Timeout after 5 seconds
			setTimeout(() => {
				window.removeEventListener("deviceorientation", handleOrientation);
				resolve({ supported: false, reason: "No orientation data received" });
			}, 5000);
		});
	}

	/**
	 * Test gamepad
	 */
	async testGamepad() {
		if (!("getGamepads" in navigator)) {
			return { supported: false, reason: "Gamepad API not supported" };
		}

		const gamepads = navigator.getGamepads();
		const connectedGamepads = Array.from(gamepads).filter((gamepad) => gamepad);

		return {
			supported: true,
			connected: connectedGamepads.length,
			gamepads: connectedGamepads.map((gamepad) => ({
				id: gamepad.id,
				index: gamepad.index,
				connected: gamepad.connected,
				mapping: gamepad.mapping,
				timestamp: gamepad.timestamp,
				axes: gamepad.axes.length,
				buttons: gamepad.buttons.length,
			})),
		};
	}

	/**
	 * Test fullscreen
	 */
	async testFullscreen() {
		const element = document.documentElement;

		if (!("requestFullscreen" in element)) {
			return { supported: false, reason: "Fullscreen API not supported" };
		}

		try {
			// Note: We can't actually test fullscreen without user interaction
			// So we just check if the API is available
			return {
				supported: true,
				requestFullscreen: "requestFullscreen" in element,
				exitFullscreen: "exitFullscreen" in document,
				fullscreenElement: "fullscreenElement" in document,
				fullscreenEnabled: "fullscreenEnabled" in document,
			};
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Test web share
	 */
	async testWebShare() {
		if (!("share" in navigator)) {
			return { supported: false, reason: "Web Share API not supported" };
		}

		try {
			// Note: We can't actually test sharing without user interaction
			// So we just check if the API is available
			return {
				supported: true,
				canShare: typeof navigator.canShare === "function",
			};
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Test clipboard
	 */
	async testClipboard() {
		if (!("clipboard" in navigator)) {
			return { supported: false, reason: "Clipboard API not supported" };
		}

		try {
			const text = "test clipboard";
			await navigator.clipboard.writeText(text);
			const readText = await navigator.clipboard.readText();

			return {
				supported: true,
				write: true,
				read: true,
				success: readText === text,
			};
		} catch (error) {
			return {
				supported: false,
				error: error.message,
				permissionDenied: error.name === "NotAllowedError",
			};
		}
	}

	/**
	 * Test notifications
	 */
	async testNotifications() {
		if (!("Notification" in window)) {
			return { supported: false, reason: "Notification API not supported" };
		}

		try {
			const permission = await Notification.requestPermission();

			return {
				supported: true,
				permission,
				granted: permission === "granted",
				denied: permission === "denied",
				default: permission === "default",
			};
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Test PWA features
	 */
	async testPWAFeatures() {
		const features = {
			serviceWorker: "serviceWorker" in navigator,
			manifest: "onbeforeinstallprompt" in window,
			push: "PushManager" in navigator,
			notifications: "Notification" in window,
			splashScreen: "splashScreen" in window,
			standalone: window.matchMedia("(display-mode: standalone)").matches,
		};

		// Test service worker registration
		let serviceWorkerTest = null;
		if (features.serviceWorker) {
			try {
				const registration = await navigator.serviceWorker.register(
					"/test-sw.js",
					{ scope: "/" }
				);
				await registration.unregister();
				serviceWorkerTest = { supported: true };
			} catch (error) {
				serviceWorkerTest = { supported: false, error: error.message };
			}
		}

		return {
			features,
			serviceWorker: serviceWorkerTest,
		};
	}

	/**
	 * Test network conditions
	 */
	async testNetworkConditions() {
		const connection =
			navigator.connection ||
			navigator.mozConnection ||
			navigator.webkitConnection;

		if (!connection) {
			return {
				supported: false,
				reason: "Network Information API not supported",
			};
		}

		return {
			supported: true,
			effectiveType: connection.effectiveType,
			downlink: connection.downlink,
			rtt: connection.rtt,
			saveData: connection.saveData,
			type: connection.type,
		};
	}

	/**
	 * Test battery optimization
	 */
	async testBatteryOptimization() {
		if (!("getBattery" in navigator)) {
			return { supported: false, reason: "Battery API not supported" };
		}

		try {
			const battery = await navigator.getBattery();

			return {
				supported: true,
				level: battery.level,
				charging: battery.charging,
				chargingTime: battery.chargingTime,
				dischargingTime: battery.dischargingTime,
				lowPower: battery.level < 0.2,
			};
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	/**
	 * Register test callback
	 */
	onTestComplete(callback) {
		this.testCallbacks.add(callback);
		return () => this.testCallbacks.delete(callback);
	}

	/**
	 * Notify test callbacks
	 */
	notifyTestCallbacks(results) {
		this.testCallbacks.forEach((callback) => {
			try {
				callback(results);
			} catch (error) {
				console.error("Test callback error:", error);
			}
		});
	}

	/**
	 * Generate test report
	 */
	generateTestReport() {
		if (!this.deviceProfile || !this.testResults.size) {
			return null;
		}

		const report = {
			device: this.deviceProfile,
			tests: Object.fromEntries(this.testResults),
			summary: {
				totalTests: this.testResults.size,
				passedTests: Array.from(this.testResults.values()).filter(
					(test) => test.status === "fulfilled"
				).length,
				failedTests: Array.from(this.testResults.values()).filter(
					(test) => test.status === "rejected"
				).length,
				deviceClass: this.deviceProfile.performance.estimatedClass,
				recommendedQuality: this.deviceProfile.performance.recommendedQuality,
			},
			timestamp: Date.now(),
		};

		return report;
	}

	/**
	 * Export test data
	 */
	exportTestData() {
		const report = this.generateTestReport();
		if (!report) return null;

		const dataStr = JSON.stringify(report, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement("a");
		link.href = url;
		link.download = `mobile-test-report-${Date.now()}.json`;
		link.click();

		URL.revokeObjectURL(url);
		return report;
	}
}

// Create singleton instance
const mobileTestingSuite = new MobileTestingSuite();

export default mobileTestingSuite;
export { MobileTestingSuite };
