import { bus } from "./index";
import { isMobile, isTouchDevice } from "./mobile";

class MobileGestureHandler {
	constructor() {
		this.gestures = new Map();
		this.currentGesture = null;
		this.touchPoints = new Map();
		this.isEnabled = isMobile() && isTouchDevice();
		this.gestureHistory = [];
		this.maxHistorySize = 10;

		if (this.isEnabled) {
			this.init();
		}
	}

	init() {
		document.addEventListener("touchstart", this.handleTouchStart.bind(this), {
			passive: false,
		});
		document.addEventListener("touchmove", this.handleTouchMove.bind(this), {
			passive: false,
		});
		document.addEventListener("touchend", this.handleTouchEnd.bind(this), {
			passive: false,
		});

		// Register default gestures
		this.registerDefaultGestures();
	}

	registerDefaultGestures() {
		// Two-finger swipe up - open file search
		this.registerGesture("two_finger_swipe_up", {
			fingers: 2,
			direction: "up",
			minDistance: 80,
			onRecognized: () => {
				bus.emit("file-search");
				this.triggerHapticFeedback("gesture");
			},
		});

		// Two-finger swipe down - toggle terminal
		this.registerGesture("two_finger_swipe_down", {
			fingers: 2,
			direction: "down",
			minDistance: 80,
			onRecognized: () => {
				bus.emit("toggle-terminal");
				this.triggerHapticFeedback("gesture");
			},
		});

		// Three-finger tap - toggle chat
		this.registerGesture("three_finger_tap", {
			fingers: 3,
			type: "tap",
			maxDuration: 300,
			onRecognized: () => {
				bus.emit("toggle-chat");
				this.triggerHapticFeedback("gesture");
			},
		});

		// Long press - context menu
		this.registerGesture("long_press", {
			fingers: 1,
			type: "long_press",
			minDuration: 500,
			onRecognized: (e) => {
				this.showContextMenu(e);
				this.triggerHapticFeedback("long_press");
			},
		});

		// Double tap - run code
		this.registerGesture("double_tap", {
			fingers: 1,
			type: "double_tap",
			maxInterval: 300,
			onRecognized: () => {
				bus.emit("run-code");
				this.triggerHapticFeedback("success");
			},
		});

		// Pinch to zoom - adjust font size
		this.registerGesture("pinch", {
			fingers: 2,
			type: "pinch",
			onRecognized: (scale) => {
				this.adjustFontSize(scale);
			},
		});
	}

	registerGesture(name, config) {
		this.gestures.set(name, {
			...config,
			name,
			isRecognized: false,
		});
	}

	handleTouchStart(e) {
		e.preventDefault();

		const now = Date.now();
		const touches = Array.from(e.touches);

		// Track each touch point
		touches.forEach((touch) => {
			this.touchPoints.set(touch.identifier, {
				startX: touch.clientX,
				startY: touch.clientY,
				startTime: now,
				currentX: touch.clientX,
				currentY: touch.clientY,
			});
		});

		// Check for tap gestures
		if (touches.length === 1) {
			this.checkTapGesture(touches[0]);
		}

		// Check for multi-finger gestures
		if (touches.length >= 2) {
			this.checkMultiFingerGestures(touches);
		}
	}

	handleTouchMove(e) {
		e.preventDefault();

		const touches = Array.from(e.touches);

		// Update touch points
		touches.forEach((touch) => {
			const point = this.touchPoints.get(touch.identifier);
			if (point) {
				point.currentX = touch.clientX;
				point.currentY = touch.clientY;
			}
		});

		// Check for swipe gestures
		if (touches.length === 1) {
			this.checkSwipeGesture(touches[0]);
		}

		// Check for pinch gesture
		if (touches.length === 2) {
			this.checkPinchGesture(touches);
		}
	}

	handleTouchEnd(e) {
		e.preventDefault();

		const touches = Array.from(e.changedTouches);
		const now = Date.now();

		// Process completed gestures
		touches.forEach((touch) => {
			const point = this.touchPoints.get(touch.identifier);
			if (point) {
				const duration = now - point.startTime;
				const distance = this.calculateDistance(
					point.startX,
					point.startY,
					point.currentX,
					point.currentY
				);

				// Check for long press
				if (duration >= 500 && distance < 10) {
					this.recognizeGesture("long_press", {
						duration,
						x: point.startX,
						y: point.startY,
					});
				}

				this.touchPoints.delete(touch.identifier);
			}
		});

		// Clear all touch points if no active touches
		if (e.touches.length === 0) {
			this.touchPoints.clear();
		}
	}

	checkTapGesture(touch) {
		const now = Date.now();
		const lastTap = this.gestureHistory.filter((g) => g.type === "tap").pop();

		if (lastTap && now - lastTap.timestamp < 300) {
			// Double tap detected
			this.recognizeGesture("double_tap", { touch });
		} else {
			// Single tap
			this.gestureHistory.push({
				type: "tap",
				timestamp: now,
				touch,
			});
		}
	}

	checkSwipeGesture(touch) {
		const point = this.touchPoints.get(touch.identifier);
		if (!point) return;

		const distance = this.calculateDistance(
			point.startX,
			point.startY,
			point.currentX,
			point.currentY
		);

		if (distance < 50) return; // Too short for a swipe

		const angle = this.calculateAngle(
			point.startX,
			point.startY,
			point.currentX,
			point.currentY
		);

		let direction;
		if (angle >= -45 && angle <= 45) direction = "right";
		else if (angle > 45 && angle <= 135) direction = "down";
		else if (angle > 135 || angle <= -135) direction = "left";
		else direction = "up";

		this.recognizeGesture("swipe", { direction, distance, touch });
	}

	checkMultiFingerGestures(touches) {
		const fingerCount = touches.length;

		// Check for specific multi-finger gestures
		if (fingerCount === 2) {
			this.checkTwoFingerGestures(touches);
		} else if (fingerCount === 3) {
			this.checkThreeFingerGestures(touches);
		}
	}

	checkTwoFingerGestures(touches) {
		// Calculate average movement
		const avgMovement = this.calculateAverageMovement(touches);

		if (avgMovement.distance > 80) {
			const direction = this.getSwipeDirection(
				avgMovement.deltaX,
				avgMovement.deltaY
			);

			if (direction === "up") {
				this.recognizeGesture("two_finger_swipe_up", { touches });
			} else if (direction === "down") {
				this.recognizeGesture("two_finger_swipe_down", { touches });
			}
		}
	}

	checkThreeFingerGestures(touches) {
		// Three-finger tap detection
		const now = Date.now();
		const allTouchesStationary = touches.every((touch) => {
			const point = this.touchPoints.get(touch.identifier);
			return (
				point &&
				this.calculateDistance(
					point.startX,
					point.startY,
					touch.clientX,
					touch.clientY
				) < 10
			);
		});

		if (allTouchesStationary) {
			this.recognizeGesture("three_finger_tap", { touches });
		}
	}

	checkPinchGesture(touches) {
		if (touches.length !== 2) return;

		const point1 = this.touchPoints.get(touches[0].identifier);
		const point2 = this.touchPoints.get(touches[1].identifier);

		if (!point1 || !point2) return;

		const currentDistance = this.calculateDistance(
			touches[0].clientX,
			touches[0].clientY,
			touches[1].clientX,
			touches[1].clientY
		);

		const initialDistance = this.calculateDistance(
			point1.startX,
			point1.startY,
			point2.startX,
			point2.startY
		);

		if (initialDistance > 0) {
			const scale = currentDistance / initialDistance;
			this.recognizeGesture("pinch", { scale, touches });
		}
	}

	recognizeGesture(gestureName, data) {
		const gesture = this.gestures.get(gestureName);
		if (!gesture) return;

		// Add to history
		this.gestureHistory.push({
			type: gestureName,
			timestamp: Date.now(),
			data,
		});

		// Limit history size
		if (this.gestureHistory.length > this.maxHistorySize) {
			this.gestureHistory.shift();
		}

		// Execute gesture callback
		if (gesture.onRecognized) {
			gesture.onRecognized(data);
		}

		// Emit gesture event
		bus.emit("gesture-recognized", {
			name: gestureName,
			data,
		});
	}

	calculateDistance(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
	}

	calculateAngle(x1, y1, x2, y2) {
		return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
	}

	calculateAverageMovement(touches) {
		const movements = Array.from(this.touchPoints.values()).map((point) => ({
			deltaX: point.currentX - point.startX,
			deltaY: point.currentY - point.startY,
			distance: this.calculateDistance(
				point.startX,
				point.startY,
				point.currentX,
				point.currentY
			),
		}));

		const avgMovement = {
			deltaX:
				movements.reduce((sum, m) => sum + m.deltaX, 0) / movements.length,
			deltaY:
				movements.reduce((sum, m) => sum + m.deltaY, 0) / movements.length,
			distance:
				movements.reduce((sum, m) => sum + m.distance, 0) / movements.length,
		};

		return avgMovement;
	}

	getSwipeDirection(deltaX, deltaY) {
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			return deltaX > 0 ? "right" : "left";
		} else {
			return deltaY > 0 ? "down" : "up";
		}
	}

	showContextMenu(e) {
		// Emit context menu event
		bus.emit("context-menu", {
			x: e.x || e.touches[0].clientX,
			y: e.y || e.touches[0].clientY,
		});
	}

	adjustFontSize(scale) {
		// Emit font size adjustment event
		bus.emit("adjust-font-size", { scale });
	}

	triggerHapticFeedback(type) {
		if (!window.navigator || !window.navigator.vibrate) return;

		const patterns = {
			gesture: [15],
			long_press: [50],
			success: [30],
		};

		const pattern = patterns[type] || [10];
		window.navigator.vibrate(pattern);
	}

	// Public API for custom gestures
	addCustomGesture(name, config) {
		this.registerGesture(name, config);
	}

	removeGesture(name) {
		this.gestures.delete(name);
	}

	getGestureHistory() {
		return [...this.gestureHistory];
	}

	clearGestureHistory() {
		this.gestureHistory = [];
	}

	destroy() {
		if (this.isEnabled) {
			document.removeEventListener("touchstart", this.handleTouchStart);
			document.removeEventListener("touchmove", this.handleTouchMove);
			document.removeEventListener("touchend", this.handleTouchEnd);
		}
		this.gestures.clear();
		this.touchPoints.clear();
		this.gestureHistory = [];
	}
}

// Create singleton instance
const mobileGestureHandler = new MobileGestureHandler();

export default mobileGestureHandler;
