import React, { PureComponent } from "react";
import classNames from "classnames";
import _ from "lodash";
import Level from "../../../level/Level";
import { bus } from "../../../utils";
import MobileChat from "../MobileChat";
import Layout from "./Layout";
import styles from "./MobileTabLayout.module.css";

export default class MobileTabLayout extends Layout {
	static get requiredComponentNames() {
		return ["Code", "Terminal", "Emulator"];
	}

	static get isMobileLayout() {
		return true;
	}

	state = {
		activeTab: "Terminal",
		touchStartX: 0,
		touchEndX: 0,
		touchStartTime: 0,
		isTransitioning: false,
		isChatActive: false,
		currentLevel: null,
	};

	render() {
		this.requireComponents();
		const { Code, Terminal, Emulator } = this.props;
		const { activeTab, isTransitioning } = this.state;

		return (
			<div className={styles.mobileTabLayout}>
				<div className={styles.tabContent}>
					<div
						className={classNames(
							styles.tabPanel,
							activeTab === "Code" && styles.active
						)}
					>
						<Code
							ref={(ref) => {
								this.instances.Code = ref;
							}}
						/>
					</div>

					<div
						className={classNames(
							styles.tabPanel,
							activeTab === "Terminal" && styles.active
						)}
					>
						{this.state.isChatActive ? (
							<MobileChat
								ref={(ref) => {
									if (ref && !this.instances.MobileChat) {
										this.instances.MobileChat = ref;
										// Initialize MobileChat when it's first created
										if (this.state.currentLevel) {
											ref.initialize({}, this.state.currentLevel);
										}
									}
								}}
							/>
						) : (
							<Terminal
								ref={(ref) => {
									this.instances.Terminal = ref;
								}}
							/>
						)}
					</div>

					<div
						className={classNames(
							styles.tabPanel,
							activeTab === "Emulator" && styles.active
						)}
					>
						<Emulator
							ref={(ref) => {
								this.instances.Emulator = ref;
							}}
						/>
					</div>
				</div>

				<div className={styles.tabBar}>
					<button
						className={classNames(
							styles.tabButton,
							activeTab === "Terminal" && styles.active
						)}
						onClick={() => this.switchTab("Terminal")}
						onTouchStart={(e) => this.handleTouchStart(e)}
						onTouchEnd={(e) => this.handleTouchEnd(e)}
					>
						<span className={styles.tabIcon}>💻</span>
						<span className={styles.tabLabel}>Terminal</span>
					</button>

					<button
						className={classNames(
							styles.tabButton,
							activeTab === "Code" && styles.active
						)}
						onClick={() => this.switchTab("Code")}
						onTouchStart={(e) => this.handleTouchStart(e)}
						onTouchEnd={(e) => this.handleTouchEnd(e)}
					>
						<span className={styles.tabIcon}>📝</span>
						<span className={styles.tabLabel}>Code</span>
					</button>

					<button
						className={classNames(
							styles.tabButton,
							activeTab === "Emulator" && styles.active
						)}
						onClick={() => this.switchTab("Emulator")}
						onTouchStart={(e) => this.handleTouchStart(e)}
						onTouchEnd={(e) => this.handleTouchEnd(e)}
					>
						<span className={styles.tabIcon}>🎮</span>
						<span className={styles.tabLabel}>Emulator</span>
					</button>
				</div>
			</div>
		);
	}

	switchTab(tabName) {
		if (this.state.activeTab === tabName || this.state.isTransitioning) return;

		this.setState({ isTransitioning: true });

		// Enhanced haptic feedback patterns
		this.triggerHapticFeedback("tab_switch");

		// Focus the new tab
		setTimeout(() => {
			this.setState({ activeTab: tabName, isTransitioning: false });
			this.focus(tabName);
		}, 150);
	}

	triggerHapticFeedback(type) {
		if (!window.navigator || !window.navigator.vibrate) return;

		const patterns = {
			tab_switch: [10], // Light tap
			swipe: [20, 10, 20], // Double tap for swipe
			error: [100, 50, 100], // Strong vibration for errors
			success: [50], // Medium vibration for success
			chat_message: [5], // Subtle vibration for chat messages
		};

		const pattern = patterns[type] || [10];
		window.navigator.vibrate(pattern);
	}

	handleTouchStart(e) {
		this.setState({
			touchStartX: e.touches[0].clientX,
			touchStartTime: Date.now(),
		});
	}

	handleTouchEnd(e) {
		this.setState({ touchEndX: e.changedTouches[0].clientX });
		this.handleSwipeGesture();
	}

	handleSwipeGesture() {
		const { touchStartX, touchEndX, touchStartTime, activeTab } = this.state;
		const swipeThreshold = 50;
		const swipeVelocityThreshold = 0.5; // pixels per millisecond
		const diff = touchStartX - touchEndX;
		const touchDuration = Date.now() - touchStartTime;
		const swipeVelocity = Math.abs(diff) / touchDuration;

		// Require both sufficient distance and minimum velocity
		if (
			Math.abs(diff) < swipeThreshold ||
			swipeVelocity < swipeVelocityThreshold
		)
			return;

		const tabs = ["Terminal", "Code", "Emulator"];
		const currentIndex = tabs.indexOf(activeTab);

		// Enhanced haptic feedback for swipe
		this.triggerHapticFeedback("swipe");

		if (diff > 0 && currentIndex < tabs.length - 1) {
			// Swipe left - next tab
			this.switchTab(tabs[currentIndex + 1]);
		} else if (diff < 0 && currentIndex > 0) {
			// Swipe right - previous tab
			this.switchTab(tabs[currentIndex - 1]);
		}
	}

	focus(instanceName) {
		super.focus(instanceName);
	}

	componentDidMount() {
		// Focus the initial tab
		this.focus(this.state.activeTab);

		// Listen for chat events
		this.chatSubscriber = bus.subscribe({
			"chat-started": ({ level }) =>
				this.setState({ isChatActive: true, currentLevel: level }),
			"chat-ended": () =>
				this.setState({ isChatActive: false, currentLevel: null }),
		});

		// Listen for mobile keyboard shortcuts
		this.mobileKeyboardSubscriber = bus.subscribe({
			"mobile-next-tab": () => {
				const tabs = ["Terminal", "Code", "Emulator"];
				const currentIndex = tabs.indexOf(this.state.activeTab);
				const nextIndex = (currentIndex + 1) % tabs.length;
				this.switchTab(tabs[nextIndex]);
			},
			"close-modal": () => {
				// Handle modal closing if needed
				if (this.state.isChatActive) {
					this.setState({ isChatActive: false, currentLevel: null });
				}
			},
		});
	}

	componentWillUnmount() {
		if (this.chatSubscriber) {
			this.chatSubscriber.release();
		}
		if (this.mobileKeyboardSubscriber) {
			this.mobileKeyboardSubscriber.release();
		}
	}
}
