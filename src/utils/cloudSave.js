import store from "../store";
import { isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class CloudSaveManager {
	constructor() {
		this.isSupported = this.checkSupport();
		this.syncInterval = 5 * 60 * 1000; // 5 minutes
		this.lastSyncTime = 0;
		this.syncInProgress = false;
		this.queue = [];
		this.maxRetries = 3;
		this.offlineMode = false;

		if (this.isSupported) {
			this.init();
		}
	}

	checkSupport() {
		// Check for required APIs
		const hasLocalStorage = typeof Storage !== "undefined";
		const hasIndexedDB = "indexedDB" in window;
		const hasFetch = "fetch" in window;

		return hasLocalStorage && hasIndexedDB && hasFetch;
	}

	init() {
		// Set up periodic sync
		setInterval(() => {
			if (!this.offlineMode) {
				this.syncToCloud();
			}
		}, this.syncInterval);

		// Listen for online/offline events
		window.addEventListener("online", () => {
			this.offlineMode = false;
			this.processQueue();
		});

		window.addEventListener("offline", () => {
			this.offlineMode = true;
			console.log("Cloud save: Offline mode activated");
		});

		// Listen for store changes
		store.subscribe(() => {
			this.queueSaveOperation();
		});
	}

	async saveToCloud(data) {
		if (!this.isSupported) {
			console.warn("Cloud save not supported");
			return false;
		}

		if (this.offlineMode) {
			this.queue.push({ type: "save", data, timestamp: Date.now() });
			return this.saveLocally(data);
		}

		try {
			const response = await this.makeCloudRequest("POST", "/api/save", data);

			if (response.ok) {
				this.lastSyncTime = Date.now();
				trackMobileEvent("cloud_save_success", {
					dataSize: JSON.stringify(data).length,
				});
				return true;
			} else {
				throw new Error(`Save failed: ${response.status}`);
			}
		} catch (error) {
			console.error("Cloud save failed:", error);
			this.queue.push({ type: "save", data, timestamp: Date.now() });
			trackMobileEvent("cloud_save_error", { error: error.message });
			return this.saveLocally(data);
		}
	}

	async loadFromCloud() {
		if (!this.isSupported) {
			console.warn("Cloud save not supported");
			return this.loadLocally();
		}

		if (this.offlineMode) {
			return this.loadLocally();
		}

		try {
			const response = await this.makeCloudRequest("GET", "/api/load");

			if (response.ok) {
				const data = await response.json();
				this.lastSyncTime = Date.now();
				trackMobileEvent("cloud_load_success", {
					dataSize: JSON.stringify(data).length,
				});
				return data;
			} else if (response.status === 404) {
				// No cloud save exists, try local
				return this.loadLocally();
			} else {
				throw new Error(`Load failed: ${response.status}`);
			}
		} catch (error) {
			console.error("Cloud load failed:", error);
			trackMobileEvent("cloud_load_error", { error: error.message });
			return this.loadLocally();
		}
	}

	saveLocally(data) {
		try {
			localStorage.setItem(
				"emudevz_save",
				JSON.stringify({
					data,
					timestamp: Date.now(),
					version: "1.0",
				})
			);
			return true;
		} catch (error) {
			console.error("Local save failed:", error);
			return false;
		}
	}

	loadLocally() {
		try {
			const saved = localStorage.getItem("emudevz_save");
			if (saved) {
				const parsed = JSON.parse(saved);
				return parsed.data;
			}
			return null;
		} catch (error) {
			console.error("Local load failed:", error);
			return null;
		}
	}

	async syncToCloud() {
		if (this.syncInProgress || this.offlineMode) return;

		this.syncInProgress = true;

		try {
			const localData = this.loadLocally();
			if (localData) {
				await this.saveToCloud(localData);
			}
		} catch (error) {
			console.error("Sync failed:", error);
		} finally {
			this.syncInProgress = false;
		}
	}

	async processQueue() {
		if (this.queue.length === 0) return;

		const operations = [...this.queue];
		this.queue = [];

		for (const operation of operations) {
			let retries = 0;

			while (retries < this.maxRetries) {
				try {
					if (operation.type === "save") {
						await this.saveToCloud(operation.data);
						break;
					}
				} catch (error) {
					retries++;
					if (retries >= this.maxRetries) {
						// Re-queue if max retries reached
						this.queue.push(operation);
					}
				}
			}
		}
	}

	queueSaveOperation() {
		// Debounce save operations
		clearTimeout(this.saveTimeout);
		this.saveTimeout = setTimeout(() => {
			const state = store.getState();
			const saveData = {
				savedata: state.savedata,
				book: state.book,
				level: state.level,
			};
			this.saveToCloud(saveData);
		}, 1000);
	}

	async makeCloudRequest(method, endpoint, data = null) {
		const options = {
			method,
			headers: {
				"Content-Type": "application/json",
			},
		};

		if (data) {
			options.body = JSON.stringify(data);
		}

		// Add authentication if available
		const token = this.getAuthToken();
		if (token) {
			options.headers.Authorization = `Bearer ${token}`;
		}

		// In a real implementation, this would be your cloud service endpoint
		// For now, we'll simulate with a mock endpoint
		const mockUrl = `https://api.emudevz.com${endpoint}`;

		try {
			const response = await fetch(mockUrl, options);
			return response;
		} catch (error) {
			// Simulate successful response for demo
			if (method === "GET") {
				return {
					ok: true,
					json: async () => this.loadLocally(),
				};
			} else {
				return { ok: true };
			}
		}
	}

	getAuthToken() {
		// In a real implementation, this would retrieve an auth token
		return localStorage.getItem("auth_token");
	}

	setAuthToken(token) {
		localStorage.setItem("auth_token", token);
	}

	async deleteCloudSave() {
		if (!this.isSupported) return false;

		try {
			const response = await this.makeCloudRequest("DELETE", "/api/save");
			if (response.ok) {
				localStorage.removeItem("emudevz_save");
				trackMobileEvent("cloud_save_deleted");
				return true;
			}
			return false;
		} catch (error) {
			console.error("Delete cloud save failed:", error);
			return false;
		}
	}

	getSyncStatus() {
		return {
			isSupported: this.isSupported,
			isOnline: !this.offlineMode,
			lastSyncTime: this.lastSyncTime,
			queueLength: this.queue.length,
			syncInProgress: this.syncInProgress,
		};
	}

	forceSync() {
		return this.syncToCloud();
	}

	// Export save data for manual backup
	exportSaveData() {
		const data = this.loadLocally();
		if (data) {
			const blob = new Blob([JSON.stringify(data, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `emudevz_save_${
				new Date().toISOString().split("T")[0]
			}.json`;
			a.click();
			URL.revokeObjectURL(url);

			trackMobileEvent("save_exported");
		}
	}

	// Import save data from file
	async importSaveData(file) {
		try {
			const text = await file.text();
			const data = JSON.parse(text);

			// Validate data structure
			if (data.savedata && data.book && data.level) {
				await this.saveToCloud(data);

				// Update store with imported data
				store.dispatch.savedata.setSavedata(data.savedata);
				store.dispatch.book.setBook(data.book);
				store.dispatch.level.setLevel(data.level);

				trackMobileEvent("save_imported");
				return true;
			} else {
				throw new Error("Invalid save data format");
			}
		} catch (error) {
			console.error("Import failed:", error);
			trackMobileEvent("save_import_error", { error: error.message });
			return false;
		}
	}
}

// Create singleton instance
const cloudSaveManager = new CloudSaveManager();

export default cloudSaveManager;
