import React, { PureComponent } from "react";
import classNames from "classnames";
import styles from "./MobileToast.module.css";

export default class MobileToast extends PureComponent {
	static get id() {
		return "MobileToast";
	}

	state = {
		isVisible: false,
		message: "",
		type: "info", // info, success, warning, error
		duration: 3000,
	};

	show(message, type = "info", duration = 3000) {
		this.setState({ isVisible: true, message, type, duration });

		// Auto-hide after duration
		setTimeout(() => {
			this.hide();
		}, duration);
	}

	hide() {
		this.setState({ isVisible: false });
	}

	render() {
		const { isVisible, message, type } = this.state;

		if (!isVisible || !message) return null;

		return (
			<div className={classNames(styles.toast, styles[type])}>
				<div className={styles.content}>
					<span className={styles.icon}>
						{type === "success" && "✓"}
						{type === "error" && "✕"}
						{type === "warning" && "⚠"}
						{type === "info" && "ℹ"}
					</span>
					<span className={styles.message}>{message}</span>
				</div>
			</div>
		);
	}
}

// Singleton instance for global access
let mobileToastInstance = null;

export const showMobileToast = (message, type = "info", duration = 3000) => {
	if (!mobileToastInstance) {
		console.warn("MobileToast not initialized");
		return;
	}
	mobileToastInstance.show(message, type, duration);
};

export const initMobileToast = (ref) => {
	mobileToastInstance = ref;
};
