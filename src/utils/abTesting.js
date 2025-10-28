/**
 * A/B Testing System for Mobile Features
 * Provides controlled rollout and testing of new mobile features
 */
import deviceCompatibilityLayer from "./deviceCompatibility.js";
import { getDeviceInfo, isMobile } from "./mobile.js";
import { getPerformanceMetrics } from "./mobileAnalytics.js";

class ABTestingSystem {
	constructor() {
		this.experiments = new Map();
		this.userGroups = new Map();
		this.variants = new Map();
		this.metrics = new Map();
		this.isInitialized = false;
		this.userId = null;
		this.config = {
			enabled: true,
			persistence: true,
			debugMode: false,
			sampleRate: 1.0,
			trafficSplit: {
				control: 0.5,
				variant: 0.5,
			},
		};
	}

	/**
	 * Initialize A/B testing system
	 */
	async initialize(config = {}) {
		this.config = { ...this.config, ...config };

		// Generate or retrieve user ID
		this.userId = this.getUserId();

		// Load experiments
		await this.loadExperiments();

		// Load user groups
		await this.loadUserGroups();

		// Initialize metrics tracking
		this.initializeMetrics();

		this.isInitialized = true;

		if (this.config.debugMode) {
			console.log("A/B Testing System initialized:", {
				userId: this.userId,
				experiments: this.experiments.size,
				userGroups: this.userGroups.size,
			});
		}

		return this;
	}

	/**
	 * Get or generate user ID
	 */
	getUserId() {
		// Try to get existing user ID from localStorage
		let userId = localStorage.getItem("ab_testing_user_id");

		if (!userId) {
			// Generate new user ID
			userId = this.generateUserId();
			localStorage.setItem("ab_testing_user_id", userId);
		}

		return userId;
	}

	/**
	 * Generate unique user ID
	 */
	generateUserId() {
		return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
	}

	/**
	 * Load experiments configuration
	 */
	async loadExperiments() {
		// Default mobile experiments
		const defaultExperiments = [
			{
				id: "mobile_ui_redesign",
				name: "Mobile UI Redesign",
				description: "Test new mobile-optimized UI design",
				variants: [
					{ id: "control", weight: 50, description: "Current UI" },
					{
						id: "variant_a",
						weight: 25,
						description: "New mobile-first design",
					},
					{
						id: "variant_b",
						weight: 25,
						description: "Progressive web app design",
					},
				],
				targeting: {
					deviceTypes: ["mobile", "tablet"],
					platforms: ["iOS", "Android"],
					browsers: ["Chrome", "Safari", "Firefox"],
				},
				metrics: ["engagement", "session_duration", "conversion"],
				startDate: "2025-01-01",
				endDate: "2025-12-31",
				status: "active",
			},
			{
				id: "touch_gestures",
				name: "Touch Gesture Controls",
				description: "Test new touch gesture controls for mobile",
				variants: [
					{ id: "control", weight: 50, description: "Standard touch controls" },
					{
						id: "variant_a",
						weight: 50,
						description: "Enhanced gesture controls",
					},
				],
				targeting: {
					deviceTypes: ["mobile"],
					platforms: ["iOS", "Android"],
					minPerformanceScore: 30,
				},
				metrics: ["task_completion", "user_satisfaction", "error_rate"],
				startDate: "2025-01-01",
				endDate: "2025-06-30",
				status: "active",
			},
			{
				id: "adaptive_quality",
				name: "Adaptive Quality Settings",
				description:
					"Test automatic quality adjustment based on device performance",
				variants: [
					{ id: "control", weight: 50, description: "Manual quality settings" },
					{
						id: "variant_a",
						weight: 50,
						description: "Automatic adaptive quality",
					},
				],
				targeting: {
					deviceTypes: ["mobile", "tablet"],
					minPerformanceScore: 20,
				},
				metrics: ["performance_score", "user_satisfaction", "crash_rate"],
				startDate: "2025-01-01",
				endDate: "2025-12-31",
				status: "active",
			},
			{
				id: "mobile_onboarding",
				name: "Mobile Onboarding Flow",
				description: "Test simplified onboarding for mobile users",
				variants: [
					{ id: "control", weight: 50, description: "Standard onboarding" },
					{
						id: "variant_a",
						weight: 50,
						description: "Mobile-optimized onboarding",
					},
				],
				targeting: {
					deviceTypes: ["mobile"],
					newUsers: true,
				},
				metrics: ["onboarding_completion", "time_to_first_action", "retention"],
				startDate: "2025-01-01",
				endDate: "2025-06-30",
				status: "active",
			},
			{
				id: "cloud_save_optimization",
				name: "Cloud Save Optimization",
				description: "Test optimized cloud save for mobile networks",
				variants: [
					{ id: "control", weight: 50, description: "Standard cloud save" },
					{
						id: "variant_a",
						weight: 50,
						description: "Optimized for mobile networks",
					},
				],
				targeting: {
					deviceTypes: ["mobile", "tablet"],
					networkTypes: ["2g", "3g", "4g"],
				},
				metrics: ["save_success_rate", "save_time", "user_satisfaction"],
				startDate: "2025-01-01",
				endDate: "2025-12-31",
				status: "active",
			},
		];

		// Load experiments from server or use defaults
		try {
			const response = await fetch("/api/ab-testing/experiments");
			if (response.ok) {
				const serverExperiments = await response.json();
				serverExperiments.forEach((exp) => this.experiments.set(exp.id, exp));
			}
		} catch (error) {
			// Use default experiments if server is unavailable
			if (this.config.debugMode) {
				console.log("Using default experiments (server unavailable)");
			}
		}

		// Add default experiments if none loaded
		if (this.experiments.size === 0) {
			defaultExperiments.forEach((exp) => this.experiments.set(exp.id, exp));
		}
	}

	/**
	 * Load user groups from storage
	 */
	async loadUserGroups() {
		try {
			const stored = localStorage.getItem("ab_testing_user_groups");
			if (stored) {
				const groups = JSON.parse(stored);
				this.userGroups = new Map(Object.entries(groups));
			}
		} catch (error) {
			console.warn("Failed to load user groups:", error);
		}
	}

	/**
	 * Save user groups to storage
	 */
	async saveUserGroups() {
		if (!this.config.persistence) return;

		try {
			const groups = Object.fromEntries(this.userGroups);
			localStorage.setItem("ab_testing_user_groups", JSON.stringify(groups));
		} catch (error) {
			console.warn("Failed to save user groups:", error);
		}
	}

	/**
	 * Initialize metrics tracking
	 */
	initializeMetrics() {
		// Initialize metrics storage for each experiment
		this.experiments.forEach((experiment, id) => {
			if (!this.metrics.has(id)) {
				this.metrics.set(id, {
					impressions: 0,
					conversions: 0,
					engagement: 0,
					errors: 0,
					customMetrics: {},
				});
			}
		});
	}

	/**
	 * Check if user is eligible for experiment
	 */
	isUserEligible(experiment) {
		const deviceInfo = getDeviceInfo();
		const performance = getPerformanceMetrics();

		// Check device type targeting
		if (experiment.targeting.deviceTypes) {
			const deviceType = isMobile()
				? window.innerWidth >= 768
					? "tablet"
					: "mobile"
				: "desktop";
			if (!experiment.targeting.deviceTypes.includes(deviceType)) {
				return false;
			}
		}

		// Check platform targeting
		if (experiment.targeting.platforms) {
			if (!experiment.targeting.platforms.includes(deviceInfo.platform)) {
				return false;
			}
		}

		// Check browser targeting
		if (experiment.targeting.browsers) {
			if (!experiment.targeting.browsers.includes(deviceInfo.browser)) {
				return false;
			}
		}

		// Check performance score targeting
		if (experiment.targeting.minPerformanceScore) {
			const score = performance.score || 0;
			if (score < experiment.targeting.minPerformanceScore) {
				return false;
			}
		}

		// Check new user targeting
		if (experiment.targeting.newUsers) {
			const isNewUser = !localStorage.getItem("user_has_visited_before");
			if (!isNewUser) {
				return false;
			}
		}

		// Check network type targeting
		if (experiment.targeting.networkTypes) {
			const connection = navigator.connection;
			if (
				connection &&
				!experiment.targeting.networkTypes.includes(connection.effectiveType)
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get variant for user in experiment
	 */
	getVariant(experimentId) {
		const experiment = this.experiments.get(experimentId);
		if (!experiment) {
			return null;
		}

		// Check if experiment is active
		if (experiment.status !== "active") {
			return null;
		}

		// Check if user is eligible
		if (!this.isUserEligible(experiment)) {
			return null;
		}

		// Check if user is already in a group
		const userGroupKey = `${experimentId}_${this.userId}`;
		if (this.userGroups.has(userGroupKey)) {
			return this.userGroups.get(userGroupKey);
		}

		// Assign user to a variant
		const variant = this.assignVariant(experiment);
		this.userGroups.set(userGroupKey, variant);
		this.saveUserGroups();

		// Track impression
		this.trackImpression(experimentId, variant.id);

		if (this.config.debugMode) {
			console.log(
				`User assigned to variant ${variant.id} for experiment ${experimentId}`
			);
		}

		return variant;
	}

	/**
	 * Assign user to a variant based on weights
	 */
	assignVariant(experiment) {
		const random = Math.random();
		let cumulativeWeight = 0;

		for (const variant of experiment.variants) {
			cumulativeWeight += variant.weight / 100;
			if (random <= cumulativeWeight) {
				return variant;
			}
		}

		// Fallback to first variant
		return experiment.variants[0];
	}

	/**
	 * Track impression
	 */
	trackImpression(experimentId, variantId) {
		const metrics = this.metrics.get(experimentId);
		if (metrics) {
			metrics.impressions++;
			this.saveMetrics(experimentId);
		}
	}

	/**
	 * Track conversion
	 */
	trackConversion(experimentId, event = "conversion") {
		const metrics = this.metrics.get(experimentId);
		if (metrics) {
			metrics.conversions++;
			this.saveMetrics(experimentId);
		}

		// Send to analytics
		this.sendAnalyticsEvent(experimentId, event, {
			variant: this.getVariant(experimentId)?.id,
			userId: this.userId,
		});
	}

	/**
	 * Track engagement
	 */
	trackEngagement(experimentId, duration) {
		const metrics = this.metrics.get(experimentId);
		if (metrics) {
			metrics.engagement += duration;
			this.saveMetrics(experimentId);
		}
	}

	/**
	 * Track custom metric
	 */
	trackCustomMetric(experimentId, metricName, value) {
		const metrics = this.metrics.get(experimentId);
		if (metrics) {
			if (!metrics.customMetrics[metricName]) {
				metrics.customMetrics[metricName] = 0;
			}
			metrics.customMetrics[metricName] += value;
			this.saveMetrics(experimentId);
		}
	}

	/**
	 * Track error
	 */
	trackError(experimentId, error) {
		const metrics = this.metrics.get(experimentId);
		if (metrics) {
			metrics.errors++;
			this.saveMetrics(experimentId);
		}
	}

	/**
	 * Save metrics to storage
	 */
	saveMetrics(experimentId) {
		if (!this.config.persistence) return;

		try {
			const metrics = this.metrics.get(experimentId);
			localStorage.setItem(
				`ab_testing_metrics_${experimentId}`,
				JSON.stringify(metrics)
			);
		} catch (error) {
			console.warn("Failed to save metrics:", error);
		}
	}

	/**
	 * Send analytics event
	 */
	sendAnalyticsEvent(experimentId, event, data) {
		// Send to analytics service
		if (window.gtag) {
			window.gtag("event", event, {
				experiment_id: experimentId,
				...data,
			});
		}

		// Send to custom analytics
		if (window.analytics) {
			window.analytics.track(event, {
				experimentId,
				...data,
			});
		}
	}

	/**
	 * Get experiment results
	 */
	getExperimentResults(experimentId) {
		const experiment = this.experiments.get(experimentId);
		const metrics = this.metrics.get(experimentId);

		if (!experiment || !metrics) {
			return null;
		}

		const results = {
			experimentId,
			name: experiment.name,
			totalImpressions: metrics.impressions,
			totalConversions: metrics.conversions,
			conversionRate:
				metrics.impressions > 0
					? (metrics.conversions / metrics.impressions) * 100
					: 0,
			totalEngagement: metrics.engagement,
			averageEngagement:
				metrics.impressions > 0 ? metrics.engagement / metrics.impressions : 0,
			totalErrors: metrics.errors,
			errorRate:
				metrics.impressions > 0
					? (metrics.errors / metrics.impressions) * 100
					: 0,
			variants: [],
		};

		// Calculate results per variant
		experiment.variants.forEach((variant) => {
			const variantImpressions = this.getVariantImpressions(
				experimentId,
				variant.id
			);
			const variantConversions = this.getVariantConversions(
				experimentId,
				variant.id
			);

			results.variants.push({
				id: variant.id,
				name: variant.description,
				impressions: variantImpressions,
				conversions: variantConversions,
				conversionRate:
					variantImpressions > 0
						? (variantConversions / variantImpressions) * 100
						: 0,
				weight: variant.weight,
			});
		});

		return results;
	}

	/**
	 * Get variant impressions
	 */
	getVariantImpressions(experimentId, variantId) {
		// This would typically be calculated from server data
		// For now, estimate based on user groups
		let count = 0;
		this.userGroups.forEach((variant, key) => {
			if (key.startsWith(experimentId) && variant.id === variantId) {
				count++;
			}
		});
		return count;
	}

	/**
	 * Get variant conversions
	 */
	getVariantConversions(experimentId, variantId) {
		// This would typically be calculated from server data
		// For now, estimate based on conversion rate
		const impressions = this.getVariantImpressions(experimentId, variantId);
		return Math.floor(impressions * 0.1); // Assume 10% conversion rate
	}

	/**
	 * Get all active experiments
	 */
	getActiveExperiments() {
		return Array.from(this.experiments.values()).filter(
			(exp) => exp.status === "active"
		);
	}

	/**
	 * Get user's current variants
	 */
	getUserVariants() {
		const variants = {};

		this.experiments.forEach((experiment, id) => {
			const variant = this.getVariant(id);
			if (variant) {
				variants[id] = variant;
			}
		});

		return variants;
	}

	/**
	 * Check if feature is enabled for user
	 */
	isFeatureEnabled(featureName) {
		// Check if feature is part of an active experiment
		for (const [experimentId, experiment] of this.experiments) {
			if (experiment.name.toLowerCase().includes(featureName.toLowerCase())) {
				const variant = this.getVariant(experimentId);
				return variant && variant.id !== "control";
			}
		}

		return false;
	}

	/**
	 * Get feature configuration
	 */
	getFeatureConfig(featureName) {
		for (const [experimentId, experiment] of this.experiments) {
			if (experiment.name.toLowerCase().includes(featureName.toLowerCase())) {
				const variant = this.getVariant(experimentId);
				if (variant) {
					return {
						experimentId,
						variantId: variant.id,
						variantName: variant.description,
						isControl: variant.id === "control",
					};
				}
			}
		}

		return null;
	}

	/**
	 * Reset user assignments
	 */
	resetUserAssignments() {
		this.userGroups.clear();
		this.saveUserGroups();

		if (this.config.debugMode) {
			console.log("User assignments reset");
		}
	}

	/**
	 * Export data for analysis
	 */
	exportData() {
		const data = {
			userId: this.userId,
			timestamp: Date.now(),
			experiments: Array.from(this.experiments.values()),
			userGroups: Object.fromEntries(this.userGroups),
			metrics: Object.fromEntries(this.metrics),
		};

		return data;
	}

	/**
	 * Get system statistics
	 */
	getStatistics() {
		return {
			totalExperiments: this.experiments.size,
			activeExperiments: this.getActiveExperiments().length,
			userAssignments: this.userGroups.size,
			totalImpressions: Array.from(this.metrics.values()).reduce(
				(sum, m) => sum + m.impressions,
				0
			),
			totalConversions: Array.from(this.metrics.values()).reduce(
				(sum, m) => sum + m.conversions,
				0
			),
			averageConversionRate: this.calculateAverageConversionRate(),
		};
	}

	/**
	 * Calculate average conversion rate
	 */
	calculateAverageConversionRate() {
		const experiments = Array.from(this.metrics.entries());
		if (experiments.length === 0) return 0;

		const totalRate = experiments.reduce((sum, [id, metrics]) => {
			const rate =
				metrics.impressions > 0 ? metrics.conversions / metrics.impressions : 0;
			return sum + rate;
		}, 0);

		return totalRate / experiments.length;
	}
}

// Create singleton instance
const abTestingSystem = new ABTestingSystem();

export default abTestingSystem;
export { ABTestingSystem };
