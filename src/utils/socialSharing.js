import { isAndroid, isIOS, isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class SocialSharingManager {
	constructor() {
		this.isSupported = this.checkSupport();
		this.shareData = {};
		this.customProviders = new Map();

		this.init();
	}

	checkSupport() {
		return (
			"navigator" in window &&
			("share" in navigator || // Web Share API
				"clipboard" in navigator || // Clipboard API
				"matchMedia" in window) // For platform detection
		);
	}

	init() {
		this.setupDefaultProviders();
		this.setupEventListeners();
	}

	setupDefaultProviders() {
		this.providers = {
			// Native sharing
			native: {
				name: "Share",
				icon: "📤",
				priority: 1,
				supported: "share" in navigator,
				handler: this.shareNative.bind(this),
			},

			// Clipboard
			clipboard: {
				name: "Copy Link",
				icon: "📋",
				priority: 2,
				supported: "clipboard" in navigator,
				handler: this.copyToClipboard.bind(this),
			},

			// Social media platforms
			twitter: {
				name: "Twitter",
				icon: "🐦",
				priority: 3,
				supported: true,
				handler: this.shareToTwitter.bind(this),
				url: "https://twitter.com/intent/tweet",
			},

			facebook: {
				name: "Facebook",
				icon: "📘",
				priority: 4,
				supported: true,
				handler: this.shareToFacebook.bind(this),
				url: "https://www.facebook.com/sharer/sharer.php",
			},

			linkedin: {
				name: "LinkedIn",
				icon: "💼",
				priority: 5,
				supported: true,
				handler: this.shareToLinkedIn.bind(this),
				url: "https://www.linkedin.com/sharing/share-offsite/",
			},

			reddit: {
				name: "Reddit",
				icon: "🤖",
				priority: 6,
				supported: true,
				handler: this.shareToReddit.bind(this),
				url: "https://www.reddit.com/submit",
			},

			// Messaging platforms
			whatsapp: {
				name: "WhatsApp",
				icon: "💬",
				priority: 7,
				supported: isMobile(),
				handler: this.shareToWhatsApp.bind(this),
				url: "https://wa.me/",
			},

			telegram: {
				name: "Telegram",
				icon: "✈️",
				priority: 8,
				supported: true,
				handler: this.shareToTelegram.bind(this),
				url: "https://t.me/share/url",
			},

			// Email
			email: {
				name: "Email",
				icon: "📧",
				priority: 9,
				supported: true,
				handler: this.shareToEmail.bind(this),
				url: "mailto:",
			},

			// QR Code
			qrcode: {
				name: "QR Code",
				icon: "📱",
				priority: 10,
				supported: true,
				handler: this.generateQRCode.bind(this),
			},
		};
	}

	setupEventListeners() {
		// Listen for share events
		if ("share" in navigator) {
			navigator.addEventListener("share", (event) => {
				event.preventDefault();
				this.handleShareEvent(event);
			});
		}
	}

	async share(options) {
		const {
			title = "EmuDevz - Retro Game Development",
			text = "Check out this awesome retro game development platform!",
			url = window.location.href,
			image = null,
			levelData = null,
			score = null,
			achievement = null,
		} = options;

		// Store share data
		this.shareData = {
			title,
			text,
			url,
			image,
			levelData,
			score,
			achievement,
			timestamp: Date.now(),
		};

		// Track share attempt
		trackMobileEvent("share_attempted", {
			title,
			hasImage: !!image,
			hasLevelData: !!levelData,
			hasScore: score !== null,
			hasAchievement: !!achievement,
		});

		// Show share dialog
		return this.showShareDialog();
	}

	async showShareDialog() {
		const supportedProviders = Object.entries(this.providers)
			.filter(([_, provider]) => provider.supported)
			.sort(([_, a], [__, b]) => a.priority - b.priority);

		if (supportedProviders.length === 0) {
			throw new Error("No sharing providers available");
		}

		// If only one provider (usually native), use it directly
		if (
			supportedProviders.length === 1 &&
			supportedProviders[0][0] === "native"
		) {
			return this.shareNative();
		}

		// Show provider selection dialog
		return this.showProviderSelection(supportedProviders);
	}

	showProviderSelection(providers) {
		return new Promise((resolve, reject) => {
			// Create modal overlay
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
				animation: fadeIn 0.3s ease-out;
			`;

			// Create dialog
			const dialog = document.createElement("div");
			dialog.style.cssText = `
				background: white;
				border-radius: 12px;
				padding: 20px;
				max-width: 90%;
				max-height: 80%;
				overflow-y: auto;
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				animation: slideUp 0.3s ease-out;
			`;

			// Add title
			const title = document.createElement("h3");
			title.textContent = "Share";
			title.style.cssText = `
				margin: 0 0 15px 0;
				color: #333;
				font-size: 18px;
				text-align: center;
			`;
			dialog.appendChild(title);

			// Add provider grid
			const grid = document.createElement("div");
			grid.style.cssText = `
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
				gap: 10px;
				margin-bottom: 15px;
			`;

			providers.forEach(([key, provider]) => {
				const button = document.createElement("button");
				button.style.cssText = `
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 15px 10px;
					border: 1px solid #ddd;
					border-radius: 8px;
					background: white;
					cursor: pointer;
					transition: all 0.2s;
					font-size: 12px;
					color: #333;
				`;

				button.innerHTML = `
					<span style="font-size: 24px; margin-bottom: 5px;">${provider.icon}</span>
					<span>${provider.name}</span>
				`;

				button.addEventListener("click", async () => {
					try {
						const result = await provider.handler();
						document.body.removeChild(overlay);
						resolve(result);
					} catch (error) {
						reject(error);
					}
				});

				button.addEventListener("mouseenter", () => {
					button.style.background = "#f5f5f5";
					button.style.transform = "translateY(-2px)";
				});

				button.addEventListener("mouseleave", () => {
					button.style.background = "white";
					button.style.transform = "translateY(0)";
				});

				grid.appendChild(button);
			});

			dialog.appendChild(grid);

			// Add cancel button
			const cancelButton = document.createElement("button");
			cancelButton.textContent = "Cancel";
			cancelButton.style.cssText = `
				width: 100%;
				padding: 12px;
				border: none;
				border-radius: 8px;
				background: #f44336;
				color: white;
				font-size: 16px;
				cursor: pointer;
			`;

			cancelButton.addEventListener("click", () => {
				document.body.removeChild(overlay);
				reject(new Error("Share cancelled"));
			});

			dialog.appendChild(cancelButton);
			overlay.appendChild(dialog);
			document.body.appendChild(overlay);

			// Add animations
			const style = document.createElement("style");
			style.textContent = `
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes slideUp {
					from { transform: translateY(20px); opacity: 0; }
					to { transform: translateY(0); opacity: 1; }
				}
			`;
			document.head.appendChild(style);

			// Close on overlay click
			overlay.addEventListener("click", (e) => {
				if (e.target === overlay) {
					document.body.removeChild(overlay);
					reject(new Error("Share cancelled"));
				}
			});
		});
	}

	async shareNative() {
		if (!("share" in navigator)) {
			throw new Error("Native sharing not supported");
		}

		try {
			const shareData = {
				title: this.shareData.title,
				text: this.shareData.text,
				url: this.shareData.url,
			};

			if (this.shareData.image) {
				// For images, we need to fetch and convert to blob
				const response = await fetch(this.shareData.image);
				const blob = await response.blob();
				const file = new File([blob], "share.png", { type: "image/png" });
				shareData.files = [file];
			}

			await navigator.share(shareData);

			trackMobileEvent("share_success", {
				method: "native",
				title: this.shareData.title,
			});

			return { success: true, method: "native" };
		} catch (error) {
			if (error.name === "AbortError") {
				throw new Error("Share cancelled");
			}
			throw error;
		}
	}

	async copyToClipboard() {
		if (!("clipboard" in navigator)) {
			throw new Error("Clipboard not supported");
		}

		try {
			await navigator.clipboard.writeText(this.shareData.url);

			// Show success message
			this.showToast("Link copied to clipboard!");

			trackMobileEvent("share_success", {
				method: "clipboard",
				title: this.shareData.title,
			});

			return { success: true, method: "clipboard" };
		} catch (error) {
			throw new Error("Failed to copy to clipboard");
		}
	}

	async shareToTwitter() {
		const params = new URLSearchParams({
			text: `${this.shareData.title} - ${this.shareData.text}`,
			url: this.shareData.url,
		});

		const url = `${this.providers.twitter.url}?${params.toString()}`;
		return this.openShareWindow(url, "twitter");
	}

	async shareToFacebook() {
		const params = new URLSearchParams({
			u: this.shareData.url,
			quote: `${this.shareData.title} - ${this.shareData.text}`,
		});

		const url = `${this.providers.facebook.url}?${params.toString()}`;
		return this.openShareWindow(url, "facebook");
	}

	async shareToLinkedIn() {
		const params = new URLSearchParams({
			url: this.shareData.url,
			title: this.shareData.title,
			summary: this.shareData.text,
		});

		const url = `${this.providers.linkedin.url}?${params.toString()}`;
		return this.openShareWindow(url, "linkedin");
	}

	async shareToReddit() {
		const params = new URLSearchParams({
			url: this.shareData.url,
			title: this.shareData.title,
		});

		const url = `${this.providers.reddit.url}?${params.toString()}`;
		return this.openShareWindow(url, "reddit");
	}

	async shareToWhatsApp() {
		const params = new URLSearchParams({
			text: `${this.shareData.title} - ${this.shareData.text} ${this.shareData.url}`,
		});

		const url = `${this.providers.whatsapp.url}?${params.toString()}`;
		return this.openShareWindow(url, "whatsapp");
	}

	async shareToTelegram() {
		const params = new URLSearchParams({
			url: this.shareData.url,
			text: `${this.shareData.title} - ${this.shareData.text}`,
		});

		const url = `${this.providers.telegram.url}?${params.toString()}`;
		return this.openShareWindow(url, "telegram");
	}

	async shareToEmail() {
		const params = new URLSearchParams({
			subject: this.shareData.title,
			body: `${this.shareData.text}\n\n${this.shareData.url}`,
		});

		const url = `${this.providers.email.url}?${params.toString()}`;
		return this.openShareWindow(url, "email");
	}

	async generateQRCode() {
		// Generate QR code (would need QR code library)
		// For now, just show the URL
		this.showQRCodeDialog(this.shareData.url);

		trackMobileEvent("share_qrcode_generated", {
			url: this.shareData.url,
		});

		return { success: true, method: "qrcode" };
	}

	openShareWindow(url, provider) {
		const width = 600;
		const height = 400;
		const left = (window.innerWidth - width) / 2;
		const top = (window.innerHeight - height) / 2;

		const popup = window.open(
			url,
			`share_${provider}`,
			`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
		);

		if (popup) {
			// Track when popup is closed
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					clearInterval(checkClosed);
					trackMobileEvent("share_success", {
						method: provider,
						title: this.shareData.title,
					});
				}
			}, 1000);
		} else {
			// Fallback to opening in same window
			window.location.href = url;
		}

		return { success: true, method: provider };
	}

	showToast(message) {
		const toast = document.createElement("div");
		toast.textContent = message;
		toast.style.cssText = `
			position: fixed;
			bottom: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: #333;
			color: white;
			padding: 12px 20px;
			border-radius: 8px;
			z-index: 10001;
			animation: slideUp 0.3s ease-out;
		`;

		document.body.appendChild(toast);

		setTimeout(() => {
			toast.style.animation = "fadeOut 0.3s ease-out";
			setTimeout(() => {
				if (toast.parentNode) {
					document.body.removeChild(toast);
				}
			}, 300);
		}, 3000);
	}

	showQRCodeDialog(url) {
		// Create QR code dialog
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
		`;

		const dialog = document.createElement("div");
		dialog.style.cssText = `
			background: white;
			border-radius: 12px;
			padding: 20px;
			text-align: center;
			max-width: 90%;
		`;

		dialog.innerHTML = `
			<h3 style="margin: 0 0 15px 0;">QR Code</h3>
			<div style="
				background: #f0f0f0;
				border: 2px dashed #ccc;
				padding: 20px;
				margin: 15px 0;
				border-radius: 8px;
				word-break: break-all;
				font-family: monospace;
				font-size: 12px;
			">${url}</div>
			<button style="
				padding: 10px 20px;
				border: none;
				border-radius: 6px;
				background: #667eea;
				color: white;
				cursor: pointer;
			">Close</button>
		`;

		dialog.querySelector("button").addEventListener("click", () => {
			document.body.removeChild(overlay);
		});

		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) {
				document.body.removeChild(overlay);
			}
		});

		overlay.appendChild(dialog);
		document.body.appendChild(overlay);
	}

	// Custom provider methods
	addCustomProvider(name, config) {
		this.customProviders.set(name, {
			name: config.name || name,
			icon: config.icon || "🔗",
			priority: config.priority || 99,
			supported: true,
			handler: config.handler,
			url: config.url,
		});

		trackMobileEvent("custom_provider_added", { name });
	}

	removeCustomProvider(name) {
		this.customProviders.delete(name);
		trackMobileEvent("custom_provider_removed", { name });
	}

	// Utility methods
	getSharePreview() {
		return {
			title: this.shareData.title,
			text: this.shareData.text,
			url: this.shareData.url,
			image: this.shareData.image,
			score: this.shareData.score,
			achievement: this.shareData.achievement,
		};
	}

	getSupportedProviders() {
		const allProviders = { ...this.providers };

		// Add custom providers
		for (const [name, provider] of this.customProviders) {
			allProviders[name] = provider;
		}

		return Object.entries(allProviders)
			.filter(([_, provider]) => provider.supported)
			.sort(([_, a], [__, b]) => a.priority - b.priority);
	}

	isProviderSupported(providerName) {
		const provider =
			this.providers[providerName] || this.customProviders.get(providerName);
		return provider && provider.supported;
	}

	// Specialized sharing methods
	async shareLevel(levelData) {
		return this.share({
			title: `Check out my level: ${levelData.name}`,
			text: `I created an awesome level in EmuDevz!`,
			url: `${window.location.origin}/level/${levelData.id}`,
			levelData,
		});
	}

	async shareScore(score, levelName) {
		return this.share({
			title: `New high score in ${levelName}!`,
			text: `I just scored ${score} points in ${levelName} on EmuDevz!`,
			url: window.location.href,
			score,
		});
	}

	async shareAchievement(achievement) {
		return this.share({
			title: `Achievement unlocked: ${achievement.name}`,
			text: `I just unlocked "${achievement.name}" in EmuDevz!`,
			url: window.location.href,
			achievement,
		});
	}

	async shareProgress(progress) {
		return this.share({
			title: `My EmuDevz Progress`,
			text: `I've completed ${progress.levelsCompleted} levels and earned ${progress.achievementsUnlocked} achievements!`,
			url: window.location.href,
		});
	}
}

// Create singleton instance
const socialSharingManager = new SocialSharingManager();

export default socialSharingManager;
