/**
 * Mobile Testing Command
 * Provides terminal commands for mobile device testing and compatibility
 */
import deviceCompatibilityLayer from "../../utils/deviceCompatibility.js";
import mobileTestingSuite from "../../utils/mobileTesting.js";

export default {
	name: "mobiletest",
	description: "Run mobile device compatibility tests",
	usage: "mobiletest [options]",
	examples: [
		"mobiletest",
		"mobiletest --quick",
		"mobiletest --export",
		"mobiletest --device-info",
		"mobiletest --features",
		"mobiletest --performance",
		"mobiletest --issues",
	],
	async execute(args, terminal) {
		const options = parseOptions(args);

		try {
			// Initialize if not already done
			if (!mobileTestingSuite.deviceProfile) {
				terminal.print("Initializing mobile testing suite...", "info");
				await mobileTestingSuite.initialize();
			}

			if (options.quick) {
				await runQuickTest(terminal);
			} else if (options["device-info"]) {
				await showDeviceInfo(terminal);
			} else if (options.features) {
				await showFeatureSupport(terminal);
			} else if (options.performance) {
				await showPerformanceMetrics(terminal);
			} else if (options.issues) {
				await showCompatibilityIssues(terminal);
			} else if (options.export) {
				await exportResults(terminal);
			} else {
				await runFullTest(terminal);
			}
		} catch (error) {
			terminal.print(`Error: ${error.message}`, "error");
		}
	},
};

function parseOptions(args) {
	const options = {
		quick: false,
		export: false,
		"device-info": false,
		features: false,
		performance: false,
		issues: false,
	};

	args.forEach((arg) => {
		if (arg.startsWith("--")) {
			const option = arg.slice(2);
			if (option in options) {
				options[option] = true;
			}
		}
	});

	return options;
}

async function runQuickTest(terminal) {
	terminal.print("Running quick compatibility test...", "info");

	const deviceInfo = mobileTestingSuite.deviceProfile;
	if (!deviceInfo) {
		terminal.print(
			"Device profile not available. Run full test first.",
			"error"
		);
		return;
	}

	// Show quick summary
	terminal.print(
		`\n📱 Device: ${deviceInfo.device.type} (${deviceInfo.device.class})`,
		"success"
	);
	terminal.print(
		`🎮 Performance Score: ${deviceInfo.performance.score}/100`,
		"info"
	);
	terminal.print(
		`🌐 Browser: ${deviceInfo.browser.name} ${deviceInfo.browser.version}`,
		"info"
	);
	terminal.print(`📊 Platform: ${deviceInfo.browser.platform}`, "info");

	// Show critical features
	const criticalFeatures = ["touch", "audio", "webgl", "localStorage"];
	const supportedFeatures = criticalFeatures.filter(
		(feature) => deviceInfo.features[feature]?.supported
	);

	terminal.print(
		`\n✅ Supported Features: ${supportedFeatures.length}/${criticalFeatures.length}`,
		"success"
	);
	supportedFeatures.forEach((feature) => {
		terminal.print(`   • ${feature}`, "success");
	});

	const unsupportedFeatures = criticalFeatures.filter(
		(feature) => !deviceInfo.features[feature]?.supported
	);

	if (unsupportedFeatures.length > 0) {
		terminal.print(
			`\n❌ Unsupported Features: ${unsupportedFeatures.length}`,
			"error"
		);
		unsupportedFeatures.forEach((feature) => {
			terminal.print(`   • ${feature}`, "error");
		});
	}

	// Show recommendations
	const recommendations = deviceInfo.recommendations;
	terminal.print(`\n💡 Recommendations:`, "info");
	terminal.print(`   • Quality: ${recommendations.quality.resolution}`, "info");
	terminal.print(`   • Frame Rate: ${recommendations.frameRate} FPS`, "info");
	terminal.print(
		`   • Shadows: ${recommendations.quality.shadows ? "Enabled" : "Disabled"}`,
		"info"
	);
}

async function showDeviceInfo(terminal) {
	terminal.print("Device Information:", "info");

	const deviceInfo = mobileTestingSuite.deviceProfile;
	if (!deviceInfo) {
		terminal.print("Device profile not available. Run test first.", "error");
		return;
	}

	const { device, browser, display, network, memory, battery } = deviceInfo;

	terminal.print(`\n📱 Device Type: ${device.type}`, "success");
	terminal.print(`🏷️  Device Class: ${device.class}`, "info");
	terminal.print(`⭐ Device Tier: ${device.tier}`, "info");

	terminal.print(`\n🌐 Browser:`, "info");
	terminal.print(`   Name: ${browser.name}`, "info");
	terminal.print(`   Version: ${browser.version}`, "info");
	terminal.print(`   Engine: ${browser.engine}`, "info");
	terminal.print(`   Platform: ${browser.platform}`, "info");

	terminal.print(`\n🖥️  Display:`, "info");
	terminal.print(`   Resolution: ${display.width}x${display.height}`, "info");
	terminal.print(
		`   Available: ${display.availWidth}x${display.availHeight}`,
		"info"
	);
	terminal.print(`   Color Depth: ${display.colorDepth} bits`, "info");
	terminal.print(`   Pixel Ratio: ${display.devicePixelRatio}`, "info");
	terminal.print(`   Orientation: ${display.orientation}`, "info");

	terminal.print(`\n🌍 Network:`, "info");
	terminal.print(`   Online: ${network.online ? "Yes" : "No"}`, "info");
	terminal.print(`   Type: ${network.type}`, "info");
	terminal.print(`   Effective Type: ${network.effectiveType}`, "info");
	terminal.print(`   Downlink: ${network.downlink} Mbps`, "info");
	terminal.print(`   RTT: ${network.rtt} ms`, "info");
	terminal.print(`   Save Data: ${network.saveData ? "Yes" : "No"}`, "info");

	if (memory) {
		terminal.print(`\n💾 Memory:`, "info");
		terminal.print(`   Device Memory: ${memory.deviceMemory} GB`, "info");
		terminal.print(
			`   JS Heap Size: ${Math.round(
				memory.usedJSHeapSize / 1024 / 1024
			)} MB / ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
			"info"
		);
	}

	if (battery) {
		terminal.print(`\n🔋 Battery:`, "info");
		terminal.print(`   Level: ${Math.round(battery.level * 100)}%`, "info");
		terminal.print(`   Charging: ${battery.charging ? "Yes" : "No"}`, "info");
		if (battery.charging) {
			terminal.print(
				`   Time to full: ${Math.round(battery.chargingTime / 60)} minutes`,
				"info"
			);
		} else {
			terminal.print(
				`   Time to empty: ${Math.round(battery.dischargingTime / 60)} minutes`,
				"info"
			);
		}
	}
}

async function showFeatureSupport(terminal) {
	terminal.print("Feature Support:", "info");

	const deviceInfo = mobileTestingSuite.deviceProfile;
	if (!deviceInfo) {
		terminal.print("Device profile not available. Run test first.", "error");
		return;
	}

	const { features } = deviceInfo;

	const featureCategories = {
		"Core Features": ["touch", "haptic", "audio", "video"],
		Graphics: ["webgl", "webgl2", "canvas"],
		Storage: ["localStorage", "sessionStorage", "indexedDB"],
		"Background Processing": ["serviceWorker", "webWorkers"],
		"Device APIs": [
			"geolocation",
			"camera",
			"microphone",
			"deviceOrientation",
			"gamepad",
		],
		"UI Features": ["fullscreen", "webShare", "clipboard", "notifications"],
		"PWA Features": ["pwa"],
	};

	Object.entries(featureCategories).forEach(([category, featureList]) => {
		terminal.print(`\n${category}:`, "info");
		featureList.forEach((feature) => {
			const supported = features[feature]?.supported;
			const icon = supported ? "✅" : "❌";
			const status = supported ? "success" : "error";
			terminal.print(`   ${icon} ${feature}`, status);
		});
	});
}

async function showPerformanceMetrics(terminal) {
	terminal.print("Performance Metrics:", "info");

	const deviceInfo = mobileTestingSuite.deviceProfile;
	if (!deviceInfo) {
		terminal.print("Device profile not available. Run test first.", "error");
		return;
	}

	const { performance, recommendations } = deviceInfo;

	terminal.print(
		`\n📊 Overall Performance Score: ${performance.score}/100`,
		"success"
	);

	terminal.print(`\n🔧 CPU:`, "info");
	terminal.print(`   Cores: ${performance.cpu.cores}`, "info");
	terminal.print(`   Score: ${performance.cpu.score}/100`, "info");

	terminal.print(`\n🎮 GPU:`, "info");
	terminal.print(`   Score: ${performance.gpu.score}/100`, "info");
	terminal.print(`   Vendor: ${performance.gpu.vendor}`, "info");
	terminal.print(`   Renderer: ${performance.gpu.renderer}`, "info");

	terminal.print(`\n💾 Memory:`, "info");
	terminal.print(`   Total: ${performance.memory.total} GB`, "info");
	terminal.print(`   Score: ${performance.memory.score}/100`, "info");

	terminal.print(`\n🌐 Network:`, "info");
	terminal.print(`   Type: ${performance.network.type}`, "info");
	terminal.print(`   Speed: ${performance.network.speed} Mbps`, "info");
	terminal.print(`   Score: ${performance.network.score}/100`, "info");

	if (performance.bottlenecks.length > 0) {
		terminal.print(`\n⚠️  Performance Bottlenecks:`, "warning");
		performance.bottlenecks.forEach((bottleneck) => {
			terminal.print(`   • ${bottleneck}`, "warning");
		});
	}

	terminal.print(`\n💡 Recommended Settings:`, "info");
	terminal.print(`   Quality: ${recommendations.quality.resolution}`, "info");
	terminal.print(`   Frame Rate: ${recommendations.frameRate} FPS`, "info");
	terminal.print(
		`   Shadows: ${recommendations.quality.shadows ? "Enabled" : "Disabled"}`,
		"info"
	);
	terminal.print(
		`   Antialiasing: ${recommendations.quality.antialiasing}`,
		"info"
	);
	terminal.print(`   Particles: ${recommendations.quality.particles}`, "info");
}

async function showCompatibilityIssues(terminal) {
	terminal.print("Compatibility Issues & Workarounds:", "info");

	const deviceInfo = mobileTestingSuite.deviceProfile;
	if (!deviceInfo) {
		terminal.print("Device profile not available. Run test first.", "error");
		return;
	}

	const { issues, workarounds } = deviceInfo;

	if (issues.length === 0 && workarounds.length === 0) {
		terminal.print("\n✅ No compatibility issues detected!", "success");
		terminal.print("Your device is fully supported.", "success");
		return;
	}

	if (issues.length > 0) {
		terminal.print(`\n❌ Issues (${issues.length}):`, "error");
		issues.forEach((issue, index) => {
			terminal.print(`\n${index + 1}. ${issue.test}`, "error");
			terminal.print(`   Severity: ${issue.severity}`, "warning");
			terminal.print(`   Error: ${issue.error}`, "error");
		});
	}

	if (workarounds.length > 0) {
		terminal.print(`\n🔧 Workarounds (${workarounds.length}):`, "info");
		workarounds.forEach((workaround, index) => {
			terminal.print(`\n${index + 1}. ${workaround.workaround}`, "info");
			terminal.print(`   Description: ${workaround.description}`, "info");
			terminal.print(`   Issue: ${workaround.issue}`, "warning");
		});
	}
}

async function exportResults(terminal) {
	terminal.print("Exporting test results...", "info");

	try {
		const report = mobileTestingSuite.exportTestData();
		if (report) {
			terminal.print("✅ Test results exported successfully!", "success");
			terminal.print(`Report includes:`, "info");
			terminal.print(`   • Device information`, "info");
			terminal.print(`   • Feature support matrix`, "info");
			terminal.print(`   • Performance metrics`, "info");
			terminal.print(`   • Compatibility issues`, "info");
			terminal.print(`   • Workarounds and recommendations`, "info");
		} else {
			terminal.print("❌ Failed to export results", "error");
		}
	} catch (error) {
		terminal.print(`❌ Export failed: ${error.message}`, "error");
	}
}

async function runFullTest(terminal) {
	terminal.print("Running comprehensive mobile compatibility test...", "info");
	terminal.print("This may take a few moments...", "info");

	try {
		// Initialize compatibility layer
		await deviceCompatibilityLayer.initialize();

		// Run tests
		const testResults = await mobileTestingSuite.runCompatibilityTests();
		const profile = deviceCompatibilityLayer.getCompatibilityProfile();

		terminal.print("\n✅ Testing completed!", "success");

		// Show summary
		const totalTests = Object.keys(testResults).length;
		const passedTests = Object.values(testResults).filter(
			(test) => test.status === "fulfilled"
		).length;
		const failedTests = totalTests - passedTests;

		terminal.print(`\n📊 Test Summary:`, "info");
		terminal.print(`   Total Tests: ${totalTests}`, "info");
		terminal.print(`   Passed: ${passedTests}`, "success");
		terminal.print(
			`   Failed: ${failedTests}`,
			failedTests > 0 ? "error" : "success"
		);

		// Show device info
		terminal.print(
			`\n📱 Device: ${profile.device.type} (${profile.device.class})`,
			"success"
		);
		terminal.print(
			`🎮 Performance Score: ${profile.performance.score}/100`,
			"info"
		);

		// Show critical features
		const criticalFeatures = ["touch", "audio", "webgl", "localStorage"];
		const supportedFeatures = criticalFeatures.filter(
			(feature) => profile.features[feature]?.supported
		);

		terminal.print(
			`\n✅ Critical Features: ${supportedFeatures.length}/${criticalFeatures.length}`,
			"success"
		);

		// Show issues if any
		if (profile.issues.length > 0) {
			terminal.print(
				`\n⚠️  Issues detected: ${profile.issues.length}`,
				"warning"
			);
			terminal.print('Run "mobiletest --issues" for details', "info");
		}

		// Show recommendations
		terminal.print(
			`\n💡 Recommended quality: ${profile.recommendations.quality.resolution}`,
			"info"
		);
		terminal.print(
			`💡 Recommended frame rate: ${profile.recommendations.frameRate} FPS`,
			"info"
		);

		terminal.print('\n💡 Use "mobiletest --help" for more options', "info");
	} catch (error) {
		terminal.print(`❌ Test failed: ${error.message}`, "error");
	}
}
