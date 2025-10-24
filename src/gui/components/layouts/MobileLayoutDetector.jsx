import React, { PureComponent } from "react";
import DualLayout from "./DualLayout";
import MobileTabLayout from "./MobileTabLayout";
import TripleLayout from "./TripleLayout";

export default class MobileLayoutDetector extends PureComponent {
	static get requiredComponentNames() {
		return ["Left", "Right", "Top", "Bottom"];
	}

	state = { isMobile: false, isLandscape: false };

	componentDidMount() {
		this.checkMobile();
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

		if (
			this.state.isMobile !== isMobile ||
			this.state.isLandscape !== isLandscape
		) {
			this.setState({ isMobile, isLandscape });
		}
	};

	render() {
		const { isMobile, isLandscape } = this.state;
		const { layout, ...otherProps } = this.props;

		// Use mobile tab layout for phones
		if (isMobile && !isLandscape) {
			return <MobileTabLayout {...otherProps} />;
		}

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
