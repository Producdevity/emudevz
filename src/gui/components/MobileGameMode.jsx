import React, { PureComponent } from "react";
import { connect } from "react-redux";
import classNames from "classnames";
import { bus } from "../../utils";
import { isMobile, isTouchDevice } from "../../utils/mobile";
import { trackMobileEvent } from "../../utils/mobileAnalytics";
import styles from "./MobileGameMode.module.css";

class MobileGameMode extends PureComponent {
	state = {
		isActive: false,
		currentMode: null,
		score: 0,
		timeLeft: 0,
		challenges: [],
		currentChallenge: null,
		isPaused: false,
		difficulty: "medium",
		leaderboard: [],
		achievements: [],
	};

	modes = {
		speedRun: {
			name: "Speed Run",
			description: "Complete levels as fast as possible",
			icon: "⚡",
			timeLimit: 300, // 5 minutes
			scoring: "time_based",
		},
		memoryMaster: {
			name: "Memory Master",
			description: "Complete levels without hints",
			icon: "🧠",
			timeLimit: 600, // 10 minutes
			scoring: "accuracy_based",
		},
		codeGolf: {
			name: "Code Golf",
			description: "Solve with minimal code",
			icon: "⛳",
			timeLimit: 900, // 15 minutes
			scoring: "size_based",
		},
		perfectRun: {
			name: "Perfect Run",
			description: "Complete without errors",
			icon: "💎",
			timeLimit: 450, // 7.5 minutes
			scoring: "perfection_based",
		},
	};

	challenges = {
		speedRun: [
			{ type: "complete_level", target: 3, points: 100 },
			{ type: "no_errors", target: 5, points: 150 },
			{ type: "quick_solve", target: 2, points: 200 },
		],
		memoryMaster: [
			{ type: "no_hints", target: 3, points: 100 },
			{ type: "complete_blind", target: 1, points: 300 },
			{ type: "recall_syntax", target: 5, points: 150 },
		],
		codeGolf: [
			{ type: "under_50_chars", target: 2, points: 100 },
			{ type: "one_liner", target: 1, points: 200 },
			{ type: "minimal_variables", target: 3, points: 150 },
		],
		perfectRun: [
			{ type: "no_mistakes", target: 3, points: 100 },
			{ type: "first_try", target: 2, points: 200 },
			{ type: "flawless_execution", target: 1, points: 300 },
		],
	};

	componentDidMount() {
		if (isMobile() && isTouchDevice()) {
			this.setupEventListeners();
			this.loadAchievements();
		}
	}

	componentWillUnmount() {
		this.cleanupEventListeners();
		if (this.timer) {
			clearInterval(this.timer);
		}
	}

	setupEventListeners() {
		bus.subscribe({
			"mobile-game-mode-start": this.startGameMode.bind(this),
			"mobile-game-mode-stop": this.stopGameMode.bind(this),
			"level-completed": this.onLevelCompleted.bind(this),
			"code-executed": this.onCodeExecuted.bind(this),
			"error-occurred": this.onErrorOccurred.bind(this),
		});
	}

	cleanupEventListeners() {
		bus.removeAllListeners("mobile-game-mode-start");
		bus.removeAllListeners("mobile-game-mode-stop");
		bus.removeAllListeners("level-completed");
		bus.removeAllListeners("code-executed");
		bus.removeAllListeners("error-occurred");
	}

	startGameMode(modeName) {
		const mode = this.modes[modeName];
		if (!mode) return;

		this.setState({
			isActive: true,
			currentMode: modeName,
			score: 0,
			timeLeft: mode.timeLimit,
			challenges: this.challenges[modeName] || [],
			currentChallenge: null,
			isPaused: false,
		});

		// Start timer
		this.timer = setInterval(() => {
			if (!this.state.isPaused) {
				this.updateTimer();
			}
		}, 1000);

		// Select first challenge
		this.selectNextChallenge();

		// Track analytics
		trackMobileEvent("mobile_game_mode_started", {
			mode: modeName,
			difficulty: this.state.difficulty,
		});

		// Haptic feedback
		this.triggerHapticFeedback("game_start");
	}

	stopGameMode() {
		if (this.timer) {
			clearInterval(this.timer);
		}

		const { score, currentMode } = this.state;

		// Save to leaderboard
		this.saveToLeaderboard(currentMode, score);

		// Check for new achievements
		this.checkAchievements();

		// Track analytics
		trackMobileEvent("mobile_game_mode_completed", {
			mode: currentMode,
			score,
			timeCompleted: this.modes[currentMode]?.timeLimit - this.state.timeLeft,
		});

		// Haptic feedback
		this.triggerHapticFeedback("game_end");

		this.setState({
			isActive: false,
			currentMode: null,
			currentChallenge: null,
		});
	}

	updateTimer() {
		const { timeLeft } = this.state;

		if (timeLeft <= 0) {
			this.stopGameMode();
			bus.emit("mobile-game-mode-timeout");
		} else {
			this.setState({ timeLeft: timeLeft - 1 });

			// Warning haptic feedback at 10 seconds
			if (timeLeft === 10) {
				this.triggerHapticFeedback("warning");
			}
		}
	}

	selectNextChallenge() {
		const { challenges } = this.state;
		const availableChallenges = challenges.filter((c) => !c.completed);

		if (availableChallenges.length > 0) {
			const nextChallenge = availableChallenges[0];
			this.setState({ currentChallenge: nextChallenge });
		}
	}

	onLevelCompleted(data) {
		if (!this.state.isActive) return;

		const { currentChallenge, score } = this.state;

		if (currentChallenge && currentChallenge.type === "complete_level") {
			this.completeChallenge(currentChallenge);
		}

		// Bonus points for quick completion
		if (this.state.currentMode === "speedRun" && data.timeTaken < 60) {
			this.addScore(50);
		}
	}

	onCodeExecuted(data) {
		if (!this.state.isActive) return;

		const { currentMode, currentChallenge } = this.state;

		// Track code size for code golf mode
		if (currentMode === "codeGolf" && data.codeSize) {
			if (data.codeSize < 50 && currentChallenge?.type === "under_50_chars") {
				this.completeChallenge(currentChallenge);
			}
			if (data.codeSize < 100 && currentChallenge?.type === "one_liner") {
				this.completeChallenge(currentChallenge);
			}
		}
	}

	onErrorOccurred(error) {
		if (!this.state.isActive) return;

		const { currentMode, currentChallenge } = this.state;

		// Track errors for perfect run mode
		if (currentMode === "perfectRun") {
			this.triggerHapticFeedback("error");
			// Penalty for errors
			this.addScore(-10);
		}

		// Track mistakes for challenges
		if (currentChallenge?.type === "no_mistakes") {
			this.failChallenge(currentChallenge);
		}
	}

	completeChallenge(challenge) {
		this.addScore(challenge.points);

		// Mark challenge as completed
		const challenges = this.state.challenges.map((c) =>
			c === challenge ? { ...c, completed: true } : c
		);

		this.setState({ challenges });
		this.selectNextChallenge();

		// Haptic feedback
		this.triggerHapticFeedback("challenge_complete");

		// Track analytics
		trackMobileEvent("challenge_completed", {
			type: challenge.type,
			points: challenge.points,
		});
	}

	failChallenge(challenge) {
		// Mark challenge as failed
		const challenges = this.state.challenges.map((c) =>
			c === challenge ? { ...c, failed: true } : c
		);

		this.setState({ challenges });
		this.selectNextChallenge();

		// Haptic feedback
		this.triggerHapticFeedback("challenge_failed");
	}

	addScore(points) {
		this.setState((prevState) => ({
			score: Math.max(0, prevState.score + points),
		}));
	}

	saveToLeaderboard(mode, score) {
		const leaderboard = JSON.parse(
			localStorage.getItem(`leaderboard_${mode}`) || "[]"
		);
		leaderboard.push({
			score,
			date: new Date().toISOString(),
			difficulty: this.state.difficulty,
		});

		// Keep only top 10 scores
		leaderboard.sort((a, b) => b.score - a.score);
		leaderboard.splice(10);

		localStorage.setItem(`leaderboard_${mode}`, JSON.stringify(leaderboard));
		this.setState({ leaderboard });
	}

	loadAchievements() {
		const achievements = JSON.parse(
			localStorage.getItem("mobile_achievements") || "[]"
		);
		this.setState({ achievements });
	}

	checkAchievements() {
		const { score, currentMode } = this.state;
		const newAchievements = [];

		// Check for various achievements
		if (score >= 1000) {
			newAchievements.push({
				id: "high_scorer",
				name: "High Scorer",
				description: "Score over 1000 points in a game mode",
				icon: "🏆",
				unlockedAt: new Date().toISOString(),
			});
		}

		if (currentMode === "speedRun" && score >= 500) {
			newAchievements.push({
				id: "speed_demon",
				name: "Speed Demon",
				description: "Score 500+ points in Speed Run mode",
				icon: "⚡",
				unlockedAt: new Date().toISOString(),
			});
		}

		// Save new achievements
		if (newAchievements.length > 0) {
			const allAchievements = [...this.state.achievements, ...newAchievements];
			this.setState({ achievements: allAchievements });
			localStorage.setItem(
				"mobile_achievements",
				JSON.stringify(allAchievements)
			);

			// Show achievement notification
			newAchievements.forEach((achievement) => {
				bus.emit("achievement-unlocked", achievement);
			});
		}
	}

	triggerHapticFeedback(type) {
		if (!window.navigator || !window.navigator.vibrate) return;

		const patterns = {
			game_start: [50, 30, 50],
			game_end: [100],
			challenge_complete: [30, 20, 30],
			challenge_failed: [50],
			error: [20],
			warning: [10, 10, 10],
		};

		const pattern = patterns[type] || [10];
		window.navigator.vibrate(pattern);
	}

	render() {
		if (!isMobile() || !isTouchDevice()) return null;

		const {
			isActive,
			currentMode,
			score,
			timeLeft,
			currentChallenge,
			isPaused,
		} = this.state;

		if (!isActive) return null;

		const mode = this.modes[currentMode];
		const timeMinutes = Math.floor(timeLeft / 60);
		const timeSeconds = timeLeft % 60;

		return (
			<div className={styles.mobileGameMode}>
				<div className={styles.header}>
					<div className={styles.modeInfo}>
						<span className={styles.modeIcon}>{mode?.icon}</span>
						<span className={styles.modeName}>{mode?.name}</span>
					</div>

					<div className={styles.stats}>
						<div className={styles.score}>
							<span className={styles.label}>Score:</span>
							<span className={styles.value}>{score}</span>
						</div>

						<div
							className={classNames(
								styles.timer,
								timeLeft <= 10 && styles.warning
							)}
						>
							<span className={styles.label}>Time:</span>
							<span className={styles.value}>
								{timeMinutes}:{timeSeconds.toString().padStart(2, "0")}
							</span>
						</div>
					</div>

					<button
						className={styles.pauseButton}
						onClick={() => this.setState({ isPaused: !isPaused })}
					>
						{isPaused ? "▶️" : "⏸️"}
					</button>
				</div>

				{currentChallenge && !isPaused && (
					<div className={styles.currentChallenge}>
						<div className={styles.challengeIcon}>🎯</div>
						<div className={styles.challengeText}>
							<div className={styles.challengeTitle}>
								{this.getChallengeTitle(currentChallenge.type)}
							</div>
							<div className={styles.challengeProgress}>
								Progress: {this.getChallengeProgress(currentChallenge)}
							</div>
						</div>
						<div className={styles.challengePoints}>
							+{currentChallenge.points} pts
						</div>
					</div>
				)}

				{isPaused && (
					<div className={styles.pauseOverlay}>
						<div className={styles.pauseContent}>
							<h2>Game Paused</h2>
							<button
								className={styles.resumeButton}
								onClick={() => this.setState({ isPaused: false })}
							>
								Resume
							</button>
							<button
								className={styles.quitButton}
								onClick={() => this.stopGameMode()}
							>
								Quit Game
							</button>
						</div>
					</div>
				)}
			</div>
		);
	}

	getChallengeTitle(type) {
		const titles = {
			complete_level: "Complete Levels",
			no_errors: "No Errors Allowed",
			quick_solve: "Quick Solutions",
			no_hints: "No Hints",
			complete_blind: "Complete Blind",
			recall_syntax: "Recall Syntax",
			under_50_chars: "Under 50 Characters",
			one_liner: "One Liner",
			minimal_variables: "Minimal Variables",
			no_mistakes: "No Mistakes",
			first_try: "First Try Success",
			flawless_execution: "Flawless Execution",
		};
		return titles[type] || "Challenge";
	}

	getChallengeProgress(challenge) {
		// This would be calculated based on actual game state
		// For now, return a placeholder
		return `0 / ${challenge.target}`;
	}
}

const mapStateToProps = (state) => ({
	level: state.level.instance,
	book: state.book.instance,
});

export default connect(mapStateToProps)(MobileGameMode);
