import { isAndroid, isIOS, isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class MobileThemeManager {
	constructor() {
		this.currentTheme = "auto";
		this.themes = this.defineThemes();
		this.customThemes = new Map();
		this.systemPreference = this.detectSystemPreference();
		this.breakpoints = this.defineBreakpoints();
		this.orientation = this.getOrientation();

		this.init();
	}

	defineThemes() {
		return {
			// Light themes
			light: {
				name: "Light",
				type: "light",
				colors: {
					primary: "#667eea",
					secondary: "#764ba2",
					background: "#ffffff",
					surface: "#f8f9fa",
					text: "#212529",
					textSecondary: "#6c757d",
					border: "#dee2e6",
					shadow: "rgba(0, 0, 0, 0.1)",
					success: "#28a745",
					warning: "#ffc107",
					error: "#dc3545",
					info: "#17a2b8",
				},
				typography: {
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
					fontSize: {
						xs: "12px",
						sm: "14px",
						md: "16px",
						lg: "18px",
						xl: "20px",
						"2xl": "24px",
						"3xl": "30px",
					},
					fontWeight: {
						light: 300,
						normal: 400,
						medium: 500,
						semibold: 600,
						bold: 700,
					},
					lineHeight: {
						tight: 1.25,
						normal: 1.5,
						relaxed: 1.75,
					},
				},
				spacing: {
					xs: "4px",
					sm: "8px",
					md: "16px",
					lg: "24px",
					xl: "32px",
					"2xl": "48px",
				},
				borderRadius: {
					sm: "4px",
					md: "8px",
					lg: "12px",
					xl: "16px",
					full: "50%",
				},
				shadows: {
					sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
					md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
					lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
					xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
				},
				transitions: {
					fast: "150ms ease-in-out",
					normal: "250ms ease-in-out",
					slow: "350ms ease-in-out",
				},
			},

			// Dark themes
			dark: {
				name: "Dark",
				type: "dark",
				colors: {
					primary: "#7c3aed",
					secondary: "#a855f7",
					background: "#0f172a",
					surface: "#1e293b",
					text: "#f1f5f9",
					textSecondary: "#94a3b8",
					border: "#334155",
					shadow: "rgba(0, 0, 0, 0.3)",
					success: "#10b981",
					warning: "#f59e0b",
					error: "#ef4444",
					info: "#06b6d4",
				},
				typography: {
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
					fontSize: {
						xs: "12px",
						sm: "14px",
						md: "16px",
						lg: "18px",
						xl: "20px",
						"2xl": "24px",
						"3xl": "30px",
					},
					fontWeight: {
						light: 300,
						normal: 400,
						medium: 500,
						semibold: 600,
						bold: 700,
					},
					lineHeight: {
						tight: 1.25,
						normal: 1.5,
						relaxed: 1.75,
					},
				},
				spacing: {
					xs: "4px",
					sm: "8px",
					md: "16px",
					lg: "24px",
					xl: "32px",
					"2xl": "48px",
				},
				borderRadius: {
					sm: "4px",
					md: "8px",
					lg: "12px",
					xl: "16px",
					full: "50%",
				},
				shadows: {
					sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
					md: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
					lg: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
					xl: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
				},
				transitions: {
					fast: "150ms ease-in-out",
					normal: "250ms ease-in-out",
					slow: "350ms ease-in-out",
				},
			},

			// Mobile-optimized themes
			mobileLight: {
				name: "Mobile Light",
				type: "light",
				parent: "light",
				overrides: {
					typography: {
						fontSize: {
							xs: "14px",
							sm: "16px",
							md: "18px",
							lg: "20px",
							xl: "22px",
							"2xl": "26px",
							"3xl": "32px",
						},
					},
					spacing: {
						xs: "6px",
						sm: "10px",
						md: "18px",
						lg: "26px",
						xl: "36px",
						"2xl": "52px",
					},
					borderRadius: {
						sm: "6px",
						md: "10px",
						lg: "14px",
						xl: "18px",
						full: "50%",
					},
					transitions: {
						fast: "100ms ease-out",
						normal: "200ms ease-out",
						slow: "300ms ease-out",
					},
				},
			},

			mobileDark: {
				name: "Mobile Dark",
				type: "dark",
				parent: "dark",
				overrides: {
					typography: {
						fontSize: {
							xs: "14px",
							sm: "16px",
							md: "18px",
							lg: "20px",
							xl: "22px",
							"2xl": "26px",
							"3xl": "32px",
						},
					},
					spacing: {
						xs: "6px",
						sm: "10px",
						md: "18px",
						lg: "26px",
						xl: "36px",
						"2xl": "52px",
					},
					borderRadius: {
						sm: "6px",
						md: "10px",
						lg: "14px",
						xl: "18px",
						full: "50%",
					},
					transitions: {
						fast: "100ms ease-out",
						normal: "200ms ease-out",
						slow: "300ms ease-out",
					},
				},
			},

			// High contrast themes
			highContrastLight: {
				name: "High Contrast Light",
				type: "light",
				parent: "light",
				overrides: {
					colors: {
						primary: "#0066cc",
						secondary: "#cc00cc",
						background: "#ffffff",
						surface: "#f0f0f0",
						text: "#000000",
						textSecondary: "#333333",
						border: "#000000",
						success: "#008000",
						warning: "#ff8c00",
						error: "#cc0000",
						info: "#008080",
					},
				},
			},

			highContrastDark: {
				name: "High Contrast Dark",
				type: "dark",
				parent: "dark",
				overrides: {
					colors: {
						primary: "#66b3ff",
						secondary: "#ff66ff",
						background: "#000000",
						surface: "#1a1a1a",
						text: "#ffffff",
						textSecondary: "#cccccc",
						border: "#ffffff",
						success: "#00ff00",
						warning: "#ffaa00",
						error: "#ff3333",
						info: "#00cccc",
					},
				},
			},

			// Platform-specific themes
			iosLight: {
				name: "iOS Light",
				type: "light",
				parent: "mobileLight",
				overrides: {
					colors: {
						primary: "#007aff",
						secondary: "#5856d6",
						background: "#ffffff",
						surface: "#f2f2f7",
						text: "#000000",
						textSecondary: "#3c3c43",
						border: "#c6c6c8",
					},
					typography: {
						fontFamily:
							'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
					},
					borderRadius: {
						sm: "8px",
						md: "12px",
						lg: "16px",
						xl: "20px",
						full: "50%",
					},
				},
			},

			iosDark: {
				name: "iOS Dark",
				type: "dark",
				parent: "mobileDark",
				overrides: {
					colors: {
						primary: "#0a84ff",
						secondary: "#5e5ce6",
						background: "#000000",
						surface: "#1c1c1e",
						text: "#ffffff",
						textSecondary: "#98989f",
						border: "#38383a",
					},
					typography: {
						fontFamily:
							'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
					},
					borderRadius: {
						sm: "8px",
						md: "12px",
						lg: "16px",
						xl: "20px",
						full: "50%",
					},
				},
			},

			androidLight: {
				name: "Android Light",
				type: "light",
				parent: "mobileLight",
				overrides: {
					colors: {
						primary: "#1976d2",
						secondary: "#7b1fa2",
						background: "#ffffff",
						surface: "#fafafa",
						text: "#000000",
						textSecondary: "#757575",
						border: "#e0e0e0",
					},
					typography: {
						fontFamily: 'Roboto, "Noto Sans", sans-serif',
					},
					borderRadius: {
						sm: "4px",
						md: "8px",
						lg: "12px",
						xl: "16px",
						full: "50%",
					},
				},
			},

			androidDark: {
				name: "Android Dark",
				type: "dark",
				parent: "mobileDark",
				overrides: {
					colors: {
						primary: "#90caf9",
						secondary: "#ce93d8",
						background: "#121212",
						surface: "#1e1e1e",
						text: "#ffffff",
						textSecondary: "#b3b3b3",
						border: "#333333",
					},
					typography: {
						fontFamily: 'Roboto, "Noto Sans", sans-serif',
					},
					borderRadius: {
						sm: "4px",
						md: "8px",
						lg: "12px",
						xl: "16px",
						full: "50%",
					},
				},
			},
		};
	}

	defineBreakpoints() {
		return {
			xs: "0px",
			sm: "576px",
			md: "768px",
			lg: "992px",
			xl: "1200px",
			xxl: "1400px",
			// Mobile-specific breakpoints
			mobile: "768px",
			tablet: "1024px",
			desktop: "1200px",
		};
	}

	init() {
		// Load saved theme preference
		this.loadThemePreference();

		// Apply initial theme
		this.applyTheme(this.currentTheme);

		// Setup system preference detection
		this.setupSystemPreferenceDetection();

		// Setup orientation detection
		this.setupOrientationDetection();

		// Setup responsive adjustments
		this.setupResponsiveAdjustments();
	}

	detectSystemPreference() {
		if (
			window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches
		) {
			return "dark";
		}
		return "light";
	}

	setupSystemPreferenceDetection() {
		if (window.matchMedia) {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

			mediaQuery.addEventListener("change", (e) => {
				this.systemPreference = e.matches ? "dark" : "light";

				if (this.currentTheme === "auto") {
					this.applyTheme("auto");
				}
			});
		}
	}

	setupOrientationDetection() {
		const updateOrientation = () => {
			this.orientation = this.getOrientation();
			this.applyOrientationAdjustments();
		};

		window.addEventListener("orientationchange", updateOrientation);
		window.addEventListener("resize", updateOrientation);
	}

	getOrientation() {
		if (window.orientation !== undefined) {
			return Math.abs(window.orientation) === 90 ? "landscape" : "portrait";
		}
		return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
	}

	setupResponsiveAdjustments() {
		// Apply responsive adjustments based on screen size
		const applyResponsiveStyles = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			// Apply mobile-specific adjustments
			if (width <= 768) {
				this.applyMobileAdjustments(width, height);
			}

			// Apply tablet adjustments
			else if (width <= 1024) {
				this.applyTabletAdjustments(width, height);
			}

			// Apply desktop adjustments
			else {
				this.applyDesktopAdjustments(width, height);
			}
		};

		applyResponsiveStyles();
		window.addEventListener("resize", applyResponsiveStyles);
	}

	applyMobileAdjustments(width, height) {
		const root = document.documentElement;

		// Adjust font sizes for mobile
		root.style.setProperty("--mobile-font-scale", "1.0");

		// Adjust spacing for touch targets
		root.style.setProperty("--touch-target-size", "44px");

		// Adjust safe area insets
		root.style.setProperty("--safe-area-top", "env(safe-area-inset-top)");
		root.style.setProperty("--safe-area-bottom", "env(safe-area-inset-bottom)");
		root.style.setProperty("--safe-area-left", "env(safe-area-inset-left)");
		root.style.setProperty("--safe-area-right", "env(safe-area-inset-right)");

		// Landscape adjustments
		if (width > height) {
			root.style.setProperty("--mobile-landscape", "1");
		} else {
			root.style.setProperty("--mobile-landscape", "0");
		}
	}

	applyTabletAdjustments(width, height) {
		const root = document.documentElement;

		// Adjust for tablet
		root.style.setProperty("--mobile-font-scale", "1.1");
		root.style.setProperty("--touch-target-size", "40px");
	}

	applyDesktopAdjustments(width, height) {
		const root = document.documentElement;

		// Reset mobile-specific adjustments
		root.style.setProperty("--mobile-font-scale", "1.2");
		root.style.setProperty("--touch-target-size", "32px");
	}

	applyOrientationAdjustments() {
		const root = document.documentElement;

		if (this.orientation === "landscape") {
			root.style.setProperty("--orientation", "landscape");
			root.style.setProperty("--viewport-height", `${window.innerHeight}px`);
		} else {
			root.style.setProperty("--orientation", "portrait");
			root.style.setProperty("--viewport-height", `${window.innerHeight}px`);
		}
	}

	setTheme(themeName) {
		if (!this.themes[themeName] && !this.customThemes.has(themeName)) {
			console.warn(`Theme ${themeName} not found`);
			return;
		}

		this.currentTheme = themeName;
		this.applyTheme(themeName);
		this.saveThemePreference(themeName);

		trackMobileEvent("theme_changed", { theme: themeName });
	}

	applyTheme(themeName) {
		let theme;

		if (themeName === "auto") {
			theme = this.systemPreference === "dark" ? "dark" : "light";
		} else {
			theme = themeName;
		}

		const themeData = this.getThemeData(theme);
		if (!themeData) return;

		// Apply theme to CSS variables
		this.applyCSSVariables(themeData);

		// Apply platform-specific adjustments
		this.applyPlatformAdjustments(themeData);

		// Update meta tags
		this.updateMetaTags(themeData);
	}

	getThemeData(themeName) {
		let theme = this.themes[themeName];

		if (!theme) {
			theme = this.customThemes.get(themeName);
		}

		// Handle inheritance
		if (theme && theme.parent) {
			const parentTheme = this.getThemeData(theme.parent);
			return this.mergeThemes(parentTheme, theme);
		}

		return theme;
	}

	mergeThemes(parent, child) {
		const merged = JSON.parse(JSON.stringify(parent));

		if (child.overrides) {
			this.deepMerge(merged, child.overrides);
		}

		return merged;
	}

	deepMerge(target, source) {
		for (const key in source) {
			if (
				source[key] &&
				typeof source[key] === "object" &&
				!Array.isArray(source[key])
			) {
				target[key] = target[key] || {};
				this.deepMerge(target[key], source[key]);
			} else {
				target[key] = source[key];
			}
		}
	}

	applyCSSVariables(theme) {
		const root = document.documentElement;

		// Apply colors
		if (theme.colors) {
			Object.entries(theme.colors).forEach(([key, value]) => {
				root.style.setProperty(`--color-${key}`, value);
			});
		}

		// Apply typography
		if (theme.typography) {
			root.style.setProperty("--font-family", theme.typography.fontFamily);

			if (theme.typography.fontSize) {
				Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
					root.style.setProperty(`--font-size-${key}`, value);
				});
			}

			if (theme.typography.fontWeight) {
				Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
					root.style.setProperty(`--font-weight-${key}`, value);
				});
			}

			if (theme.typography.lineHeight) {
				Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
					root.style.setProperty(`--line-height-${key}`, value);
				});
			}
		}

		// Apply spacing
		if (theme.spacing) {
			Object.entries(theme.spacing).forEach(([key, value]) => {
				root.style.setProperty(`--spacing-${key}`, value);
			});
		}

		// Apply border radius
		if (theme.borderRadius) {
			Object.entries(theme.borderRadius).forEach(([key, value]) => {
				root.style.setProperty(`--radius-${key}`, value);
			});
		}

		// Apply shadows
		if (theme.shadows) {
			Object.entries(theme.shadows).forEach(([key, value]) => {
				root.style.setProperty(`--shadow-${key}`, value);
			});
		}

		// Apply transitions
		if (theme.transitions) {
			Object.entries(theme.transitions).forEach(([key, value]) => {
				root.style.setProperty(`--transition-${key}`, value);
			});
		}
	}

	applyPlatformAdjustments(theme) {
		// Apply platform-specific adjustments
		if (isIOS()) {
			document.body.classList.add("ios-platform");
		} else if (isAndroid()) {
			document.body.classList.add("android-platform");
		}

		// Apply theme type class
		document.body.classList.remove("theme-light", "theme-dark");
		document.body.classList.add(`theme-${theme.type}`);
	}

	updateMetaTags(theme) {
		// Update theme-color meta tag
		let themeColor = theme.colors?.primary || "#667eea";
		const metaThemeColor = document.querySelector('meta[name="theme-color"]');
		if (metaThemeColor) {
			metaThemeColor.content = themeColor;
		}

		// Update apple-mobile-web-app-status-bar-style
		const metaStatusBar = document.querySelector(
			'meta[name="apple-mobile-web-app-status-bar-style"]'
		);
		if (metaStatusBar) {
			metaStatusBar.content =
				theme.type === "dark" ? "black-translucent" : "default";
		}
	}

	createCustomTheme(name, config) {
		const customTheme = {
			name: config.name || name,
			type: config.type || "light",
			parent: config.parent || "light",
			overrides: config.overrides || {},
		};

		this.customThemes.set(name, customTheme);

		trackMobileEvent("custom_theme_created", { name, type: customTheme.type });
	}

	deleteCustomTheme(name) {
		if (this.customThemes.has(name)) {
			this.customThemes.delete(name);

			// Switch to default theme if current theme was deleted
			if (this.currentTheme === name) {
				this.setTheme("auto");
			}

			trackMobileEvent("custom_theme_deleted", { name });
		}
	}

	saveThemePreference(theme) {
		localStorage.setItem("mobile-theme", theme);
	}

	loadThemePreference() {
		const saved = localStorage.getItem("mobile-theme");
		if (saved && (this.themes[saved] || this.customThemes.has(saved))) {
			this.currentTheme = saved;
		}
	}

	getAvailableThemes() {
		const themes = Object.keys(this.themes);
		const custom = Array.from(this.customThemes.keys());
		return [...themes, ...custom];
	}

	getCurrentTheme() {
		return this.currentTheme;
	}

	getThemeData(themeName) {
		if (themeName === "auto") {
			return this.getThemeData(this.systemPreference);
		}

		return this.themes[themeName] || this.customThemes.get(themeName);
	}

	getCSSVariable(variable) {
		return getComputedStyle(document.documentElement)
			.getPropertyValue(variable)
			.trim();
	}

	// Utility methods for theme-aware styling
	getColor(colorName, theme = null) {
		const themeData = theme
			? this.getThemeData(theme)
			: this.getThemeData(this.currentTheme);
		return themeData?.colors?.[colorName] || null;
	}

	getFontSize(size, theme = null) {
		const themeData = theme
			? this.getThemeData(theme)
			: this.getThemeData(this.currentTheme);
		return themeData?.typography?.fontSize?.[size] || null;
	}

	getSpacing(size, theme = null) {
		const themeData = theme
			? this.getThemeData(theme)
			: this.getThemeData(this.currentTheme);
		return themeData?.spacing?.[size] || null;
	}

	isDarkTheme(theme = null) {
		const themeData = theme
			? this.getThemeData(theme)
			: this.getThemeData(this.currentTheme);
		return themeData?.type === "dark";
	}

	isLightTheme(theme = null) {
		return !this.isDarkTheme(theme);
	}
}

// Create singleton instance
const mobileThemeManager = new MobileThemeManager();

export default mobileThemeManager;
