import React, { PureComponent } from "react";
import { isMobile, isTouchDevice } from "../../utils/mobile";
import styles from "./MobileGameControls.module.css";

export default class MobileGameControls extends PureComponent {
	static get id() {
		return "MobileGameControls";
	}

	state = {
		isVisible: false,
		activeButtons: new Set(),
		vibrationEnabled: true,
	};

	componentDidMount() {
		// Only show on touch devices
		if (isTouchDevice() && isMobile()) {
			this.setState({ isVisible: true });
			this.setupTouchControls();
		}

		// Listen for vibration preference changes
		this.vibrationListener = window.addEventListener("storage", (e) => {
			if (e.key === "vibrationEnabled") {
				this.setState({ vibrationEnabled: e.newValue === "true" });
			}
		});

		// Load vibration preference
		const vibrationEnabled =
			localStorage.getItem("vibrationEnabled") !== "false";
		this.setState({ vibrationEnabled });
	}

	componentWillUnmount() {
		this.removeTouchControls();
		if (this.vibrationListener) {
			window.removeEventListener("storage", this.vibrationListener);
		}
	}

	setupTouchControls() {
		// Map touch events to game controls
		this.touchHandlers = {
			start: this.handleTouchStart.bind(this),
			move: this.handleTouchMove.bind(this),
			end: this.handleTouchEnd.bind(this),
		};

		// Add touch listeners to control areas
		const controlAreas = document.querySelectorAll("[data-game-control]");
		controlAreas.forEach((area) => {
			area.addEventListener("touchstart", this.touchHandlers.start, {
				passive: false,
			});
			area.addEventListener("touchmove", this.touchHandlers.move, {
				passive: false,
			});
			area.addEventListener("touchend", this.touchHandlers.end, {
				passive: false,
			});
		});
	}

	removeTouchControls() {
		if (!this.touchHandlers) return;

		const controlAreas = document.querySelectorAll("[data-game-control]");
		controlAreas.forEach((area) => {
			area.removeEventListener("touchstart", this.touchHandlers.start);
			area.removeEventListener("touchmove", this.touchHandlers.move);
			area.removeEventListener("touchend", this.touchHandlers.end);
		});
	}

	handleTouchStart = (e) => {
		e.preventDefault();
		const control = e.target.closest("[data-game-control]");
		if (!control) return;

		const button = control.dataset.gameControl;
		this.setState((prevState) => ({
			activeButtons: new Set([...prevState.activeButtons, button]),
		}));

		this.emitGameEvent("buttonDown", button);
		this.vibrate();
	};

	handleTouchMove = (e) => {
		e.preventDefault();
		// Handle D-pad movement
		const control = e.target.closest('[data-game-control="dpad"]');
		if (!control) return;

		const touch = e.touches[0];
		const rect = control.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		const deltaX = touch.clientX - centerX;
		const deltaY = touch.clientY - centerY;
		const threshold = rect.width / 3;

		let direction = null;
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			direction =
				deltaX > threshold ? "right" : deltaX < -threshold ? "left" : null;
		} else {
			direction =
				deltaY > threshold ? "down" : deltaY < -threshold ? "up" : null;
		}

		if (direction) {
			this.emitGameEvent("dpad", direction);
		}
	};

	handleTouchEnd = (e) => {
		e.preventDefault();
		const control = e.target.closest("[data-game-control]");
		if (!control) return;

		const button = control.dataset.gameControl;
		this.setState((prevState) => {
			const newActiveButtons = new Set(prevState.activeButtons);
			newActiveButtons.delete(button);
			return { activeButtons: newActiveButtons };
		});

		this.emitGameEvent("buttonUp", button);
	};

	vibrate = () => {
		if (!this.state.vibrationEnabled) return;
		if (window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate(10);
		}
	};

	emitGameEvent = (type, value) => {
		// Emit to the emulator or game system
		const event = new CustomEvent("gameControl", {
			detail: { type, value },
		});
		document.dispatchEvent(event);
	};

	toggleVibration = () => {
		const newEnabled = !this.state.vibrationEnabled;
		this.setState({ vibrationEnabled: newEnabled });
		localStorage.setItem("vibrationEnabled", newEnabled.toString());
	};

	render() {
		if (!this.state.isVisible) return null;

		const { activeButtons, vibrationEnabled } = this.state;

		return (
			<div className={styles.mobileControls}>
				{/* D-Pad */}
				<div className={styles.dpad} data-game-control="dpad">
					<button
						className={`${styles.dpadButton} ${styles.dpadUp}`}
						data-game-control="up"
					>
						↑
					</button>
					<button
						className={`${styles.dpadButton} ${styles.dpadLeft}`}
						data-game-control="left"
					>
						←
					</button>
					<button
						className={`${styles.dpadButton} ${styles.dpadRight}`}
						data-game-control="right"
					>
						→
					</button>
					<button
						className={`${styles.dpadButton} ${styles.dpadDown}`}
						data-game-control="down"
					>
						↓
					</button>
					<div className={styles.dpadCenter}></div>
				</div>

				{/* Action Buttons */}
				<div className={styles.actionButtons}>
					<button
						className={`${styles.actionButton} ${
							activeButtons.has("a") ? styles.active : ""
						}`}
						data-game-control="a"
					>
						A
					</button>
					<button
						className={`${styles.actionButton} ${
							activeButtons.has("b") ? styles.active : ""
						}`}
						data-game-control="b"
					>
						B
					</button>
					<button
						className={`${styles.actionButton} ${
							activeButtons.has("select") ? styles.active : ""
						}`}
						data-game-control="select"
					>
						SELECT
					</button>
					<button
						className={`${styles.actionButton} ${
							activeButtons.has("start") ? styles.active : ""
						}`}
						data-game-control="start"
					>
						START
					</button>
				</div>

				{/* Settings */}
				<div className={styles.controlsSettings}>
					<button
						className={`${styles.settingButton} ${
							vibrationEnabled ? styles.active : ""
						}`}
						onClick={this.toggleVibration}
					>
						🔔
					</button>
				</div>
			</div>
		);
	}
}
