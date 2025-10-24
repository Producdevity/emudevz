import React, { PureComponent } from "react";
import classNames from "classnames";
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
		isTransitioning: false,
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
						<Terminal
							ref={(ref) => {
								this.instances.Terminal = ref;
							}}
						/>
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

		// Focus the new tab
		setTimeout(() => {
			this.setState({ activeTab: tabName, isTransitioning: false });
			this.focus(tabName);
		}, 150);
	}

	handleTouchStart(e) {
		this.setState({ touchStartX: e.touches[0].clientX });
	}

	handleTouchEnd(e) {
		this.setState({ touchEndX: e.changedTouches[0].clientX });
		this.handleSwipeGesture();
	}

	handleSwipeGesture() {
		const { touchStartX, touchEndX, activeTab } = this.state;
		const swipeThreshold = 50;
		const diff = touchStartX - touchEndX;

		if (Math.abs(diff) < swipeThreshold) return;

		const tabs = ["Terminal", "Code", "Emulator"];
		const currentIndex = tabs.indexOf(activeTab);

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
	}
}
