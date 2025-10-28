import React, { PureComponent } from "react";
import classNames from "classnames";
import _ from "lodash";
import locales from "../../locales";
import { bus } from "../../utils";
import styles from "./MobileChat.module.css";

export default class MobileChat extends PureComponent {
	static get id() {
		return "MobileChat";
	}

	state = {
		messages: [],
		responses: [],
		isTyping: false,
		currentSection: "main",
		history: [],
	};

	render() {
		const { messages, responses, isTyping } = this.state;

		return (
			<div className={styles.mobileChat}>
				<div className={styles.chatContainer}>
					<div className={styles.messages}>
						{messages.map((message, index) => (
							<div key={index} className={styles.message}>
								{message.isSystem ? (
									<div className={styles.systemMessage}>{message.content}</div>
								) : (
									<div className={styles.chatMessage}>
										<div className={styles.avatar}>🤖</div>
										<div className={styles.content}>
											{message.content.split("\n").map((line, lineIndex) => (
												<p key={lineIndex}>{line}</p>
											))}
										</div>
									</div>
								)}
							</div>
						))}

						{isTyping && (
							<div className={styles.typingIndicator}>
								<div className={styles.avatar}>🤖</div>
								<div className={styles.typingDots}>
									<span></span>
									<span></span>
									<span></span>
								</div>
							</div>
						)}
					</div>

					{responses.length > 0 && (
						<div className={styles.responses}>
							<div className={styles.responsePrompt}>
								{locales.get("choose_an_answer")}
							</div>
							<div className={styles.responseButtons}>
								{responses.map((response) => (
									<button
										key={response.number}
										className={styles.responseButton}
										onClick={() => this.handleResponse(response)}
									>
										{response.content}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	async initialize(args, level) {
		this._level = level;
		this._chatScript = level.chatScript;

		// Reset chat memory to initial state
		level.setMemory(({ chat }) => {
			chat.sectionName = "main";
			chat.history = [];
		});

		await this.loadSection("main");
	}

	async loadSection(sectionName) {
		this.setState({ isTyping: true, responses: [] });

		// Simulate typing delay for realism
		await new Promise((resolve) => setTimeout(resolve, 800));

		const messages = this._chatScript.getMessagesOf(
			sectionName,
			this.state.history
		);
		const responses = this._chatScript.getResponsesOf(
			sectionName,
			this.state.history
		);

		this.setState({
			currentSection: sectionName,
			messages: messages.map((content) => ({ content, isSystem: false })),
			responses,
			isTyping: false,
		});

		// Run startup code if exists
		const startupCode = this._chatScript.getStartUpCodeOf(sectionName);
		if (startupCode) {
			try {
				eval(startupCode);
			} catch (e) {
				console.error("Chat startup code error:", e);
			}
		}
	}

	async handleResponse(response) {
		const { currentSection, history } = this.state;

		// Add to history
		const newHistory = [...history, currentSection];

		// Show selection feedback
		this.setState({ isTyping: true });

		// Simulate processing
		await new Promise((resolve) => setTimeout(resolve, 500));

		if (response.link === "end") {
			// End chat
			this.setState({ messages: [], responses: [], isTyping: false });
			bus.emit("chat-ended");
			return;
		}

		// Load next section
		this.setState({ history: newHistory });
		await this.loadSection(response.link);
	}

	focus() {
		// Mobile chat doesn't need focus management
	}
}
