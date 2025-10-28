import React, { PureComponent } from "react";
import DualLayout from "./DualLayout";
import MobileTabLayout from "./MobileTabLayout";
import TripleLayout from "./TripleLayout";

export default class MobileLayoutDetector extends PureComponent {
	static get requiredComponentNames() {
		return ["Left", "Right", "Top", "Bottom"];
	}

	state = {
		isMobile: false,
		isLandscape: false,
		isMounted: false,
	};

	componentDidMount() {
		// Check mobile immediately on mount
		this.checkMobile();
		this.setState({ isMounted: true });
		window.addEventListener("resize", this.checkMobile);
		window.addEventListener("orientationchange", this.checkMobile);
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.checkMobile);
		window.removeEventListener("orientationchange", this.checkMobile);
	}

	checkMobile = () => {
		const isMobile = window.innerWidth <= 767.98;
		const isLandscape = window.innerWidth > window.innerHeight;

		// Debug logging
		console.log("Mobile detection:", {
			width: window.innerWidth,
			height: window.innerHeight,
			isMobile,
			isLandscape,
			shouldUseMobile: isMobile && !isLandscape,
		});

		if (
			this.state.isMobile !== isMobile ||
			this.state.isLandscape !== isLandscape
		) {
			this.setState({ isMobile, isLandscape });
		}
	};

	mapDesktopToMobileComponents(props) {
		const { Left, Right, Top, Bottom, ...otherProps } = props;

		// Initialize mobile components
		const mobileProps = {
			Code: null,
			Terminal: null,
			Emulator: null,
			...otherProps,
		};

		// Helper function to identify component type
		const getComponentType = (component) => {
			if (!component) return null;
			const componentName = component.type?.name || component.type?.displayName;
			if (componentName) {
				if (
					componentName.includes("Code") ||
					componentName.includes("MultiFile") ||
					componentName.includes("SingleFile")
				)
					return "code";
				if (componentName.includes("Console")) return "terminal";
				if (componentName.includes("TV")) return "emulator";
				if (componentName.includes("Debugger")) return "debugger";
			}
			return null;
		};

		// Map desktop components to mobile tabs
		const components = [Left, Right, Top, Bottom];

		components.forEach((component) => {
			const type = getComponentType(component);
			if (type === "code" && !mobileProps.Code) {
				mobileProps.Code = component;
			} else if (type === "terminal" && !mobileProps.Terminal) {
				mobileProps.Terminal = component;
			} else if (type === "emulator" && !mobileProps.Emulator) {
				mobileProps.Emulator = component;
			} else if (type === "debugger" && !mobileProps.Code) {
				// Map debugger to code tab as fallback
				mobileProps.Code = component;
			}
		});

		// Fallback: if no terminal found, use the first available component
		if (!mobileProps.Terminal) {
			const firstAvailable = components.find(
				(c) => c && c !== mobileProps.Code && c !== mobileProps.Emulator
			);
			if (firstAvailable) {
				mobileProps.Terminal = firstAvailable;
			}
		}

		// Fallback: if no emulator found, use any remaining component
		if (!mobileProps.Emulator) {
			const remaining = components.find(
				(c) => c && c !== mobileProps.Code && c !== mobileProps.Terminal
			);
			if (remaining) {
				mobileProps.Emulator = remaining;
			}
		}

		return mobileProps;
	}

	render() {
		const { isMobile, isLandscape, isMounted } = this.state;
		const { layout, ...otherProps } = this.props;

		// Don't render mobile layout until component is mounted and we have accurate dimensions
		if (!isMounted) {
			// Check if we should use mobile layout immediately
			const isMobileNow =
				typeof window !== "undefined" && window.innerWidth <= 767.98;
			const isLandscapeNow =
				typeof window !== "undefined" && window.innerWidth > window.innerHeight;

			if (isMobileNow && !isLandscapeNow) {
				// Use mobile layout immediately with component mapping
				const mobileProps = this.mapDesktopToMobileComponents(otherProps);
				return <MobileTabLayout {...mobileProps} />;
			}

			// Default to desktop layout during SSR/hydration
			switch (layout) {
				case "dual":
					return <DualLayout {...otherProps} />;
				case "triple":
					return <TripleLayout {...otherProps} />;
				default:
					return <DualLayout {...otherProps} />;
			}
		}

		// Debug logging
		console.log("MobileLayoutDetector render:", {
			isMobile,
			isLandscape,
			layout,
			hasLeft: !!otherProps.Left,
			hasRight: !!otherProps.Right,
			shouldUseMobile: isMobile && !isLandscape,
		});

		// Use mobile tab layout for phones
		if (isMobile && !isLandscape) {
			console.log("Using MobileTabLayout");
			const mobileProps = this.mapDesktopToMobileComponents(otherProps);
			console.log("Mobile props:", {
				hasCode: !!mobileProps.Code,
				hasTerminal: !!mobileProps.Terminal,
				hasEmulator: !!mobileProps.Emulator,
			});
			return <MobileTabLayout {...mobileProps} />;
		}

		console.log("Using desktop layout:", layout);
		// Use original layout for desktop and landscape
		switch (layout) {
			case "dual":
				return <DualLayout {...otherProps} />;
			case "triple":
				return <TripleLayout {...otherProps} />;
			default:
				return <DualLayout {...otherProps} />;
		}
	}
}
