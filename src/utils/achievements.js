import cloudSaveManager from "./cloudSave";
import { isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class AchievementManager {
	constructor() {
		this.achievements = this.defineAchievements();
		this.unlockedAchievements = new Set();
		this.progress = new Map();
		this.milestones = new Map();
		this.notifications = [];
		this.isInitialized = false;

		this.init();
	}

	defineAchievements() {
		return {
			// Level completion achievements
			first_level: {
				id: "first_level",
				name: "First Steps",
				description: "Complete your first level",
				icon: "🎯",
				category: "progression",
				rarity: "common",
				points: 10,
				secret: false,
				dependencies: [],
				conditions: {
					type: "level_completion",
					count: 1,
				},
			},

			level_master: {
				id: "level_master",
				name: "Level Master",
				description: "Complete 10 levels",
				icon: "🏆",
				category: "progression",
				rarity: "rare",
				points: 50,
				secret: false,
				dependencies: ["first_level"],
				conditions: {
					type: "level_completion",
					count: 10,
				},
			},

			speed_demon: {
				id: "speed_demon",
				name: "Speed Demon",
				description: "Complete a level in under 30 seconds",
				icon: "⚡",
				category: "skill",
				rarity: "uncommon",
				points: 25,
				secret: false,
				dependencies: [],
				conditions: {
					type: "speed_run",
					maxTime: 30,
				},
			},

			perfect_run: {
				id: "perfect_run",
				name: "Perfect Run",
				description: "Complete a level without any errors",
				icon: "💎",
				category: "skill",
				rarity: "rare",
				points: 40,
				secret: false,
				dependencies: [],
				conditions: {
					type: "perfect_completion",
					errors: 0,
				},
			},

			// Code-related achievements
			code_ninja: {
				id: "code_ninja",
				name: "Code Ninja",
				description: "Write 100 lines of code",
				icon: "🥷",
				category: "coding",
				rarity: "common",
				points: 15,
				secret: false,
				dependencies: [],
				conditions: {
					type: "code_lines",
					count: 100,
				},
			},

			efficiency_expert: {
				id: "efficiency_expert",
				name: "Efficiency Expert",
				description: "Solve a puzzle with minimal code",
				icon: "⚙️",
				category: "coding",
				rarity: "uncommon",
				points: 30,
				secret: false,
				dependencies: [],
				conditions: {
					type: "code_efficiency",
					ratio: 0.5, // 50% less code than average
				},
			},

			bug_hunter: {
				id: "bug_hunter",
				name: "Bug Hunter",
				description: "Fix 10 bugs in your code",
				icon: "🐛",
				category: "coding",
				rarity: "common",
				points: 20,
				secret: false,
				dependencies: [],
				conditions: {
					type: "bugs_fixed",
					count: 10,
				},
			},

			// Learning achievements
			quick_learner: {
				id: "quick_learner",
				name: "Quick Learner",
				description: "Complete 5 tutorial levels",
				icon: "📚",
				category: "learning",
				rarity: "common",
				points: 20,
				secret: false,
				dependencies: [],
				conditions: {
					type: "tutorial_completion",
					count: 5,
				},
			},

			concept_master: {
				id: "concept_master",
				name: "Concept Master",
				description: "Master all programming concepts",
				icon: "🧠",
				category: "learning",
				rarity: "legendary",
				points: 100,
				secret: false,
				dependencies: ["quick_learner"],
				conditions: {
					type: "concept_mastery",
					concepts: ["variables", "loops", "functions", "arrays", "objects"],
				},
			},

			// Social achievements
			sharing_is_caring: {
				id: "sharing_is_caring",
				name: "Sharing is Caring",
				description: "Share your progress with friends",
				icon: "🤝",
				category: "social",
				rarity: "common",
				points: 10,
				secret: false,
				dependencies: [],
				conditions: {
					type: "share",
					count: 1,
				},
			},

			community_helper: {
				id: "community_helper",
				name: "Community Helper",
				description: "Help 5 other players",
				icon: "💪",
				category: "social",
				rarity: "uncommon",
				points: 35,
				secret: false,
				dependencies: ["sharing_is_caring"],
				conditions: {
					type: "help_others",
					count: 5,
				},
			},

			// Streak achievements
			daily_player: {
				id: "daily_player",
				name: "Daily Player",
				description: "Play the game 7 days in a row",
				icon: "📅",
				category: "engagement",
				rarity: "uncommon",
				points: 30,
				secret: false,
				dependencies: [],
				conditions: {
					type: "daily_streak",
					days: 7,
				},
			},

			dedicated_player: {
				id: "dedicated_player",
				name: "Dedicated Player",
				description: "Play the game 30 days in a row",
				icon: "🔥",
				category: "engagement",
				rarity: "rare",
				points: 60,
				secret: false,
				dependencies: ["daily_player"],
				conditions: {
					type: "daily_streak",
					days: 30,
				},
			},

			// Secret achievements
			easteregg_hunter: {
				id: "easteregg_hunter",
				name: "Easter Egg Hunter",
				description: "Find a hidden secret",
				icon: "🥚",
				category: "secret",
				rarity: "legendary",
				points: 75,
				secret: true,
				dependencies: [],
				conditions: {
					type: "easteregg_found",
					count: 1,
				},
			},

			// Mobile-specific achievements
			mobile_master: {
				id: "mobile_master",
				name: "Mobile Master",
				description: "Complete 5 levels on mobile",
				icon: "📱",
				category: "mobile",
				rarity: "uncommon",
				points: 25,
				secret: false,
				dependencies: [],
				conditions: {
					type: "mobile_completion",
					count: 5,
				},
			},

			gesture_guru: {
				id: "gesture_guru",
				name: "Gesture Guru",
				description: "Use 10 different gestures",
				icon: "👆",
				category: "mobile",
				rarity: "common",
				points: 15,
				secret: false,
				dependencies: [],
				conditions: {
					type: "gesture_usage",
					unique: 10,
				},
			},

			// Challenge achievements
			challenge_winner: {
				id: "challenge_winner",
				name: "Challenge Winner",
				description: "Win a mobile challenge",
				icon: "🏅",
				category: "challenges",
				rarity: "rare",
				points: 45,
				secret: false,
				dependencies: [],
				conditions: {
					type: "challenge_win",
					count: 1,
				},
			},

			challenge_legend: {
				id: "challenge_legend",
				name: "Challenge Legend",
				description: "Win 10 challenges",
				icon: "👑",
				category: "challenges",
				rarity: "legendary",
				points: 80,
				secret: false,
				dependencies: ["challenge_winner"],
				conditions: {
					type: "challenge_win",
					count: 10,
				},
			},
		};
	}

	init() {
		this.loadAchievements();
		this.setupEventListeners();
		this.setupProgressTracking();
		this.isInitialized = true;
	}

	loadAchievements() {
		try {
			const saved = localStorage.getItem("achievements");
			if (saved) {
				const data = JSON.parse(saved);
				this.unlockedAchievements = new Set(data.unlocked || []);
				this.progress = new Map(data.progress || []);
				this.milestones = new Map(data.milestones || []);
			}
		} catch (error) {
			console.error("Failed to load achievements:", error);
		}
	}

	saveAchievements() {
		try {
			const data = {
				unlocked: Array.from(this.unlockedAchievements),
				progress: Array.from(this.progress.entries()),
				milestones: Array.from(this.milestones.entries()),
				lastSaved: Date.now(),
			};

			localStorage.setItem("achievements", JSON.stringify(data));

			// Also save to cloud if available
			if (cloudSaveManager.isSupported) {
				cloudSaveManager.saveToCloud({ achievements: data });
			}
		} catch (error) {
			console.error("Failed to save achievements:", error);
		}
	}

	setupEventListeners() {
		// Listen for game events
		window.addEventListener("level_completed", (event) => {
			this.onLevelCompleted(event.detail);
		});

		window.addEventListener("code_executed", (event) => {
			this.onCodeExecuted(event.detail);
		});

		window.addEventListener("error_occurred", (event) => {
			this.onErrorOccurred(event.detail);
		});

		window.addEventListener("share_completed", (event) => {
			this.onShareCompleted(event.detail);
		});

		window.addEventListener("gesture_used", (event) => {
			this.onGestureUsed(event.detail);
		});

		window.addEventListener("challenge_completed", (event) => {
			this.onChallengeCompleted(event.detail);
		});
	}

	setupProgressTracking() {
		// Track daily activity
		this.trackDailyActivity();

		// Track session time
		this.trackSessionTime();

		// Save progress periodically
		setInterval(() => {
			this.saveAchievements();
		}, 30000); // Save every 30 seconds
	}

	trackDailyActivity() {
		const today = new Date().toDateString();
		const lastActive = localStorage.getItem("last_active_date");

		if (lastActive !== today) {
			// New day, check streak
			const yesterday = new Date(Date.now() - 86400000).toDateString();
			const streak = this.milestones.get("daily_streak") || 0;

			if (lastActive === yesterday) {
				// Continue streak
				this.milestones.set("daily_streak", streak + 1);
			} else if (lastActive) {
				// Break streak
				this.milestones.set("daily_streak", 1);
			} else {
				// First time
				this.milestones.set("daily_streak", 1);
			}

			localStorage.setItem("last_active_date", today);
			this.checkAchievements(
				"daily_streak",
				this.milestones.get("daily_streak")
			);
		}
	}

	trackSessionTime() {
		const sessionStart = Date.now();

		window.addEventListener("beforeunload", () => {
			const sessionTime = Date.now() - sessionStart;
			const totalTime =
				(this.milestones.get("total_play_time") || 0) + sessionTime;
			this.milestones.set("total_play_time", totalTime);

			// Check time-based achievements
			this.checkAchievements("total_play_time", totalTime);
		});
	}

	onLevelCompleted(data) {
		const { levelId, time, errors, isMobile } = data;

		// Update level completion progress
		const completed = this.progress.get("levels_completed") || 0;
		this.progress.set("levels_completed", completed + 1);
		this.checkAchievements("level_completion", completed + 1);

		// Check speed achievements
		if (time) {
			this.checkAchievements("speed_run", { time, maxTime: 30 });
		}

		// Check perfect run
		if (!errors || errors === 0) {
			this.checkAchievements("perfect_completion", { errors: 0 });
		}

		// Check mobile achievements
		if (isMobile) {
			const mobileCompleted = this.progress.get("mobile_completions") || 0;
			this.progress.set("mobile_completions", mobileCompleted + 1);
			this.checkAchievements("mobile_completion", mobileCompleted + 1);
		}
	}

	onCodeExecuted(data) {
		const { lines, efficiency } = data;

		// Track code lines
		if (lines) {
			const totalLines = this.progress.get("code_lines_written") || 0;
			this.progress.set("code_lines_written", totalLines + lines);
			this.checkAchievements("code_lines", totalLines + lines);
		}

		// Check efficiency
		if (efficiency) {
			this.checkAchievements("code_efficiency", { ratio: efficiency });
		}
	}

	onErrorOccurred(data) {
		const { fixed } = data;

		if (fixed) {
			const bugsFixed = this.progress.get("bugs_fixed") || 0;
			this.progress.set("bugs_fixed", bugsFixed + 1);
			this.checkAchievements("bugs_fixed", bugsFixed + 1);
		}
	}

	onShareCompleted(data) {
		const shares = this.progress.get("shares_completed") || 0;
		this.progress.set("shares_completed", shares + 1);
		this.checkAchievements("share", shares + 1);
	}

	onGestureUsed(data) {
		const { gesture } = data;
		const usedGestures = this.progress.get("gestures_used") || new Set();
		usedGestures.add(gesture);
		this.progress.set("gestures_used", usedGestures);
		this.checkAchievements("gesture_usage", { unique: usedGestures.size });
	}

	onChallengeCompleted(data) {
		const { won } = data;

		if (won) {
			const challengesWon = this.progress.get("challenges_won") || 0;
			this.progress.set("challenges_won", challengesWon + 1);
			this.checkAchievements("challenge_win", challengesWon + 1);
		}
	}

	checkAchievements(type, data) {
		for (const [id, achievement] of Object.entries(this.achievements)) {
			if (this.unlockedAchievements.has(id)) continue;

			if (this.isAchievementUnlocked(achievement, type, data)) {
				this.unlockAchievement(id);
			}
		}
	}

	isAchievementUnlocked(achievement, type, data) {
		const { conditions } = achievement;

		if (conditions.type !== type) return false;

		// Check dependencies
		if (achievement.dependencies.length > 0) {
			const hasAllDependencies = achievement.dependencies.every((dep) =>
				this.unlockedAchievements.has(dep)
			);
			if (!hasAllDependencies) return false;
		}

		// Check conditions
		switch (conditions.type) {
			case "level_completion":
				return data >= conditions.count;

			case "speed_run":
				return data.time <= conditions.maxTime;

			case "perfect_completion":
				return data.errors === conditions.errors;

			case "code_lines":
				return data >= conditions.count;

			case "code_efficiency":
				return data.ratio <= conditions.ratio;

			case "bugs_fixed":
				return data >= conditions.count;

			case "tutorial_completion":
				return data >= conditions.count;

			case "concept_mastery":
				return conditions.concepts.every((concept) =>
					this.progress.has(`concept_${concept}`)
				);

			case "share":
				return data >= conditions.count;

			case "help_others":
				return data >= conditions.count;

			case "daily_streak":
				return data >= conditions.days;

			case "easteregg_found":
				return data >= conditions.count;

			case "mobile_completion":
				return data >= conditions.count;

			case "gesture_usage":
				return data.unique >= conditions.unique;

			case "challenge_win":
				return data >= conditions.count;

			default:
				return false;
		}
	}

	unlockAchievement(achievementId) {
		const achievement = this.achievements[achievementId];
		if (!achievement || this.unlockedAchievements.has(achievementId)) return;

		this.unlockedAchievements.add(achievementId);

		// Show notification
		this.showAchievementNotification(achievement);

		// Track analytics
		trackMobileEvent("achievement_unlocked", {
			id: achievementId,
			name: achievement.name,
			category: achievement.category,
			rarity: achievement.rarity,
			points: achievement.points,
		});

		// Add to notifications
		this.notifications.push({
			achievement,
			timestamp: Date.now(),
		});

		// Save progress
		this.saveAchievements();

		// Emit event
		window.dispatchEvent(
			new CustomEvent("achievement_unlocked", {
				detail: { achievement },
			})
		);
	}

	showAchievementNotification(achievement) {
		// Create notification element
		const notification = document.createElement("div");
		notification.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 15px 20px;
			border-radius: 12px;
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
			z-index: 10000;
			max-width: 300px;
			animation: slideInRight 0.5s ease-out;
		`;

		notification.innerHTML = `
			<div style="display: flex; align-items: center; gap: 12px;">
				<span style="font-size: 24px;">${achievement.icon}</span>
				<div>
					<div style="font-weight: bold; margin-bottom: 4px;">Achievement Unlocked!</div>
					<div style="font-size: 14px; opacity: 0.9;">${achievement.name}</div>
					<div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${achievement.description}</div>
					<div style="font-size: 12px; margin-top: 4px;">+${achievement.points} points</div>
				</div>
			</div>
		`;

		document.body.appendChild(notification);

		// Haptic feedback on mobile
		if (isMobile() && navigator.vibrate) {
			navigator.vibrate([50, 30, 50]);
		}

		// Auto remove after 5 seconds
		setTimeout(() => {
			notification.style.animation = "slideOutRight 0.5s ease-out";
			setTimeout(() => {
				if (notification.parentNode) {
					document.body.removeChild(notification);
				}
			}, 500);
		}, 5000);

		// Add animations
		if (!document.getElementById("achievement-animations")) {
			const style = document.createElement("style");
			style.id = "achievement-animations";
			style.textContent = `
				@keyframes slideInRight {
					from { transform: translateX(100%); opacity: 0; }
					to { transform: translateX(0); opacity: 1; }
				}
				@keyframes slideOutRight {
					from { transform: translateX(0); opacity: 1; }
					to { transform: translateX(100%); opacity: 0; }
				}
			`;
			document.head.appendChild(style);
		}
	}

	// Public API
	getAchievement(achievementId) {
		return this.achievements[achievementId];
	}

	getAllAchievements() {
		return Object.entries(this.achievements).map(([id, achievement]) => ({
			...achievement,
			unlocked: this.unlockedAchievements.has(id),
			progress: this.getAchievementProgress(id),
		}));
	}

	getAchievementsByCategory(category) {
		return this.getAllAchievements().filter(
			(achievement) => achievement.category === category
		);
	}

	getUnlockedAchievements() {
		return Array.from(this.unlockedAchievements).map((id) => ({
			...this.achievements[id],
			id,
			unlockedAt: this.progress.get(`${id}_unlocked_at`),
		}));
	}

	getLockedAchievements() {
		return this.getAllAchievements().filter(
			(achievement) => !achievement.unlocked
		);
	}

	getAchievementProgress(achievementId) {
		const achievement = this.achievements[achievementId];
		if (!achievement) return null;

		const { conditions } = achievement;
		let current = 0;
		let target = 1;

		switch (conditions.type) {
			case "level_completion":
				current = this.progress.get("levels_completed") || 0;
				target = conditions.count;
				break;
			case "code_lines":
				current = this.progress.get("code_lines_written") || 0;
				target = conditions.count;
				break;
			case "bugs_fixed":
				current = this.progress.get("bugs_fixed") || 0;
				target = conditions.count;
				break;
			case "daily_streak":
				current = this.milestones.get("daily_streak") || 0;
				target = conditions.days;
				break;
			// Add more cases as needed
		}

		return {
			current,
			target,
			percentage: Math.min(100, Math.round((current / target) * 100)),
		};
	}

	getTotalPoints() {
		return Array.from(this.unlockedAchievements).reduce((total, id) => {
			return total + (this.achievements[id]?.points || 0);
		}, 0);
	}

	getProgressSummary() {
		const total = Object.keys(this.achievements).length;
		const unlocked = this.unlockedAchievements.size;
		const percentage = Math.round((unlocked / total) * 100);

		return {
			total,
			unlocked,
			percentage,
			points: this.getTotalPoints(),
			streak: this.milestones.get("daily_streak") || 0,
			playTime: this.milestones.get("total_play_time") || 0,
		};
	}

	getNotifications() {
		return [...this.notifications];
	}

	clearNotifications() {
		this.notifications = [];
	}

	resetProgress() {
		this.unlockedAchievements.clear();
		this.progress.clear();
		this.milestones.clear();
		this.notifications = [];
		this.saveAchievements();

		trackMobileEvent("achievements_reset");
	}

	exportProgress() {
		const data = {
			unlocked: Array.from(this.unlockedAchievements),
			progress: Array.from(this.progress.entries()),
			milestones: Array.from(this.milestones.entries()),
			exported: Date.now(),
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `achievements_${new Date().toISOString().split("T")[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);

		trackMobileEvent("achievements_exported");
	}

	importProgress(data) {
		try {
			this.unlockedAchievements = new Set(data.unlocked || []);
			this.progress = new Map(data.progress || []);
			this.milestones = new Map(data.milestones || []);
			this.saveAchievements();

			trackMobileEvent("achievements_imported");
			return true;
		} catch (error) {
			console.error("Failed to import achievements:", error);
			return false;
		}
	}
}

// Create singleton instance
const achievementManager = new AchievementManager();

export default achievementManager;
