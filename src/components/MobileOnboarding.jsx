/**
 * Mobile Onboarding Component
 * Progressive onboarding experience optimized for mobile devices
 */
import React, { useCallback, useEffect, useState } from "react";
import {
	ArrowBack as ArrowBackIcon,
	ArrowForward as ArrowForwardIcon,
	CheckCircle as CheckIcon,
	Close as CloseIcon,
	CloudUpload as CloudIcon,
	Gesture as GestureIcon,
	SkipNext as SkipIcon,
	Smartphone as SmartphoneIcon,
	Speed as SpeedIcon,
	TouchApp as TouchIcon,
} from "@mui/icons-material";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Fade,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Slide,
	Step,
	StepContent,
	StepLabel,
	Stepper,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { initProductionAnalytics } from "../utils/productionAnalytics";
import { useABTesting } from "../utils/useABTesting";

const StyledCard = styled(Card)(({ theme }) => ({
	maxWidth: 400,
	margin: "0 auto",
	position: "fixed",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	zIndex: 9999,
	borderRadius: theme.spacing(2),
	boxShadow: theme.shadows[8],
}));

const StepIcon = styled("div")(({ theme, active, completed }) => ({
	width: 40,
	height: 40,
	borderRadius: "50%",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: active
		? theme.palette.primary.main
		: completed
		? theme.palette.success.main
		: theme.palette.grey[300],
	color: active || completed ? "white" : theme.palette.text.secondary,
	fontSize: 20,
	marginBottom: theme.spacing(2),
}));

const MobileOnboarding = ({ onComplete, onSkip }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [activeStep, setActiveStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState(new Set());
	const [isAnimating, setIsAnimating] = useState(false);
	const { isFeatureEnabled, trackConversion } = useABTesting();
	const analytics = initProductionAnalytics();

	const steps = [
		{
			title: "Welcome to Mobile Mode",
			icon: <SmartphoneIcon />,
			content:
				"Experience the emulator optimized for your mobile device with touch controls and gestures.",
			interactive: false,
			action: null,
		},
		{
			title: "Touch Controls",
			icon: <TouchIcon />,
			content:
				"Use touch gestures to control the emulator. Swipe, tap, and pinch to navigate.",
			interactive: true,
			action: "touch_demo",
		},
		{
			title: "Gesture Shortcuts",
			icon: <GestureIcon />,
			content:
				"Learn powerful gestures: Swipe left/right for tabs, double-tap for quick actions.",
			interactive: true,
			action: "gesture_demo",
		},
		{
			title: "Performance Mode",
			icon: <SpeedIcon />,
			content:
				"Automatically optimized for your device. Enjoy smooth gameplay!",
			interactive: false,
			action: null,
		},
		{
			title: "Cloud Sync",
			icon: <CloudIcon />,
			content:
				"Your progress is automatically saved to the cloud. Play anywhere!",
			interactive: true,
			action: "cloud_demo",
		},
	];

	useEffect(() => {
		// Track onboarding start
		analytics.trackEvent("onboarding_started", {
			step: activeStep,
			totalSteps: steps.length,
			isMobileDevice: isMobile,
			userAgent: navigator.userAgent,
		});

		// Check if user has seen onboarding before
		const hasSeenOnboarding = localStorage.getItem(
			"mobile_onboarding_completed"
		);
		if (hasSeenOnboarding) {
			onComplete();
			return;
		}

		// A/B test: Show simplified onboarding for some users
		if (isFeatureEnabled("mobile_onboarding")) {
			const variant = analytics.getFeatureConfig("mobile_onboarding");
			if (variant?.variantId === "variant_a") {
				// Simplified onboarding
				setSimplifiedMode(true);
			}
		}
	}, []);

	const handleNext = useCallback(() => {
		setIsAnimating(true);

		// Mark current step as completed
		setCompletedSteps((prev) => new Set([...prev, activeStep]));

		// Track step completion
		analytics.trackEvent("onboarding_step_completed", {
			step: activeStep,
			stepTitle: steps[activeStep].title,
			totalSteps: steps.length,
		});

		setTimeout(() => {
			if (activeStep === steps.length - 1) {
				handleComplete();
			} else {
				setActiveStep((prev) => prev + 1);
			}
			setIsAnimating(false);
		}, 300);
	}, [activeStep, steps.length]);

	const handleBack = useCallback(() => {
		setIsAnimating(true);
		setTimeout(() => {
			setActiveStep((prev) => Math.max(0, prev - 1));
			setIsAnimating(false);
		}, 300);
	}, []);

	const handleSkip = useCallback(() => {
		analytics.trackEvent("onboarding_skipped", {
			currentStep: activeStep,
			totalSteps: steps.length,
		});

		if (onSkip) {
			onSkip();
		} else {
			handleComplete();
		}
	}, [activeStep, onSkip]);

	const handleComplete = useCallback(() => {
		// Mark onboarding as completed
		localStorage.setItem("mobile_onboarding_completed", "true");
		localStorage.setItem("mobile_onboarding_date", Date.now().toString());

		// Track completion
		analytics.trackEvent("onboarding_completed", {
			totalSteps: steps.length,
			completedSteps: completedSteps.size + 1,
			duration: Date.now() - analytics.sessionStart,
		});

		// Track conversion for A/B test
		if (isFeatureEnabled("mobile_onboarding")) {
			trackConversion("mobile_onboarding", 1);
		}

		if (onComplete) {
			onComplete();
		}
	}, [completedSteps.size, steps.length, onComplete, trackConversion]);

	const handleInteractiveAction = useCallback(
		(action) => {
			analytics.trackEvent("onboarding_interactive_action", {
				action,
				step: activeStep,
			});

			switch (action) {
				case "touch_demo":
					demonstrateTouchControls();
					break;
				case "gesture_demo":
					demonstrateGestures();
					break;
				case "cloud_demo":
					demonstrateCloudSync();
					break;
				default:
					break;
			}
		},
		[activeStep]
	);

	const demonstrateTouchControls = () => {
		// Create touch demonstration overlay
		const overlay = document.createElement("div");
		overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      text-align: center;
    `;

		overlay.innerHTML = `
      <div>
        <h3>Touch the screen anywhere</h3>
        <p>Try tapping, swiping, and pinching</p>
        <button style="
          padding: 12px 24px;
          font-size: 16px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 8px;
          margin-top: 20px;
        ">Got it!</button>
      </div>
    `;

		document.body.appendChild(overlay);

		const handleTouch = (e) => {
			e.preventDefault();
			const touch = e.touches[0];
			const ripple = document.createElement("div");
			ripple.style.cssText = `
        position: absolute;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(33, 150, 243, 0.5);
        left: ${touch.clientX - 25}px;
        top: ${touch.clientY - 25}px;
        transform: scale(0);
        transition: transform 0.3s ease-out;
        pointer-events: none;
      `;

			overlay.appendChild(ripple);
			setTimeout(() => {
				ripple.style.transform = "scale(2)";
				ripple.style.opacity = "0";
			}, 10);

			setTimeout(() => {
				ripple.remove();
			}, 300);
		};

		overlay.addEventListener("touchstart", handleTouch);

		overlay.querySelector("button").addEventListener("click", () => {
			overlay.removeEventListener("touchstart", handleTouch);
			overlay.remove();
		});
	};

	const demonstrateGestures = () => {
		// Create gesture demonstration
		const gestures = [
			{ name: "Swipe Left", description: "Previous tab", icon: "←" },
			{ name: "Swipe Right", description: "Next tab", icon: "→" },
			{ name: "Double Tap", description: "Quick action", icon: "⚡" },
			{ name: "Long Press", description: "Context menu", icon: "⏱️" },
		];

		const overlay = document.createElement("div");
		overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 20px;
    `;

		overlay.innerHTML = `
      <div style="text-align: center; max-width: 300px;">
        <h3>Gesture Shortcuts</h3>
        ${gestures
					.map(
						(g) => `
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
          ">
            <span style="font-size: 24px;">${g.icon}</span>
            <div style="text-align: left;">
              <div style="font-weight: bold;">${g.name}</div>
              <div style="font-size: 14px; opacity: 0.8;">${g.description}</div>
            </div>
          </div>
        `
					)
					.join("")}
        <button style="
          padding: 12px 24px;
          font-size: 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          margin-top: 20px;
          width: 100%;
        ">Try it out!</button>
      </div>
    `;

		document.body.appendChild(overlay);

		overlay.querySelector("button").addEventListener("click", () => {
			overlay.remove();
		});
	};

	const demonstrateCloudSync = () => {
		// Show cloud sync status
		const overlay = document.createElement("div");
		overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 20px;
    `;

		overlay.innerHTML = `
      <div style="text-align: center; max-width: 300px;">
        <div style="font-size: 48px; margin-bottom: 20px;">☁️</div>
        <h3>Cloud Sync Active</h3>
        <p>Your progress is automatically saved and synced across all your devices.</p>
        <div style="
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4CAF50;
          border-radius: 8px;
          padding: 10px;
          margin: 15px 0;
        ">
          ✅ Last sync: Just now<br>
          ✅ All devices connected<br>
          ✅ Backup complete
        </div>
        <button style="
          padding: 12px 24px;
          font-size: 16px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 8px;
          margin-top: 20px;
          width: 100%;
        ">Awesome!</button>
      </div>
    `;

		document.body.appendChild(overlay);

		overlay.querySelector("button").addEventListener("click", () => {
			overlay.remove();
		});
	};

	const currentStep = steps[activeStep];

	return (
		<Fade in timeout={300}>
			<StyledCard>
				<CardContent sx={{ p: 3 }}>
					{/* Progress Indicator */}
					<Box sx={{ mb: 3 }}>
						<Stepper activeStep={activeStep} orientation="vertical">
							{steps.map((step, index) => (
								<Step key={step.title} completed={completedSteps.has(index)}>
									<StepLabel>
										<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
											{step.title}
										</Typography>
									</StepLabel>
									<StepContent>
										<Box sx={{ py: 2 }}>
											<StepIcon
												active={index === activeStep}
												completed={completedSteps.has(index)}
											>
												{step.icon}
											</StepIcon>

											<Typography
												variant="body2"
												sx={{ mb: 2, textAlign: "center" }}
											>
												{step.content}
											</Typography>

											{step.interactive && (
												<Button
													variant="outlined"
													size="small"
													onClick={() => handleInteractiveAction(step.action)}
													sx={{ mb: 2 }}
												>
													Try it now
												</Button>
											)}
										</Box>
									</StepContent>
								</Step>
							))}
						</Stepper>
					</Box>

					{/* Current Step Content */}
					<Slide direction="up" in timeout={300} mountOnEnter unmountOnExit>
						<Box>
							<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
								<StepIcon active={true} completed={false}>
									{currentStep.icon}
								</StepIcon>
							</Box>

							<Typography
								variant="h6"
								sx={{ textAlign: "center", mb: 2, fontWeight: "bold" }}
							>
								{currentStep.title}
							</Typography>

							<Typography
								variant="body1"
								sx={{ textAlign: "center", mb: 3, color: "text.secondary" }}
							>
								{currentStep.content}
							</Typography>

							{currentStep.interactive && (
								<Button
									variant="contained"
									fullWidth
									onClick={() => handleInteractiveAction(currentStep.action)}
									sx={{ mb: 2 }}
								>
									Try it now
								</Button>
							)}
						</Box>
					</Slide>

					{/* Navigation Buttons */}
					<Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
						<Button
							disabled={activeStep === 0}
							onClick={handleBack}
							startIcon={<ArrowBackIcon />}
						>
							Back
						</Button>

						<Box>
							<Button
								onClick={handleSkip}
								sx={{ mr: 1 }}
								startIcon={<SkipIcon />}
							>
								Skip
							</Button>

							<Button
								variant="contained"
								onClick={handleNext}
								disabled={isAnimating}
								endIcon={
									activeStep === steps.length - 1 ? (
										<CheckIcon />
									) : (
										<ArrowForwardIcon />
									)
								}
							>
								{activeStep === steps.length - 1 ? "Get Started" : "Next"}
							</Button>
						</Box>
					</Box>
				</CardContent>
			</StyledCard>
		</Fade>
	);
};

export default MobileOnboarding;
