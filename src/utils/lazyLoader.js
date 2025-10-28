import { isMobile } from "./mobile";
import { trackMobileEvent } from "./mobileAnalytics";

class LazyLoader {
	constructor() {
		this.assets = new Map();
		this.loadedAssets = new Map();
		this.loadingAssets = new Map();
		this.observers = new Map();
		this.priorityQueue = [];
		this.maxConcurrentLoads = isMobile() ? 2 : 4;
		this.currentLoads = 0;
		this.cache = new Map();
		this.maxCacheSize = isMobile() ? 50 : 100;
		this.preloadThreshold = isMobile() ? 200 : 100;
		
		this.init();
	}

	init() {
		// Setup intersection observer for viewport-based loading
		this.setupIntersectionObserver();
		
		// Setup network monitoring
		this.setupNetworkMonitoring();
		
		// Setup memory monitoring
		this.setupMemoryMonitoring();
	}

	setupIntersectionObserver() {
		if ('IntersectionObserver' in window) {
			const options = {
				rootMargin: `${this.preloadThreshold}px`,
				threshold: 0.1
			};
			
			this.intersectionObserver = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						this.loadAsset(entry.target.dataset.assetId);
					}
				});
			}, options);
		}
	}

	setupNetworkMonitoring() {
		if ('connection' in navigator) {
			const connection = navigator.connection;
			
			// Adjust loading strategy based on network conditions
			connection.addEventListener('change', () => {
				this.adjustLoadingStrategy(connection);
			});
			
			this.adjustLoadingStrategy(connection);
		}
	}

	setupMemoryMonitoring() {
		// Monitor memory usage and adjust cache size
		setInterval(() => {
			if (performance.memory) {
				const usedMemory = performance.memory.usedJSHeapSize;
				const totalMemory = performance.memory.jsHeapSizeLimit;
				const memoryUsage = usedMemory / totalMemory;
				
				if (memoryUsage > 0.8) {
					this.reduceCacheSize();
				}
			}
		}, 30000); // Check every 30 seconds
	}

	adjustLoadingStrategy(connection) {
		const effectiveType = connection.effectiveType;
		const saveData = connection.saveData;
		
		switch (effectiveType) {
			case 'slow-2g':
			case '2g':
				this.maxConcurrentLoads = 1;
				this.preloadThreshold = 50;
				this.maxCacheSize = 20;
				break;
			case '3g':
				this.maxConcurrentLoads = 2;
				this.preloadThreshold = 100;
				this.maxCacheSize = 40;
				break;
			case '4g':
				this.maxConcurrentLoads = isMobile() ? 2 : 4;
				this.preloadThreshold = isMobile() ? 200 : 100;
				this.maxCacheSize = isMobile() ? 50 : 100;
				break;
		}
		
		if (saveData) {
			this.maxConcurrentLoads = 1;
			this.maxCacheSize = 10;
		}
		
		trackMobileEvent('lazy_loader_strategy_adjusted', {
			effectiveType,
			saveData,
			maxConcurrentLoads: this.maxConcurrentLoads,
			maxCacheSize: this.maxCacheSize
		});
	}

	registerAsset(assetId, config) {
		const asset = {
			id: assetId,
			url: config.url,
			type: config.type || 'image',
			priority: config.priority || 'normal',
			dependencies: config.dependencies || [],
			preload: config.preload || false,
			lazy: config.lazy !== false,
			loader: config.loader || this.getDefaultLoader(config.type),
			onLoad: config.onLoad,
			onError: config.onError,
			onProgress: config.onProgress,
			retries: 0,
			maxRetries: config.maxRetries || 3,
			timeout: config.timeout || 10000
		};
		
		this.assets.set(assetId, asset);
		
		// Add to priority queue
		this.addToPriorityQueue(asset);
		
		// Start loading if not lazy
		if (!asset.lazy || asset.preload) {
			this.loadAsset(assetId);
		}
		
		// Setup observer for lazy loading
		if (asset.lazy && this.intersectionObserver) {
			const element = document.querySelector(`[data-asset-id="${assetId}"]`);
			if (element) {
				this.intersectionObserver.observe(element);
			}
		}
	}

	addToPriorityQueue(asset) {
		const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
		const priority = priorityOrder[asset.priority] || 2;
		
		this.priorityQueue.push({ asset, priority });
		this.priorityQueue.sort((a, b) => a.priority - b.priority);
	}

	async loadAsset(assetId) {
		const asset = this.assets.get(assetId);
		if (!asset) {
			console.warn(`Asset ${assetId} not found`);
			return null;
		}
		
		// Check if already loaded
		if (this.loadedAssets.has(assetId)) {
			return this.loadedAssets.get(assetId);
		}
		
		// Check if currently loading
		if (this.loadingAssets.has(assetId)) {
			return this.loadingAssets.get(assetId);
		}
		
		// Check cache first
		if (this.cache.has(assetId)) {
			const cachedAsset = this.cache.get(assetId);
			this.loadedAssets.set(assetId, cachedAsset);
			return cachedAsset;
		}
		
		// Wait for dependencies
		if (asset.dependencies.length > 0) {
			await Promise.all(asset.dependencies.map(dep => this.loadAsset(dep)));
		}
		
		// Check concurrent load limit
		if (this.currentLoads >= this.maxConcurrentLoads) {
			await this.waitForLoadSlot();
		}
		
		// Load the asset
		return this.performLoad(asset);
	}

	async waitForLoadSlot() {
		return new Promise(resolve => {
			const checkSlot = () => {
				if (this.currentLoads < this.maxConcurrentLoads) {
					resolve();
				} else {
					setTimeout(checkSlot, 100);
				}
			};
			checkSlot();
		});
	}

	async performLoad(asset) {
		this.currentLoads++;
		this.loadingAssets.set(asset.id, asset);
		
		try {
			const startTime = performance.now();
			
			// Create timeout promise
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Load timeout')), asset.timeout);
			});
			
			// Create load promise
			const loadPromise = asset.loader(asset.url, asset);
			
			// Race between load and timeout
			const result = await Promise.race([loadPromise, timeoutPromise]);
			
			const loadTime = performance.now() - startTime;
			
			// Cache the result
			this.cacheAsset(asset.id, result);
			this.loadedAssets.set(asset.id, result);
			
			// Track successful load
			trackMobileEvent('asset_loaded', {
				id: asset.id,
				type: asset.type,
				loadTime,
				size: result.size || 0
			});
			
			// Call success callback
			if (asset.onLoad) {
				asset.onLoad(result);
			}
			
			return result;
			
		} catch (error) {
			console.error(`Failed to load asset ${asset.id}:`, error);
			
			// Retry logic
			if (asset.retries < asset.maxRetries) {
				asset.retries++;
				setTimeout(() => {
					this.loadAsset(asset.id);
				}, Math.pow(2, asset.retries) * 1000); // Exponential backoff
				
				return null;
			}
			
			// Track failed load
			trackMobileEvent('asset_load_failed', {
				id: asset.id,
				type: asset.type,
				error: error.message,
				retries: asset.retries
			});
			
			// Call error callback
			if (asset.onError) {
				asset.onError(error);
			}
			
			return null;
			
		} finally {
			this.currentLoads--;
			this.loadingAssets.delete(asset.id);
			
			// Process next in queue
			this.processQueue();
		}
	}

	processQueue() {
		while (this.currentLoads < this.maxConcurrentLoads && this.priorityQueue.length > 0) {
			const { asset } = this.priorityQueue.shift();
			if (!this.loadedAssets.has(asset.id) && !this.loadingAssets.has(asset.id)) {
				this.loadAsset(asset.id);
			}
		}
	}

	cacheAsset(assetId, data) {
		// Check cache size limit
		if (this.cache.size >= this.maxCacheSize) {
			this.evictOldestCacheEntry();
		}
		
		// Add to cache with timestamp
		this.cache.set(assetId, {
			data,
			timestamp: Date.now(),
			accessCount: 0
		});
	}

	evictOldestCacheEntry() {
		let oldestKey = null;
		let oldestTime = Date.now();
		
		for (const [key, value] of this.cache.entries()) {
			if (value.timestamp < oldestTime) {
				oldestTime = value.timestamp;
				oldestKey = key;
			}
		}
		
		if (oldestKey) {
			this.cache.delete(oldestKey);
		}
	}

	reduceCacheSize() {
		const targetSize = Math.floor(this.maxCacheSize * 0.7);
		
		while (this.cache.size > targetSize) {
			this.evictOldestCacheEntry();
		}
		
		trackMobileEvent('lazy_loader_cache_reduced', {
			oldSize: this.maxCacheSize,
			newSize: targetSize
		});
	}

	getDefaultLoader(type) {
		switch (type) {
			case 'image':
				return this.loadImage.bind(this);
			case 'audio':
				return this.loadAudio.bind(this);
			case 'video':
				return this.loadVideo.bind(this);
			case 'json':
				return this.loadJSON.bind(this);
			case 'text':
				return this.loadText.bind(this);
			case 'shader':
				return this.loadShader.bind(this);
			case 'texture':
				return this.loadTexture.bind(this);
			case 'model':
				return this.loadModel.bind(this);
			default:
				return this.loadGeneric.bind(this);
		}
	}

	async loadImage(url, asset) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			
			img.onload = () => {
				resolve({
					element: img,
					width: img.naturalWidth,
					height: img.naturalHeight,
					url,
					size: img.naturalWidth * img.naturalHeight * 4 // Rough estimate
				});
			};
			
			img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
			img.src = url;
		});
	}

	async loadAudio(url, asset) {
		return new Promise((resolve, reject) => {
			const audio = new Audio();
			audio.crossOrigin = 'anonymous';
			
			audio.oncanplaythrough = () => {
				resolve({
					element: audio,
					url,
					duration: audio.duration,
					size: audio.duration * 128000 // Rough estimate (128kbps)
				});
			};
			
			audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
			audio.src = url;
		});
	}

	async loadVideo(url, asset) {
		return new Promise((resolve, reject) => {
			const video = document.createElement('video');
			video.crossOrigin = 'anonymous';
			video.preload = 'metadata';
			
			video.onloadedmetadata = () => {
				resolve({
					element: video,
					url,
					width: video.videoWidth,
					height: video.videoHeight,
					duration: video.duration,
					size: video.videoWidth * video.videoHeight * 3 // Rough estimate
				});
			};
			
			video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
			video.src = url;
		});
	}

	async loadJSON(url, asset) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load JSON: ${url}`);
		}
		const data = await response.json();
		return {
			data,
			url,
			size: JSON.stringify(data).length
		};
	}

	async loadText(url, asset) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load text: ${url}`));
		}
		const text = await response.text();
		return {
			text,
			url,
			size: text.length
		};
	}

	async loadShader(url, asset) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load shader: ${url}`));
		}
		const source = await response.text();
		return {
			source,
			url,
			size: source.length
		};
	}

	async loadTexture(url, asset) {
		// For WebGL textures
		const image = await this.loadImage(url, asset);
		return {
			...image,
			type: 'texture'
		};
	}

	async loadModel(url, asset) {
		// For 3D models (GLTF, OBJ, etc.)
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load model: ${url}`));
		}
		const data = await response.arrayBuffer();
		return {
			data,
			url,
			size: data.byteLength
		};
	}

	async loadGeneric(url, asset) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load resource: ${url}`));
		}
		const data = await response.blob();
		return {
			data,
			url,
			size: data.size
		};
	}

	// Public API
	preloadAssets(assetIds) {
		assetIds.forEach(id => {
			const asset = this.assets.get(id);
			if (asset && !asset.preload) {
				asset.preload = true;
				this.loadAsset(id);
			}
		});
	}

	unloadAsset(assetId) {
		this.loadedAssets.delete(assetId);
		this.loadingAssets.delete(assetId);
		this.cache.delete(assetId);
		
		// Remove from observer
		const element = document.querySelector(`[data-asset-id="${assetId}"]`);
		if (element && this.intersectionObserver) {
			this.intersectionObserver.unobserve(element);
		}
	}

	getAsset(assetId) {
		return this.loadedAssets.get(assetId);
	}

	isAssetLoaded(assetId) {
		return this.loadedAssets.has(assetId);
	}

	getLoadingProgress() {
		const totalAssets = this.assets.size;
		const loadedAssets = this.loadedAssets.size;
		const loadingAssets = this.loadingAssets.size;
		
		return {
			total: totalAssets,
			loaded: loadedAssets,
			loading: loadingAssets,
			progress: totalAssets > 0 ? loadedAssets / totalAssets : 0
		};
	}

	getCacheInfo() {
		return {
			size: this.cache.size,
			maxSize: this.maxCacheSize,
			usage: this.cache.size / this.maxCacheSize
		};
	}

	clearCache() {
		this.cache.clear();
		trackMobileEvent('lazy_loader_cache_cleared');
	}

	destroy() {
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
		}
		
		this.assets.clear();
		this.loadedAssets.clear();
		this.loadingAssets.clear();
		this.cache.clear();
		this.priorityQueue = [];
	}
}

// Create singleton instance
const lazyLoader = new LazyLoader();

export default lazyLoader;