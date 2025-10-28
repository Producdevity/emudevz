import React, { PureComponent } from "react";
import { isMobile, isTouchDevice } from "../../utils/mobile";
import { showMobileToast } from "./MobileToast";
import styles from "./MobileOnboarding.module.css";

export default class MobileOnboarding extends PureComponent {
	static get id() {
		return "MobileOnboarding";
	}

	state = {
		isVisible: false,
		currentStep: 0,
		isCompleted: false,
	};

	steps = [
		{
			title: "Welcome to EmuDevz Mobile! 📱",
			content:
				"Learn NES development with interactive emulation. Let's get you started with the mobile interface.",
			illustration: "🎮",
		},
		{
			title: "Tab Navigation 📑",
			content:
				"Swipe left/right or tap the tabs to switch between Terminal, Code, and Emulator.",
			illustration: "👆",
		},
		{
			title: "Touch Controls 🎯",
			content:
				"Use the D-pad and action buttons for game controls. Toggle vibration with the 🔔 button.",
			illustration: "🕹️",
		},
		{
			title: "Code Editor 💻",
			content:
				"Tap to focus the editor. Use the virtual keyboard for typing. Pinch to zoom if needed.",
			illustration: "⌨️",
		},
		{
			title: "Terminal 🖥️",
			content:
				"Run commands with Ctrl+Enter. Use Tab to switch between tabs quickly.",
			illustration: "📝",
		},
		{
			title: "Ready to Go! 🚀",
			content:
				"You're all set! Start with the introduction level and build your first emulator.",
			illustration: "🎉",
		},
	];

	componentDidMount() {
		// Only show on mobile/touch devices
		if (!isMobile() || !isTouchDevice()) return;

		// Check if onboarding was completed
		const completed =
			localStorage.getItem("mobileOnboardingCompleted") === "true";
		if (completed) {
			this.setState({ isCompleted: true });
			return;
		}

		// Show onboarding after a short delay
		this.onboardingTimer = setTimeout(() => {
			this.setState({ isVisible: true });
		}, 2000);
	}

	componentWillUnmount() {
		if (this.onboardingTimer) {
			clearTimeout(this.onboardingTimer);
		}
	}

	nextStep = () => {
		const { currentStep } = this.state;
		if (currentStep < this.steps.length - 1) {
			this.setState({ currentStep: currentStep + 1 });
		} else {
			this.completeOnboarding();
		}
	};

	previousStep = () => {
		const { currentStep } = this.state;
		if (currentStep > 0) {
			this.setState({ currentStep: currentStep - 1 });
		}
	};

	completeOnboarding = () => {
		this.setState({ isVisible: false, isCompleted: true });
		localStorage.setItem("mobileOnboardingCompleted", "true");
		showMobileToast("Onboarding completed! 🎉", "success", 3000);

		// Emit completion event
		const event = new CustomEvent("mobileOnboardingCompleted");
		document.dispatchEvent(event);
	};

	skipOnboarding = () => {
		this.setState({ isVisible: false, isCompleted: true });
		localStorage.setItem("mobileOnboardingCompleted", "true");
		showMobileToast(
			"Onboarding skipped. Access it anytime from settings.",
			"info",
			3000
		);
	};

	render() {
		const { isVisible, currentStep, isCompleted } = this.state;

		if (!isVisible || isCompleted) return null;

		const step = this.steps[currentStep];
		const progress = ((currentStep + 1) / this.steps.length) * 100;

		return (
			<div className={styles.onboarding}>
				<div className={styles.overlay} onClick={this.skipOnboarding} />

				<div className={styles.content}>
					{/* Progress Bar */}
					<div className={styles.progress}>
						<div
							className={styles.progressBar}
							style={{ width: `${progress}%` }}
						/>
					</div>

					{/* Close Button */}
					<button className={styles.closeButton} onClick={this.skipOnboarding}>
						✕
					</button>

					{/* Content */}
					<div className={styles.stepContent}>
						<div className={styles.illustration}>{step.illustration}</div>

						<h2 className={styles.title}>{step.title}</h2>

						<p className={styles.description}>{step.content}</p>
					</div>

					{/* Navigation */}
					<div className={styles.navigation}>
						<button
							className={styles.navButton}
							onClick={this.previousStep}
							disabled={currentStep === 0}
						>
							Previous
						</button>

						<span className={styles.stepIndicator}>
							{currentStep + 1} / {this.steps.length}
						</span>

						<button className={styles.navButton} onClick={this.nextStep}>
							{currentStep === this.steps.length - 1 ? "Get Started" : "Next"}
						</button>
					</div>

					{/* Skip Link */}
					<button className={styles.skipLink} onClick={this.skipOnboarding}>
						Skip onboarding
					</button>
				</div>
			</div>
		);
	}
}
