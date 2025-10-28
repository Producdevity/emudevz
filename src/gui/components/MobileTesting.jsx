/**
 * Mobile Testing Component
 * Provides UI for running mobile compatibility tests and viewing results
 */
import React, { useCallback, useEffect, useState } from "react";
import {
	BatteryAlert as BatteryIcon,
	CheckCircle as CheckCircleIcon,
	DesktopWindows as DesktopIcon,
	Download as DownloadIcon,
	Error as ErrorIcon,
	ExpandMore as ExpandMoreIcon,
	Info as InfoIcon,
	Memory as MemoryIcon,
	NetworkCheck as NetworkIcon,
	Refresh as RefreshIcon,
	Settings as SettingsIcon,
	Smartphone as SmartphoneIcon,
	Speed as SpeedIcon,
	TabletMac as TabletIcon,
	Warning as WarningIcon,
} from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	FormControlLabel,
	Grid,
	IconButton,
	LinearProgress,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Switch,
	Tooltip,
	Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import deviceCompatibilityLayer from "../../utils/deviceCompatibility.js";
import mobileTestingSuite from "../../utils/mobileTesting.js";

const StyledCard = styled(Card)(({ theme }) => ({
	marginBottom: theme.spacing(2),
	maxWidth: "100%",
	overflow: "hidden",
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
	fontWeight: "bold",
	...(status === "passed" && {
		backgroundColor: theme.palette.success.main,
		color: theme.palette.success.contrastText,
	}),
	...(status === "failed" && {
		backgroundColor: theme.palette.error.main,
		color: theme.palette.error.contrastText,
	}),
	...(status === "warning" && {
		backgroundColor: theme.palette.warning.main,
		color: theme.palette.warning.contrastText,
	}),
	...(status === "info" && {
		backgroundColor: theme.palette.info.main,
		color: theme.palette.info.contrastText,
	}),
}));

const DeviceIcon = styled("div")(({ theme, deviceType }) => ({
	fontSize: "48px",
	color: theme.palette.primary.main,
	marginBottom: theme.spacing(1),
}));

const MobileTesting = ({ onTestComplete, onCompatibilityUpdate }) => {
	const [isInitialized, setIsInitialized] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [progress, setProgress] = useState(0);
	const [testResults, setTestResults] = useState(null);
	const [compatibilityProfile, setCompatibilityProfile] = useState(null);
	const [expandedPanels, setExpandedPanels] = useState(["device", "features"]);
	const [autoRun, setAutoRun] = useState(true);
	const [showDetails, setShowDetails] = useState(false);

	// Initialize testing suite
	useEffect(() => {
		const initialize = async () => {
			try {
				await mobileTestingSuite.initialize();
				setIsInitialized(true);

				if (autoRun) {
					await runTests();
				}
			} catch (error) {
				console.error("Failed to initialize mobile testing suite:", error);
			}
		};

		initialize();
	}, [autoRun]);

	// Run compatibility tests
	const runTests = useCallback(async () => {
		if (!isInitialized) return;

		setIsRunning(true);
		setProgress(0);

		try {
			// Simulate progress
			const progressInterval = setInterval(() => {
				setProgress((prev) => Math.min(prev + 10, 90));
			}, 200);

			// Run tests
			const results = await mobileTestingSuite.runCompatibilityTests();

			clearInterval(progressInterval);
			setProgress(100);

			// Get compatibility profile
			await deviceCompatibilityLayer.initialize();
			const profile = deviceCompatibilityLayer.getCompatibilityProfile();

			setTestResults(results);
			setCompatibilityProfile(profile);

			// Notify parent components
			if (onTestComplete) {
				onTestComplete(results);
			}

			if (onCompatibilityUpdate) {
				onCompatibilityUpdate(profile);
			}
		} catch (error) {
			console.error("Error running tests:", error);
		} finally {
			setIsRunning(false);
			setTimeout(() => setProgress(0), 1000);
		}
	}, [isInitialized, onTestComplete, onCompatibilityUpdate]);

	// Export test results
	const exportResults = useCallback(() => {
		const report = mobileTestingSuite.exportTestData();
		if (report) {
			console.log("Test results exported");
		}
	}, []);

	// Get device icon
	const getDeviceIcon = (deviceType) => {
		switch (deviceType) {
			case "mobile":
				return <SmartphoneIcon />;
			case "tablet":
				return <TabletIcon />;
			case "desktop":
				return <DesktopIcon />;
			default:
				return <SmartphoneIcon />;
		}
	};

	// Get test status icon
	const getStatusIcon = (status) => {
		switch (status) {
			case "passed":
				return <CheckCircleIcon color="success" />;
			case "failed":
				return <ErrorIcon color="error" />;
			case "warning":
				return <WarningIcon color="warning" />;
			default:
				return <InfoIcon color="info" />;
		}
	};

	// Get device class color
	const getDeviceClassColor = (deviceClass) => {
		switch (deviceClass) {
			case "high":
				return "success";
			case "medium":
				return "warning";
			case "low":
				return "error";
			case "very-low":
				return "error";
			default:
				return "default";
		}
	};

	// Handle panel expansion
	const handlePanelChange = (panel) => (event, isExpanded) => {
		setExpandedPanels((prev) =>
			isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)
		);
	};

	// Render device information
	const renderDeviceInfo = () => {
		if (!compatibilityProfile) return null;

		const { device, performance } = compatibilityProfile;

		return (
			<Accordion
				expanded={expandedPanels.includes("device")}
				onChange={handlePanelChange("device")}
			>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="h6">Device Information</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6} md={3}>
							<Box textAlign="center">
								<DeviceIcon deviceType={device.type}>
									{getDeviceIcon(device.type)}
								</DeviceIcon>
								<Typography variant="subtitle2">{device.type}</Typography>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Box textAlign="center">
								<StatusChip
									label={device.class.toUpperCase()}
									status={
										device.class === "high"
											? "passed"
											: device.class === "medium"
											? "warning"
											: "failed"
									}
								/>
								<Typography variant="subtitle2">Device Class</Typography>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Box textAlign="center">
								<Typography variant="h6">{performance.score}</Typography>
								<Typography variant="subtitle2">Performance Score</Typography>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Box textAlign="center">
								<Typography variant="h6">{device.tier}</Typography>
								<Typography variant="subtitle2">Device Tier</Typography>
							</Box>
						</Grid>
					</Grid>

					<Divider sx={{ my: 2 }} />

					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2" gutterBottom>
								Platform
							</Typography>
							<Typography variant="body2">{device.platform}</Typography>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2" gutterBottom>
								Browser
							</Typography>
							<Typography variant="body2">
								{device.browser} {device.version}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2" gutterBottom>
								CPU Cores
							</Typography>
							<Typography variant="body2">{performance.cpu.cores}</Typography>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2" gutterBottom>
								GPU Score
							</Typography>
							<Typography variant="body2">{performance.gpu.score}</Typography>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2" gutterBottom>
								Memory (GB)
							</Typography>
							<Typography variant="body2">
								{performance.memory.total}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2" gutterBottom>
								Network
							</Typography>
							<Typography variant="body2">
								{performance.network.type || "Unknown"}
							</Typography>
						</Grid>
					</Grid>
				</AccordionDetails>
			</Accordion>
		);
	};

	// Render feature tests
	const renderFeatureTests = () => {
		if (!testResults) return null;

		const featureTests = [
			{ key: "testTouchInteractions", name: "Touch Interactions", icon: "👆" },
			{ key: "testHapticFeedback", name: "Haptic Feedback", icon: "📳" },
			{ key: "testAudioPlayback", name: "Audio Playback", icon: "🔊" },
			{ key: "testVideoPlayback", name: "Video Playback", icon: "🎬" },
			{ key: "testWebGLRendering", name: "WebGL Rendering", icon: "🎮" },
			{ key: "testCanvasPerformance", name: "Canvas Performance", icon: "🖼️" },
			{ key: "testLocalStorage", name: "Local Storage", icon: "💾" },
			{ key: "testIndexedDB", name: "IndexedDB", icon: "🗄️" },
			{ key: "testServiceWorker", name: "Service Worker", icon: "⚙️" },
			{ key: "testWebWorkers", name: "Web Workers", icon: "👥" },
			{ key: "testGeolocation", name: "Geolocation", icon: "📍" },
			{ key: "testCamera", name: "Camera", icon: "📷" },
			{ key: "testMicrophone", name: "Microphone", icon: "🎤" },
			{ key: "testDeviceOrientation", name: "Device Orientation", icon: "🧭" },
			{ key: "testGamepad", name: "Gamepad", icon: "🎮" },
			{ key: "testFullscreen", name: "Fullscreen", icon: "🖥️" },
			{ key: "testWebShare", name: "Web Share", icon: "📤" },
			{ key: "testClipboard", name: "Clipboard", icon: "📋" },
			{ key: "testNotifications", name: "Notifications", icon: "🔔" },
			{ key: "testPWAFeatures", name: "PWA Features", icon: "📱" },
		];

		return (
			<Accordion
				expanded={expandedPanels.includes("features")}
				onChange={handlePanelChange("features")}
			>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="h6">Feature Tests</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<List>
						{featureTests.map((test) => {
							const result = testResults[test.key];
							const status =
								result?.status === "fulfilled" ? "passed" : "failed";

							return (
								<ListItem key={test.key}>
									<ListItemIcon>
										<Typography variant="h5">{test.icon}</Typography>
									</ListItemIcon>
									<ListItemText
										primary={test.name}
										secondary={
											result?.status === "fulfilled"
												? "Supported"
												: result?.error || "Not supported"
										}
									/>
									<ListItemIcon>{getStatusIcon(status)}</ListItemIcon>
								</ListItem>
							);
						})}
					</List>
				</AccordionDetails>
			</Accordion>
		);
	};

	// Render performance metrics
	const renderPerformanceMetrics = () => {
		if (!compatibilityProfile) return null;

		const { performance, recommendations } = compatibilityProfile;

		return (
			<Accordion
				expanded={expandedPanels.includes("performance")}
				onChange={handlePanelChange("performance")}
			>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="h6">Performance Metrics</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" mb={1}>
								<SpeedIcon sx={{ mr: 1 }} />
								<Typography variant="subtitle2">CPU Performance</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={performance.cpu.score}
								sx={{ mb: 1 }}
							/>
							<Typography variant="body2">
								Score: {performance.cpu.score}/100
							</Typography>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" mb={1}>
								<MemoryIcon sx={{ mr: 1 }} />
								<Typography variant="subtitle2">Memory Usage</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={performance.memory.score}
								sx={{ mb: 1 }}
							/>
							<Typography variant="body2">
								Score: {performance.memory.score}/100
							</Typography>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" mb={1}>
								<NetworkIcon sx={{ mr: 1 }} />
								<Typography variant="subtitle2">Network Speed</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={performance.network.score}
								sx={{ mb: 1 }}
							/>
							<Typography variant="body2">
								Score: {performance.network.score}/100
							</Typography>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" mb={1}>
								<BatteryIcon sx={{ mr: 1 }} />
								<Typography variant="subtitle2">Battery Level</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={performance.battery.level * 100}
								sx={{ mb: 1 }}
							/>
							<Typography variant="body2">
								Level: {Math.round(performance.battery.level * 100)}%
							</Typography>
						</Grid>
					</Grid>

					<Divider sx={{ my: 2 }} />

					<Typography variant="h6" gutterBottom>
						Recommended Settings
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2">Quality</Typography>
							<StatusChip
								label={recommendations.quality.resolution}
								status="info"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2">Frame Rate</Typography>
							<StatusChip
								label={`${recommendations.frameRate} FPS`}
								status="info"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2">Shadows</Typography>
							<StatusChip
								label={recommendations.quality.shadows ? "Enabled" : "Disabled"}
								status={recommendations.quality.shadows ? "passed" : "failed"}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="subtitle2">Antialiasing</Typography>
							<StatusChip
								label={
									recommendations.quality.antialiasing ? "Enabled" : "Disabled"
								}
								status={
									recommendations.quality.antialiasing ? "passed" : "failed"
								}
							/>
						</Grid>
					</Grid>
				</AccordionDetails>
			</Accordion>
		);
	};

	// Render issues and workarounds
	const renderIssuesAndWorkarounds = () => {
		if (!compatibilityProfile) return null;

		const { issues, workarounds } = compatibilityProfile;

		return (
			<Accordion
				expanded={expandedPanels.includes("issues")}
				onChange={handlePanelChange("issues")}
			>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="h6">Issues & Workarounds</Typography>
				</AccordionSummary>
				<AccordionDetails>
					{issues.length > 0 && (
						<Box mb={2}>
							<Typography variant="h6" gutterBottom>
								Compatibility Issues
							</Typography>
							<List>
								{issues.map((issue, index) => (
									<ListItem key={index}>
										<ListItemIcon>
											<ErrorIcon color="error" />
										</ListItemIcon>
										<ListItemText
											primary={issue.test}
											secondary={issue.error}
										/>
										<StatusChip
											label={issue.severity}
											status={
												issue.severity === "critical" ? "failed" : "warning"
											}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{workarounds.length > 0 && (
						<Box>
							<Typography variant="h6" gutterBottom>
								Workarounds
							</Typography>
							<List>
								{workarounds.map((workaround, index) => (
									<ListItem key={index}>
										<ListItemIcon>
											<SettingsIcon color="info" />
										</ListItemIcon>
										<ListItemText
											primary={workaround.workaround}
											secondary={workaround.description}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{issues.length === 0 && workarounds.length === 0 && (
						<Alert severity="success">
							No compatibility issues detected! Your device is fully supported.
						</Alert>
					)}
				</AccordionDetails>
			</Accordion>
		);
	};

	return (
		<Box sx={{ p: 2 }}>
			<StyledCard>
				<CardContent>
					<Typography variant="h4" gutterBottom>
						Mobile Device Testing
					</Typography>

					<Typography variant="body1" paragraph>
						Test your device's compatibility with the emulator and get
						personalized recommendations.
					</Typography>

					<Box display="flex" alignItems="center" mb={2}>
						<FormControlLabel
							control={
								<Switch
									checked={autoRun}
									onChange={(e) => setAutoRun(e.target.checked)}
									disabled={isRunning}
								/>
							}
							label="Auto-run tests on load"
						/>

						<FormControlLabel
							control={
								<Switch
									checked={showDetails}
									onChange={(e) => setShowDetails(e.target.checked)}
								/>
							}
							label="Show detailed results"
						/>
					</Box>

					<Box display="flex" gap={2} mb={2}>
						<Button
							variant="contained"
							onClick={runTests}
							disabled={isRunning || !isInitialized}
							startIcon={<RefreshIcon />}
						>
							{isRunning ? "Running Tests..." : "Run Tests"}
						</Button>

						<Button
							variant="outlined"
							onClick={exportResults}
							disabled={!testResults}
							startIcon={<DownloadIcon />}
						>
							Export Results
						</Button>
					</Box>

					{isRunning && (
						<Box mb={2}>
							<LinearProgress variant="determinate" value={progress} />
							<Typography variant="body2" align="center" sx={{ mt: 1 }}>
								Running compatibility tests... {progress}%
							</Typography>
						</Box>
					)}

					{!isInitialized && (
						<Alert severity="info">Initializing mobile testing suite...</Alert>
					)}
				</CardContent>
			</StyledCard>

			{compatibilityProfile && (
				<>
					{renderDeviceInfo()}
					{renderFeatureTests()}
					{renderPerformanceMetrics()}
					{renderIssuesAndWorkarounds()}
				</>
			)}
		</Box>
	);
};

export default MobileTesting;
