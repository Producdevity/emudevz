import { isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class VoiceControlManager {
	constructor() {
		this.isSupported = this.checkSupport();
		this.isListening = false;
		this.recognition = null;
		this.synthesis = window.speechSynthesis;
		this.commands = this.defineCommands();
		this.commandHistory = [];
		this.maxHistorySize = 50;
		this.confidenceThreshold = 0.7;
		this.language = "en-US";

		if (this.isSupported) {
			this.init();
		}
	}

	checkSupport() {
		return (
			"SpeechRecognition" in window ||
			"webkitSpeechRecognition" in window ||
			"SpeechSynthesis" in window
		);
	}

	defineCommands() {
		return {
			// Navigation commands
			"go home": {
				action: "navigate",
				target: "home",
				description: "Navigate to home screen",
			},
			"go to levels": {
				action: "navigate",
				target: "levels",
				description: "Navigate to levels screen",
			},
			"go back": {
				action: "navigate",
				target: "back",
				description: "Go back to previous screen",
			},
			"open menu": {
				action: "navigate",
				target: "menu",
				description: "Open main menu",
			},

			// Game control commands
			"start game": {
				action: "game",
				target: "start",
				description: "Start the current level",
			},
			"pause game": {
				action: "game",
				target: "pause",
				description: "Pause the game",
			},
			"resume game": {
				action: "game",
				target: "resume",
				description: "Resume the game",
			},
			"restart level": {
				action: "game",
				target: "restart",
				description: "Restart current level",
			},
			"run code": {
				action: "game",
				target: "run",
				description: "Execute the current code",
			},
			"stop code": {
				action: "game",
				target: "stop",
				description: "Stop code execution",
			},

			// Editor commands
			"open editor": {
				action: "editor",
				target: "open",
				description: "Open code editor",
			},
			"close editor": {
				action: "editor",
				target: "close",
				description: "Close code editor",
			},
			"save code": {
				action: "editor",
				target: "save",
				description: "Save current code",
			},
			"clear code": {
				action: "editor",
				target: "clear",
				description: "Clear the editor",
			},
			undo: {
				action: "editor",
				target: "undo",
				description: "Undo last action",
			},
			redo: {
				action: "editor",
				target: "redo",
				description: "Redo last action",
			},

			// Accessibility commands
			"increase font size": {
				action: "accessibility",
				target: "font_increase",
				description: "Increase font size",
			},
			"decrease font size": {
				action: "accessibility",
				target: "font_decrease",
				description: "Decrease font size",
			},
			"toggle high contrast": {
				action: "accessibility",
				target: "high_contrast",
				description: "Toggle high contrast mode",
			},
			"read screen": {
				action: "accessibility",
				target: "read_screen",
				description: "Read current screen content",
			},
			"voice help": {
				action: "accessibility",
				target: "help",
				description: "Get help with voice commands",
			},

			// Mobile-specific commands
			"switch tab": {
				action: "mobile",
				target: "switch_tab",
				description: "Switch to next tab",
			},
			"open chat": {
				action: "mobile",
				target: "open_chat",
				description: "Open chat interface",
			},
			"toggle keyboard": {
				action: "mobile",
				target: "toggle_keyboard",
				description: "Toggle virtual keyboard",
			},

			// System commands
			"voice control on": {
				action: "system",
				target: "enable",
				description: "Enable voice control",
			},
			"voice control off": {
				action: "system",
				target: "disable",
				description: "Disable voice control",
			},
			"what can i say": {
				action: "system",
				target: "list_commands",
				description: "List available voice commands",
			},
		};
	}

	init() {
		this.setupSpeechRecognition();
		this.setupSpeechSynthesis();
		this.setupEventListeners();
		this.loadSettings();
	}

	setupSpeechRecognition() {
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (SpeechRecognition) {
			this.recognition = new SpeechRecognition();
			this.recognition.continuous = true;
			this.recognition.interimResults = true;
			this.recognition.lang = this.language;
			this.recognition.maxAlternatives = 3;

			this.recognition.onstart = () => {
				this.isListening = true;
				this.updateListeningIndicator(true);
				trackMobileEvent("voice_control_started");
			};

			this.recognition.onend = () => {
				this.isListening = false;
				this.updateListeningIndicator(false);

				// Restart if not manually stopped
				if (this.autoRestart) {
					setTimeout(() => {
						if (this.isEnabled) {
							this.startListening();
						}
					}, 1000);
				}
			};

			this.recognition.onresult = (event) => {
				this.handleSpeechResult(event);
			};

			this.recognition.onerror = (event) => {
				console.error("Speech recognition error:", event.error);
				this.handleRecognitionError(event.error);
			};
		}
	}

	setupSpeechSynthesis() {
		if (this.synthesis) {
			// Get available voices
			this.updateVoices();

			// Listen for voice changes
			this.synthesis.onvoiceschanged = () => {
				this.updateVoices();
			};
		}
	}

	updateVoices() {
		this.voices = this.synthesis.getVoices();
		this.preferredVoice =
			this.voices.find(
				(voice) => voice.lang === this.language && voice.localService
			) || this.voices[0];
	}

	setupEventListeners() {
		// Listen for voice control toggle events
		window.addEventListener("voice_control_toggle", (event) => {
			const { enabled } = event.detail;
			if (enabled) {
				this.enable();
			} else {
				this.disable();
			}
		});

		// Listen for custom command registration
		window.addEventListener("register_voice_command", (event) => {
			const { command, config } = event.detail;
			this.registerCommand(command, config);
		});
	}

	loadSettings() {
		try {
			const settings = JSON.parse(
				localStorage.getItem("voiceControlSettings") || "{}"
			);
			this.isEnabled = settings.enabled !== false;
			this.autoRestart = settings.autoRestart !== false;
			this.confidenceThreshold = settings.confidenceThreshold || 0.7;
			this.language = settings.language || "en-US";

			if (this.isEnabled) {
				this.enable();
			}
		} catch (error) {
			console.error("Failed to load voice control settings:", error);
		}
	}

	saveSettings() {
		try {
			const settings = {
				enabled: this.isEnabled,
				autoRestart: this.autoRestart,
				confidenceThreshold: this.confidenceThreshold,
				language: this.language,
			};
			localStorage.setItem("voiceControlSettings", JSON.stringify(settings));
		} catch (error) {
			console.error("Failed to save voice control settings:", error);
		}
	}

	enable() {
		if (!this.isSupported) {
			this.speak("Voice control is not supported on this device");
			return false;
		}

		this.isEnabled = true;
		this.startListening();
		this.saveSettings();

		this.speak("Voice control enabled");
		trackMobileEvent("voice_control_enabled");

		return true;
	}

	disable() {
		this.isEnabled = false;
		this.autoRestart = false;
		this.stopListening();
		this.saveSettings();

		this.speak("Voice control disabled");
		trackMobileEvent("voice_control_disabled");

		return true;
	}

	startListening() {
		if (!this.recognition || this.isListening) return;

		try {
			this.recognition.start();
		} catch (error) {
			console.error("Failed to start speech recognition:", error);
		}
	}

	stopListening() {
		if (!this.recognition || !this.isListening) return;

		this.recognition.stop();
	}

	handleSpeechResult(event) {
		const last = event.results.length - 1;
		const result = event.results[last];

		if (result.isFinal) {
			const transcript = result[0].transcript.toLowerCase().trim();
			const confidence = result[0].confidence;

			// Check alternatives if confidence is low
			let bestMatch = transcript;
			let bestConfidence = confidence;

			if (confidence < this.confidenceThreshold && result.length > 1) {
				for (let i = 1; i < result.length; i++) {
					if (result[i].confidence > bestConfidence) {
						bestMatch = result[i].transcript.toLowerCase().trim();
						bestConfidence = result[i].confidence;
					}
				}
			}

			// Process command if confidence is sufficient
			if (bestConfidence >= this.confidenceThreshold) {
				this.processCommand(bestMatch, bestConfidence);
			}

			// Add to history
			this.addToHistory(bestMatch, bestConfidence);
		}
	}

	processCommand(transcript, confidence) {
		// Find matching command
		let matchedCommand = null;
		let bestMatch = null;
		let bestScore = 0;

		for (const [phrase, command] of Object.entries(this.commands)) {
			const score = this.calculateMatchScore(transcript, phrase);
			if (score > bestScore && score >= 0.8) {
				bestScore = score;
				bestMatch = phrase;
				matchedCommand = command;
			}
		}

		if (matchedCommand) {
			this.executeCommand(matchedCommand, bestMatch, confidence);
		} else {
			// Try fuzzy matching
			const fuzzyMatch = this.findFuzzyMatch(transcript);
			if (fuzzyMatch) {
				this.executeCommand(fuzzyMatch.command, fuzzyMatch.phrase, confidence);
			} else {
				this.speak("Command not recognized");
			}
		}
	}

	calculateMatchScore(transcript, command) {
		// Simple string similarity calculation
		const words1 = transcript.split(" ");
		const words2 = command.split(" ");

		let matches = 0;
		for (const word1 of words1) {
			for (const word2 of words2) {
				if (word1.includes(word2) || word2.includes(word1)) {
					matches++;
					break;
				}
			}
		}

		return matches / Math.max(words1.length, words2.length);
	}

	findFuzzyMatch(transcript) {
		// Implement fuzzy matching for voice commands
		const threshold = 0.6;
		let bestMatch = null;
		let bestScore = 0;

		for (const [phrase, command] of Object.entries(this.commands)) {
			const score = this.calculateMatchScore(transcript, phrase);
			if (score > bestScore && score >= threshold) {
				bestScore = score;
				bestMatch = { phrase, command, score };
			}
		}

		return bestMatch;
	}

	executeCommand(command, phrase, confidence) {
		console.log(
			`Executing command: ${phrase} (${command.action}:${command.target})`
		);

		// Track command execution
		trackMobileEvent("voice_command_executed", {
			phrase,
			action: command.action,
			target: command.target,
			confidence,
		});

		// Execute based on action type
		switch (command.action) {
			case "navigate":
				this.executeNavigationCommand(command.target);
				break;
			case "game":
				this.executeGameCommand(command.target);
				break;
			case "editor":
				this.executeEditorCommand(command.target);
				break;
			case "accessibility":
				this.executeAccessibilityCommand(command.target);
				break;
			case "mobile":
				this.executeMobileCommand(command.target);
				break;
			case "system":
				this.executeSystemCommand(command.target);
				break;
		}

		// Provide feedback
		this.speak(`Executing: ${command.description}`);
	}

	executeNavigationCommand(target) {
		switch (target) {
			case "home":
				window.location.hash = "#/";
				break;
			case "levels":
				window.location.hash = "#/levels";
				break;
			case "back":
				window.history.back();
				break;
			case "menu":
				window.dispatchEvent(new CustomEvent("open_menu"));
				break;
		}
	}

	executeGameCommand(target) {
		switch (target) {
			case "start":
				window.dispatchEvent(new CustomEvent("game_start"));
				break;
			case "pause":
				window.dispatchEvent(new CustomEvent("game_pause"));
				break;
			case "resume":
				window.dispatchEvent(new CustomEvent("game_resume"));
				break;
			case "restart":
				window.dispatchEvent(new CustomEvent("game_restart"));
				break;
			case "run":
				window.dispatchEvent(new CustomEvent("code_run"));
				break;
			case "stop":
				window.dispatchEvent(new CustomEvent("code_stop"));
				break;
		}
	}

	executeEditorCommand(target) {
		switch (target) {
			case "open":
				window.dispatchEvent(new CustomEvent("editor_open"));
				break;
			case "close":
				window.dispatchEvent(new CustomEvent("editor_close"));
				break;
			case "save":
				window.dispatchEvent(new CustomEvent("editor_save"));
				break;
			case "clear":
				window.dispatchEvent(new CustomEvent("editor_clear"));
				break;
			case "undo":
				window.dispatchEvent(new CustomEvent("editor_undo"));
				break;
			case "redo":
				window.dispatchEvent(new CustomEvent("editor_redo"));
				break;
		}
	}

	executeAccessibilityCommand(target) {
		switch (target) {
			case "font_increase":
				this.adjustFontSize(1);
				break;
			case "font_decrease":
				this.adjustFontSize(-1);
				break;
			case "high_contrast":
				this.toggleHighContrast();
				break;
			case "read_screen":
				this.readScreen();
				break;
			case "help":
				this.listCommands();
				break;
		}
	}

	executeMobileCommand(target) {
		switch (target) {
			case "switch_tab":
				window.dispatchEvent(new CustomEvent("mobile_switch_tab"));
				break;
			case "open_chat":
				window.dispatchEvent(new CustomEvent("mobile_open_chat"));
				break;
			case "toggle_keyboard":
				window.dispatchEvent(new CustomEvent("mobile_toggle_keyboard"));
				break;
		}
	}

	executeSystemCommand(target) {
		switch (target) {
			case "enable":
				this.enable();
				break;
			case "disable":
				this.disable();
				break;
			case "list_commands":
				this.listCommands();
				break;
		}
	}

	adjustFontSize(delta) {
		const root = document.documentElement;
		const currentSize = parseFloat(getComputedStyle(root).fontSize);
		const newSize = Math.max(12, Math.min(24, currentSize + delta));
		root.style.fontSize = newSize + "px";

		this.speak(`Font size ${delta > 0 ? "increased" : "decreased"}`);
	}

	toggleHighContrast() {
		document.body.classList.toggle("high-contrast");
		const isEnabled = document.body.classList.contains("high-contrast");
		this.speak(`High contrast ${isEnabled ? "enabled" : "disabled"}`);
	}

	readScreen() {
		const content = this.getScreenContent();
		if (content) {
			this.speak(content);
		} else {
			this.speak("No content to read");
		}
	}

	getScreenContent() {
		// Get readable content from current screen
		const headings = Array.from(
			document.querySelectorAll("h1, h2, h3, h4, h5, h6")
		)
			.map((h) => h.textContent)
			.join(". ");

		const paragraphs = Array.from(document.querySelectorAll("p"))
			.map((p) => p.textContent)
			.join(". ");

		const buttons = Array.from(document.querySelectorAll("button"))
			.map((b) => b.textContent)
			.filter((text) => text.length > 0)
			.join(", ");

		let content = "";
		if (headings) content += headings + ". ";
		if (paragraphs) content += paragraphs + ". ";
		if (buttons) content += "Buttons: " + buttons + ". ";

		return content.trim();
	}

	listCommands() {
		const commandList = Object.entries(this.commands)
			.map(([phrase, command]) => `${phrase}: ${command.description}`)
			.join(". ");

		this.speak(`Available commands: ${commandList}`);
	}

	speak(text) {
		if (!this.synthesis) return;

		// Cancel any ongoing speech
		this.synthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = this.language;
		utterance.rate = 1.0;
		utterance.pitch = 1.0;
		utterance.volume = 1.0;

		if (this.preferredVoice) {
			utterance.voice = this.preferredVoice;
		}

		utterance.onstart = () => {
			this.updateSpeakingIndicator(true);
		};

		utterance.onend = () => {
			this.updateSpeakingIndicator(false);
		};

		this.synthesis.speak(utterance);
	}

	updateListeningIndicator(listening) {
		let indicator = document.getElementById("voice-listening-indicator");

		if (listening) {
			if (!indicator) {
				indicator = document.createElement("div");
				indicator.id = "voice-listening-indicator";
				indicator.style.cssText = `
					position: fixed;
					top: 20px;
					left: 20px;
					background: #4caf50;
					color: white;
					padding: 10px 15px;
					border-radius: 20px;
					z-index: 10000;
					display: flex;
					align-items: center;
					gap: 8px;
					animation: pulse 1.5s infinite;
				`;

				indicator.innerHTML = `
					<span style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: blink 1s infinite;"></span>
					<span>Listening...</span>
				`;

				document.body.appendChild(indicator);
			}
		} else {
			if (indicator) {
				document.body.removeChild(indicator);
			}
		}
	}

	updateSpeakingIndicator(speaking) {
		let indicator = document.getElementById("voice-speaking-indicator");

		if (speaking) {
			if (!indicator) {
				indicator = document.createElement("div");
				indicator.id = "voice-speaking-indicator";
				indicator.style.cssText = `
					position: fixed;
					top: 20px;
					right: 20px;
					background: #2196f3;
					color: white;
					padding: 10px 15px;
					border-radius: 20px;
					z-index: 10000;
					display: flex;
					align-items: center;
					gap: 8px;
				`;

				indicator.innerHTML = `
					<span style="width: 8px; height: 8px; background: white; border-radius: 50%;"></span>
					<span>Speaking...</span>
				`;

				document.body.appendChild(indicator);
			}
		} else {
			if (indicator) {
				document.body.removeChild(indicator);
			}
		}
	}

	handleRecognitionError(error) {
		let message = "Speech recognition error";

		switch (error) {
			case "no-speech":
				message = "No speech detected";
				break;
			case "audio-capture":
				message = "Microphone not available";
				break;
			case "not-allowed":
				message = "Microphone permission denied";
				break;
			case "network":
				message = "Network error";
				break;
		}

		this.speak(message);
		trackMobileEvent("voice_control_error", { error });
	}

	addToHistory(transcript, confidence) {
		this.commandHistory.push({
			transcript,
			confidence,
			timestamp: Date.now(),
		});

		// Limit history size
		if (this.commandHistory.length > this.maxHistorySize) {
			this.commandHistory.shift();
		}
	}

	// Public API
	registerCommand(phrase, config) {
		this.commands[phrase.toLowerCase()] = config;
		trackMobileEvent("voice_command_registered", { phrase });
	}

	unregisterCommand(phrase) {
		delete this.commands[phrase.toLowerCase()];
		trackMobileEvent("voice_command_unregistered", { phrase });
	}

	getCommandHistory() {
		return [...this.commandHistory];
	}

	getAvailableCommands() {
		return Object.entries(this.commands).map(([phrase, command]) => ({
			phrase,
			...command,
		}));
	}

	setLanguage(language) {
		this.language = language;
		if (this.recognition) {
			this.recognition.lang = language;
		}
		this.updateVoices();
		this.saveSettings();
	}

	setConfidenceThreshold(threshold) {
		this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
		this.saveSettings();
	}

	isEnabled() {
		return this.isEnabled;
	}

	isCurrentlyListening() {
		return this.isListening;
	}
}

// Create singleton instance
const voiceControlManager = new VoiceControlManager();

export default voiceControlManager;
