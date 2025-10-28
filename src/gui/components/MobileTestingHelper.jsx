import React, { PureComponent } from "react";
import { isAndroid, isIOS, isMobile, isTouchDevice } from "../../utils/mobile";
import styles from "./MobileTestingHelper.module.css";

export default class MobileTestingHelper extends PureComponent {
	state = {
		isVisible: false,
		metrics: {
			width: window.innerWidth,
			height: window.innerHeight,
			isMobile: isMobile(),
			isTouch: isTouchDevice(),
			isIOS: isIOS(),
			isAndroid: isAndroid(),
			devicePixelRatio: window.devicePixelRatio || 1,
			memory: null,
			fps: 0,
		},
	};

	componentDidMount() {
		// Only show in development
		if (process.env.NODE_ENV !== "development") return;

		this.updateMetrics();
		this.startFPSMonitoring();
		this.startMemoryMonitoring();

		// Show on double-tap in corner
		let tapCount = 0;
		let tapTimeout;

		const handleCornerTap = () => {
			tapCount++;
			if (tapCount === 2) {
				this.setState({ isVisible: !this.state.isVisible });
				tapCount = 0;
			}

			clearTimeout(tapTimeout);
			tapTimeout = setTimeout(() => {
				tapCount = 0;
			}, 300);
		};

		// Create invisible tap target in top-right corner
		const tapTarget = document.createElement("div");
		tapTarget.style.cssText = `
			position: fixed;
			top: 0;
			right: 0;
			width: 50px;
			height: 50px;
			z-index: 9999;
			background: transparent;
		`;
		tapTarget.addEventListener("click", handleCornerTap);
		document.body.appendChild(tapTarget);

		this.tapTarget = tapTarget;
	}

	componentWillUnmount() {
		if (this.fpsInterval) {
			cancelAnimationFrame(this.fpsInterval);
		}
		if (this.memoryInterval) {
			clearInterval(this.memoryInterval);
		}
		if (this.tapTarget) {
			document.body.removeChild(this.tapTarget);
		}
	}

	updateMetrics = () => {
		this.setState((prevState) => ({
			metrics: {
				...prevState.metrics,
				width: window.innerWidth,
				height: window.innerHeight,
			},
		}));
	};

	startFPSMonitoring = () => {
		let lastTime = performance.now();
		let frames = 0;

		const checkFPS = () => {
			frames++;
			const currentTime = performance.now();

			if (currentTime >= lastTime + 1000) {
				const fps = Math.round((frames * 1000) / (currentTime - lastTime));

				this.setState((prevState) => ({
					metrics: {
						...prevState.metrics,
						fps,
					},
				}));

				frames = 0;
				lastTime = currentTime;
			}

			this.fpsInterval = requestAnimationFrame(checkFPS);
		};

		checkFPS();
	};

	startMemoryMonitoring = () => {
		if (!("memory" in performance)) return;

		this.memoryInterval = setInterval(() => {
			const memory = performance.memory;
			const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
			const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

			this.setState((prevState) => ({
				metrics: {
					...prevState.metrics,
					memory: {
						used: usedMB,
						limit: limitMB,
						percentage: Math.round((usedMB / limitMB) * 100),
					},
				},
			}));
		}, 2000);
	};

	render() {
		const { isVisible, metrics } = this.state;

		if (!isVisible) return null;

		return (
			<div className={styles.testingHelper}>
				<div className={styles.header}>
					<h3>📱 Mobile Testing</h3>
					<button
						className={styles.close}
						onClick={() => this.setState({ isVisible: false })}
					>
						✕
					</button>
				</div>

				<div className={styles.metrics}>
					<div className={styles.section}>
						<h4>Device Info</h4>
						<div className={styles.metric}>
							<span>Screen:</span>
							<span>
								{metrics.width}×{metrics.height}
							</span>
						</div>
						<div className={styles.metric}>
							<span>Mobile:</span>
							<span>{metrics.isMobile ? "✓" : "✗"}</span>
						</div>
						<div className={styles.metric}>
							<span>Touch:</span>
							<span>{metrics.isTouch ? "✓" : "✗"}</span>
						</div>
						<div className={styles.metric}>
							<span>iOS:</span>
							<span>{metrics.isIOS ? "✓" : "✗"}</span>
						</div>
						<div className={styles.metric}>
							<span>Android:</span>
							<span>{metrics.isAndroid ? "✓" : "✗"}</span>
						</div>
						<div className={styles.metric}>
							<span>DPR:</span>
							<span>{metrics.devicePixelRatio}</span>
						</div>
					</div>

					<div className={styles.section}>
						<h4>Performance</h4>
						<div className={styles.metric}>
							<span>FPS:</span>
							<span className={metrics.fps < 30 ? styles.warning : ""}>
								{metrics.fps}
							</span>
						</div>
						{metrics.memory && (
							<>
								<div className={styles.metric}>
									<span>Memory:</span>
									<span>{metrics.memory.used}MB</span>
								</div>
								<div className={styles.metric}>
									<span>Memory %:</span>
									<span
										className={
											metrics.memory.percentage > 80 ? styles.warning : ""
										}
									>
										{metrics.memory.percentage}%
									</span>
								</div>
							</>
						)}
					</div>

					<div className={styles.section}>
						<h4>Quick Tests</h4>
						<button
							className={styles.testButton}
							onClick={() => this.setState({ isVisible: false })}
						>
							Test Tab Switching
						</button>
						<button
							className={styles.testButton}
							onClick={() => {
								if (window.navigator && window.navigator.vibrate) {
									window.navigator.vibrate([100, 50, 100]);
								}
							}}
						>
							Test Haptics
						</button>
						<button
							className={styles.testButton}
							onClick={() => {
								const toast = require("./MobileToast").showMobileToast;
								toast("Test toast message", "info", 2000);
							}}
						>
							Test Toast
						</button>
					</div>
				</div>
			</div>
		);
	}
}
