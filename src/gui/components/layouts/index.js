import DualLayout from "./DualLayout";
import MobileLayoutDetector from "./MobileLayoutDetector";
import MobileTabLayout from "./MobileTabLayout";
import MonoLayout from "./MonoLayout";
import QuadLayout from "./QuadLayout";
import TripleBottomLayout from "./TripleBottomLayout";
import TripleLayout from "./TripleLayout";
import TripleRightLayout from "./TripleRightLayout";

export default {
	dual: DualLayout,
	mono: MonoLayout,
	quad: QuadLayout,
	triple: TripleLayout,
	tripleBottom: TripleBottomLayout,
	tripleRight: TripleRightLayout,
	mobileTab: MobileTabLayout,
	mobileDetector: MobileLayoutDetector,
};
