/**
 * React Hook for A/B Testing
 * Provides easy integration with A/B testing system
 */
import { useCallback, useEffect, useState } from "react";
import abTestingSystem from "./abTesting.js";

/**
 * Hook for A/B testing functionality
 * @param {Object} options - Configuration options
 * @returns {Object} A/B testing utilities
 */
export function useABTesting(options = {}) {
	const [isInitialized, setIsInitialized] = useState(false);
	const [userVariants, setUserVariants] = useState({});
	const [isLoading, setIsLoading] = useState(true);

	// Initialize A/B testing system
	useEffect(() => {
		const initialize = async () => {
			try {
				await abTestingSystem.initialize(options);
				const variants = abTestingSystem.getUserVariants();
				setUserVariants(variants);
				setIsInitialized(true);
			} catch (error) {
				console.error("Failed to initialize A/B testing:", error);
			} finally {
				setIsLoading(false);
			}
		};

		initialize();
	}, [options]);

	/**
	 * Get variant for a specific experiment
	 * @param {string} experimentId - Experiment ID
	 * @returns {Object|null} Variant object or null
	 */
	const getVariant = useCallback(
		(experimentId) => {
			if (!isInitialized) return null;
			return abTestingSystem.getVariant(experimentId);
		},
		[isInitialized]
	);

	/**
	 * Check if user is in control group
	 * @param {string} experimentId - Experiment ID
	 * @returns {boolean} True if user is in control group
	 */
	const isControl = useCallback(
		(experimentId) => {
			const variant = getVariant(experimentId);
			return variant?.id === "control";
		},
		[getVariant]
	);

	/**
	 * Check if user is in variant group
	 * @param {string} experimentId - Experiment ID
	 * @returns {boolean} True if user is in variant group
	 */
	const isVariant = useCallback(
		(experimentId) => {
			const variant = getVariant(experimentId);
			return variant?.id !== "control";
		},
		[getVariant]
	);

	/**
	 * Check if a feature is enabled
	 * @param {string} featureName - Feature name
	 * @returns {boolean} True if feature is enabled
	 */
	const isFeatureEnabled = useCallback(
		(featureName) => {
			if (!isInitialized) return false;
			return abTestingSystem.isFeatureEnabled(featureName);
		},
		[isInitialized]
	);

	/**
	 * Get feature configuration
	 * @param {string} featureName - Feature name
	 * @returns {Object|null} Feature configuration or null
	 */
	const getFeatureConfig = useCallback(
		(featureName) => {
			if (!isInitialized) return null;
			return abTestingSystem.getFeatureConfig(featureName);
		},
		[isInitialized]
	);

	/**
	 * Track conversion event
	 * @param {string} experimentId - Experiment ID
	 * @param {string} event - Event name
	 */
	const trackConversion = useCallback(
		(experimentId, event = "conversion") => {
			if (!isInitialized) return;
			abTestingSystem.trackConversion(experimentId, event);
		},
		[isInitialized]
	);

	/**
	 * Track engagement
	 * @param {string} experimentId - Experiment ID
	 * @param {number} duration - Engagement duration in milliseconds
	 */
	const trackEngagement = useCallback(
		(experimentId, duration) => {
			if (!isInitialized) return;
			abTestingSystem.trackEngagement(experimentId, duration);
		},
		[isInitialized]
	);

	/**
	 * Track custom metric
	 * @param {string} experimentId - Experiment ID
	 * @param {string} metricName - Metric name
	 * @param {number} value - Metric value
	 */
	const trackCustomMetric = useCallback(
		(experimentId, metricName, value) => {
			if (!isInitialized) return;
			abTestingSystem.trackCustomMetric(experimentId, metricName, value);
		},
		[isInitialized]
	);

	/**
	 * Track error
	 * @param {string} experimentId - Experiment ID
	 * @param {Error|string} error - Error object or message
	 */
	const trackError = useCallback(
		(experimentId, error) => {
			if (!isInitialized) return;
			abTestingSystem.trackError(experimentId, error);
		},
		[isInitialized]
	);

	/**
	 * Get experiment results
	 * @param {string} experimentId - Experiment ID
	 * @returns {Object|null} Experiment results or null
	 */
	const getExperimentResults = useCallback(
		(experimentId) => {
			if (!isInitialized) return null;
			return abTestingSystem.getExperimentResults(experimentId);
		},
		[isInitialized]
	);

	/**
	 * Get all active experiments
	 * @returns {Array} Array of active experiments
	 */
	const getActiveExperiments = useCallback(() => {
		if (!isInitialized) return [];
		return abTestingSystem.getActiveExperiments();
	}, [isInitialized]);

	/**
	 * Reset user assignments
	 */
	const resetAssignments = useCallback(() => {
		if (!isInitialized) return;
		abTestingSystem.resetUserAssignments();
		setUserVariants({});
	}, [isInitialized]);

	/**
	 * Export A/B testing data
	 * @returns {Object} Export data
	 */
	const exportData = useCallback(() => {
		if (!isInitialized) return null;
		return abTestingSystem.exportData();
	}, [isInitialized]);

	/**
	 * Get system statistics
	 * @returns {Object} System statistics
	 */
	const getStatistics = useCallback(() => {
		if (!isInitialized) return null;
		return abTestingSystem.getStatistics();
	}, [isInitialized]);

	return {
		// State
		isInitialized,
		isLoading,
		userVariants,

		// Variant checking
		getVariant,
		isControl,
		isVariant,

		// Feature checking
		isFeatureEnabled,
		getFeatureConfig,

		// Tracking
		trackConversion,
		trackEngagement,
		trackCustomMetric,
		trackError,

		// Data access
		getExperimentResults,
		getActiveExperiments,
		getStatistics,
		exportData,

		// Utilities
		resetAssignments,
	};
}

/**
 * Hook for specific experiment
 * @param {string} experimentId - Experiment ID
 * @returns {Object} Experiment-specific utilities
 */
export function useExperiment(experimentId) {
	const {
		getVariant,
		isControl,
		isVariant,
		trackConversion,
		trackEngagement,
		trackCustomMetric,
		trackError,
		getExperimentResults,
	} = useABTesting();

	const variant = getVariant(experimentId);
	const inControl = isControl(experimentId);
	const inVariant = isVariant(experimentId);
	const results = getExperimentResults(experimentId);

	return {
		variant,
		inControl,
		inVariant,
		results,

		// Tracking methods pre-bound to this experiment
		trackConversion: (event) => trackConversion(experimentId, event),
		trackEngagement: (duration) => trackEngagement(experimentId, duration),
		trackCustomMetric: (metricName, value) =>
			trackCustomMetric(experimentId, metricName, value),
		trackError: (error) => trackError(experimentId, error),
	};
}

/**
 * Hook for feature flag
 * @param {string} featureName - Feature name
 * @returns {Object} Feature-specific utilities
 */
export function useFeature(featureName) {
	const { isFeatureEnabled, getFeatureConfig } = useABTesting();

	const enabled = isFeatureEnabled(featureName);
	const config = getFeatureConfig(featureName);

	return {
		enabled,
		config,
		isControl: config?.isControl || false,
		variantId: config?.variantId || null,
		experimentId: config?.experimentId || null,
	};
}

/**
 * Higher-order component for A/B testing
 * @param {React.Component} Component - Component to wrap
 * @param {Object} options - A/B testing options
 * @returns {React.Component} Wrapped component
 */
export function withABTesting(Component, options = {}) {
	return function ABTestingWrapper(props) {
		const abTesting = useABTesting(options);

		return <Component {...props} abTesting={abTesting} />;
	};
}

/**
 * Component for conditional rendering based on A/B test
 * @param {Object} props - Component props
 * @returns {React.ReactNode} Rendered content
 */
export function ABTestVariant({
	experimentId,
	variant,
	children,
	fallback = null,
}) {
	const { getVariant } = useABTesting();
	const userVariant = getVariant(experimentId);

	if (!userVariant) return fallback;
	if (variant && userVariant.id !== variant) return fallback;

	return typeof children === "function" ? children(userVariant) : children;
}

/**
 * Component for feature-based rendering
 * @param {Object} props - Component props
 * @returns {React.ReactNode} Rendered content
 */
export function FeatureFlag({ featureName, children, fallback = null }) {
	const { enabled, config } = useFeature(featureName);

	if (!enabled) return fallback;

	return typeof children === "function" ? children(config) : children;
}

/**
 * Component for A/B testing statistics
 * @param {Object} props - Component props
 * @returns {React.ReactNode} Rendered content
 */
export function ABTestStats({ experimentId, showDetails = false }) {
	const { getExperimentResults } = useABTesting();
	const results = getExperimentResults(experimentId);

	if (!results) return null;

	return (
		<div className="ab-test-stats">
			<h4>{results.name}</h4>
			<div className="stats-summary">
				<p>Impressions: {results.totalImpressions}</p>
				<p>Conversions: {results.totalConversions}</p>
				<p>Conversion Rate: {results.conversionRate.toFixed(2)}%</p>
			</div>

			{showDetails && (
				<div className="stats-details">
					<h5>Variant Breakdown:</h5>
					{results.variants.map((variant) => (
						<div key={variant.id} className="variant-stats">
							<h6>{variant.name}</h6>
							<p>Impressions: {variant.impressions}</p>
							<p>Conversions: {variant.conversions}</p>
							<p>Conversion Rate: {variant.conversionRate.toFixed(2)}%</p>
							<p>Weight: {variant.weight}%</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default useABTesting;
