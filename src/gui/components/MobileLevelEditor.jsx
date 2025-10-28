import React, { PureComponent } from "react";
import { connect } from "react-redux";
import classNames from "classnames";
import { bus } from "../../utils";
import { isMobile, isTouchDevice } from "../../utils/mobile";
import { trackMobileEvent } from "../../utils/mobileAnalytics";
import styles from "./MobileLevelEditor.module.css";

class MobileLevelEditor extends PureComponent {
	state = {
		isOpen: false,
		editorMode: "visual", // visual, code, preview
		currentTool: "select",
		zoom: 1,
		pan: { x: 0, y: 0 },
		gridSize: 16,
		snapToGrid: true,
		showGrid: true,
		elements: [],
		selectedElement: null,
		history: [],
		historyIndex: -1,
		isPlaying: false,
		unsavedChanges: false,
		toolPalette: {
			select: { icon: "👆", name: "Select" },
			rectangle: { icon: "⬜", name: "Rectangle" },
			circle: { icon: "⭕", name: "Circle" },
			text: { icon: "📝", name: "Text" },
			sprite: { icon: "🎮", name: "Sprite" },
			eraser: { icon: "🧹", name: "Eraser" },
		},
		properties: {
			x: 0,
			y: 0,
			width: 32,
			height: 32,
			color: "#ffffff",
			text: "",
			spriteId: "",
		},
	};

	componentDidMount() {
		if (isMobile() && isTouchDevice()) {
			this.setupEventListeners();
			this.setupTouchGestures();
		}
	}

	componentWillUnmount() {
		this.cleanupEventListeners();
	}

	setupEventListeners() {
		bus.subscribe({
			"mobile-level-editor-open": this.openEditor.bind(this),
			"mobile-level-editor-close": this.closeEditor.bind(this),
			"level-data-loaded": this.onLevelDataLoaded.bind(this),
		});
	}

	cleanupEventListeners() {
		bus.removeAllListeners("mobile-level-editor-open");
		bus.removeAllListeners("mobile-level-editor-close");
		bus.removeAllListeners("level-data-loaded");
	}

	setupTouchGestures() {
		let lastTouchTime = 0;
		let touchStartDistance = 0;
		let initialZoom = 1;

		const handleTouchStart = (e) => {
			const now = Date.now();

			if (e.touches.length === 1) {
				// Single touch - track for double tap
				if (now - lastTouchTime < 300) {
					this.handleDoubleTap(e.touches[0]);
				}
				lastTouchTime = now;
			} else if (e.touches.length === 2) {
				// Two finger touch - prepare for pinch zoom
				const dx = e.touches[0].clientX - e.touches[1].clientX;
				const dy = e.touches[0].clientY - e.touches[1].clientY;
				touchStartDistance = Math.sqrt(dx * dx + dy * dy);
				initialZoom = this.state.zoom;
			}
		};

		const handleTouchMove = (e) => {
			if (e.touches.length === 2) {
				// Pinch zoom
				e.preventDefault();

				const dx = e.touches[0].clientX - e.touches[1].clientX;
				const dy = e.touches[0].clientY - e.touches[1].clientY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				const scale = distance / touchStartDistance;
				const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale));

				this.setState({ zoom: newZoom });
			}
		};

		const canvas = this.getCanvasElement();
		if (canvas) {
			canvas.addEventListener("touchstart", handleTouchStart, {
				passive: false,
			});
			canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
		}
	}

	handleDoubleTap(touch) {
		// Double tap to zoom in/out
		const newZoom = this.state.zoom === 1 ? 2 : 1;
		this.setState({ zoom: newZoom });

		// Haptic feedback
		if (window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate(10);
		}
	}

	openEditor(levelData = null) {
		this.setState({
			isOpen: true,
			elements: levelData?.elements || [],
			unsavedChanges: false,
		});

		trackMobileEvent("mobile_level_editor_opened");
	}

	closeEditor() {
		if (this.state.unsavedChanges) {
			if (
				confirm("You have unsaved changes. Are you sure you want to close?")
			) {
				this.setState({ isOpen: false });
			}
		} else {
			this.setState({ isOpen: false });
		}

		trackMobileEvent("mobile_level_editor_closed");
	}

	onLevelDataLoaded(data) {
		if (this.state.isOpen) {
			this.setState({
				elements: data.elements || [],
				unsavedChanges: false,
			});
		}
	}

	selectTool(toolName) {
		this.setState({ currentTool: toolName });

		// Haptic feedback
		if (window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate(5);
		}
	}

	setEditorMode(mode) {
		this.setState({ editorMode: mode });

		// Haptic feedback
		if (window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate(8);
		}
	}

	handleCanvasTouch(e) {
		if (!this.state.isOpen) return;

		const touch = e.touches[0];
		const rect = e.target.getBoundingClientRect();
		const x = (touch.clientX - rect.left - this.state.pan.x) / this.state.zoom;
		const y = (touch.clientY - rect.top - this.state.pan.y) / this.state.zoom;

		// Snap to grid if enabled
		const snappedX = this.state.snapToGrid
			? Math.round(x / this.state.gridSize) * this.state.gridSize
			: x;
		const snappedY = this.state.snapToGrid
			? Math.round(y / this.state.gridSize) * this.state.gridSize
			: y;

		switch (this.state.currentTool) {
			case "select":
				this.selectElementAt(snappedX, snappedY);
				break;
			case "rectangle":
				this.addElement("rectangle", snappedX, snappedY);
				break;
			case "circle":
				this.addElement("circle", snappedX, snappedY);
				break;
			case "text":
				this.addTextElement(snappedX, snappedY);
				break;
			case "sprite":
				this.addSpriteElement(snappedX, snappedY);
				break;
			case "eraser":
				this.eraseElementAt(snappedX, snappedY);
				break;
		}
	}

	addElement(type, x, y) {
		const newElement = {
			id: Date.now(),
			type,
			x,
			y,
			width: this.state.properties.width,
			height: this.state.properties.height,
			color: this.state.properties.color,
		};

		const newElements = [...this.state.elements, newElement];
		this.setState({
			elements: newElements,
			selectedElement: newElement,
			unsavedChanges: true,
		});

		this.addToHistory("add", newElement);

		// Haptic feedback
		if (window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate(15);
		}
	}

	addTextElement(x, y) {
		const text = prompt("Enter text:");
		if (!text) return;

		const newElement = {
			id: Date.now(),
			type: "text",
			x,
			y,
			text,
			fontSize: 16,
			color: this.state.properties.color,
		};

		const newElements = [...this.state.elements, newElement];
		this.setState({
			elements: newElements,
			selectedElement: newElement,
			unsavedChanges: true,
		});

		this.addToHistory("add", newElement);
	}

	addSpriteElement(x, y) {
		const spriteId = prompt("Enter sprite ID:");
		if (!spriteId) return;

		const newElement = {
			id: Date.now(),
			type: "sprite",
			x,
			y,
			spriteId,
			width: 32,
			height: 32,
		};

		const newElements = [...this.state.elements, newElement];
		this.setState({
			elements: newElements,
			selectedElement: newElement,
			unsavedChanges: true,
		});

		this.addToHistory("add", newElement);
	}

	selectElementAt(x, y) {
		const element = this.state.elements.find(
			(el) =>
				x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
		);

		this.setState({ selectedElement: element });

		// Haptic feedback
		if (window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate(element ? 10 : 5);
		}
	}

	eraseElementAt(x, y) {
		const elementIndex = this.state.elements.findIndex(
			(el) =>
				x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
		);

		if (elementIndex !== -1) {
			const newElements = [...this.state.elements];
			const removedElement = newElements.splice(elementIndex, 1)[0];

			this.setState({
				elements: newElements,
				selectedElement: null,
				unsavedChanges: true,
			});

			this.addToHistory("remove", removedElement);

			// Haptic feedback
			if (window.navigator && window.navigator.vibrate) {
				window.navigator.vibrate(20);
			}
		}
	}

	addToHistory(action, element) {
		const newHistory = this.state.history.slice(0, this.state.historyIndex + 1);
		newHistory.push({ action, element, timestamp: Date.now() });

		this.setState({
			history: newHistory,
			historyIndex: newHistory.length - 1,
		});
	}

	undo() {
		if (this.state.historyIndex >= 0) {
			const action = this.state.history[this.state.historyIndex];

			if (action.action === "add") {
				const newElements = this.state.elements.filter(
					(el) => el.id !== action.element.id
				);
				this.setState({
					elements: newElements,
					historyIndex: this.state.historyIndex - 1,
					unsavedChanges: true,
				});
			} else if (action.action === "remove") {
				const newElements = [...this.state.elements, action.element];
				this.setState({
					elements: newElements,
					historyIndex: this.state.historyIndex - 1,
					unsavedChanges: true,
				});
			}
		}
	}

	redo() {
		if (this.state.historyIndex < this.state.history.length - 1) {
			const action = this.state.history[this.state.historyIndex + 1];

			if (action.action === "add") {
				const newElements = [...this.state.elements, action.element];
				this.setState({
					elements: newElements,
					historyIndex: this.state.historyIndex + 1,
					unsavedChanges: true,
				});
			} else if (action.action === "remove") {
				const newElements = this.state.elements.filter(
					(el) => el.id !== action.element.id
				);
				this.setState({
					elements: newElements,
					historyIndex: this.state.historyIndex + 1,
					unsavedChanges: true,
				});
			}
		}
	}

	saveLevel() {
		const levelData = {
			elements: this.state.elements,
			metadata: {
				created: Date.now(),
				version: "1.0",
				gridSize: this.state.gridSize,
			},
		};

		// Emit save event
		bus.emit("mobile-level-editor-save", levelData);

		this.setState({ unsavedChanges: false });

		trackMobileEvent("mobile_level_saved", {
			elementCount: this.state.elements.length,
		});

		// Haptic feedback
		if (window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate([50, 30, 50]);
		}
	}

	playTest() {
		const levelData = {
			elements: this.state.elements,
		};

		bus.emit("mobile-level-editor-test", levelData);
		this.setState({ isPlaying: true });

		trackMobileEvent("mobile_level_test_started");
	}

	stopTest() {
		bus.emit("mobile-level-editor-stop-test");
		this.setState({ isPlaying: false });

		trackMobileEvent("mobile_level_test_stopped");
	}

	getCanvasElement() {
		return document.querySelector(`.${styles.canvas}`);
	}

	render() {
		if (!isMobile() || !isTouchDevice()) return null;

		const {
			isOpen,
			editorMode,
			currentTool,
			zoom,
			elements,
			selectedElement,
			isPlaying,
		} = this.state;

		if (!isOpen) return null;

		return (
			<div className={styles.mobileLevelEditor}>
				<div className={styles.header}>
					<button
						className={styles.backButton}
						onClick={() => this.closeEditor()}
					>
						← Back
					</button>

					<div className={styles.modeSelector}>
						<button
							className={classNames(
								styles.modeButton,
								editorMode === "visual" && styles.active
							)}
							onClick={() => this.setEditorMode("visual")}
						>
							Visual
						</button>
						<button
							className={classNames(
								styles.modeButton,
								editorMode === "code" && styles.active
							)}
							onClick={() => this.setEditorMode("code")}
						>
							Code
						</button>
						<button
							className={classNames(
								styles.modeButton,
								editorMode === "preview" && styles.active
							)}
							onClick={() => this.setEditorMode("preview")}
						>
							Preview
						</button>
					</div>

					{this.state.unsavedChanges && (
						<div className={styles.unsavedIndicator}>●</div>
					)}
				</div>

				{editorMode === "visual" && (
					<>
						<div className={styles.toolbar}>
							<div className={styles.toolPalette}>
								{Object.entries(this.state.toolPalette).map(
									([tool, config]) => (
										<button
											key={tool}
											className={classNames(
												styles.toolButton,
												currentTool === tool && styles.active
											)}
											onClick={() => this.selectTool(tool)}
										>
											<span className={styles.toolIcon}>{config.icon}</span>
											<span className={styles.toolName}>{config.name}</span>
										</button>
									)
								)}
							</div>

							<div className={styles.actions}>
								<button
									className={styles.actionButton}
									onClick={() => this.undo()}
									disabled={this.state.historyIndex < 0}
								>
									↶ Undo
								</button>
								<button
									className={styles.actionButton}
									onClick={() => this.redo()}
									disabled={
										this.state.historyIndex >= this.state.history.length - 1
									}
								>
									↷ Redo
								</button>
							</div>
						</div>

						<div className={styles.canvasContainer}>
							<div
								className={styles.canvas}
								style={{
									transform: `scale(${zoom}) translate(${this.state.pan.x}px, ${this.state.pan.y}px)`,
								}}
								onTouchStart={(e) => this.handleCanvasTouch(e)}
								onTouchMove={(e) => this.handleCanvasTouch(e)}
							>
								{this.state.showGrid && <div className={styles.grid} />}

								{elements.map((element) => (
									<div
										key={element.id}
										className={classNames(
											styles.element,
											styles[element.type],
											selectedElement?.id === element.id && styles.selected
										)}
										style={{
											left: element.x,
											top: element.y,
											width: element.width,
											height: element.height,
											backgroundColor: element.color,
										}}
									>
										{element.type === "text" && element.text}
										{element.type === "sprite" && (
											<img
												src={`/sprites/${element.spriteId}.png`}
												alt="Sprite"
											/>
										)}
									</div>
								))}
							</div>

							<div className={styles.zoomControls}>
								<button
									onClick={() =>
										this.setState({ zoom: Math.max(0.5, zoom - 0.25) })
									}
								>
									−
								</button>
								<span>{Math.round(zoom * 100)}%</span>
								<button
									onClick={() =>
										this.setState({ zoom: Math.min(3, zoom + 0.25) })
									}
								>
									+
								</button>
							</div>
						</div>
					</>
				)}

				{editorMode === "code" && (
					<div className={styles.codeEditor}>
						<textarea
							className={styles.codeTextarea}
							value={JSON.stringify(elements, null, 2)}
							onChange={(e) => {
								try {
									const newElements = JSON.parse(e.target.value);
									this.setState({
										elements: newElements,
										unsavedChanges: true,
									});
								} catch (error) {
									// Invalid JSON, don't update
								}
							}}
							placeholder="Edit level data as JSON..."
						/>
					</div>
				)}

				{editorMode === "preview" && (
					<div className={styles.preview}>
						{isPlaying ? (
							<div className={styles.testMode}>
								<div className={styles.testHeader}>
									<span>Test Mode</span>
									<button onClick={() => this.stopTest()}>Stop</button>
								</div>
								{/* Game preview would be rendered here */}
								<div className={styles.gamePreview}>
									<p>Game preview running...</p>
								</div>
							</div>
						) : (
							<div className={styles.previewMode}>
								<p>Click "Play Test" to test your level</p>
								<button onClick={() => this.playTest()}>Play Test</button>
							</div>
						)}
					</div>
				)}

				<div className={styles.footer}>
					<button
						className={styles.saveButton}
						onClick={() => this.saveLevel()}
					>
						Save Level
					</button>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	level: state.level.instance,
});

export default connect(mapStateToProps)(MobileLevelEditor);
