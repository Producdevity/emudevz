const CACHE_NAME = "emudevz-v1";
const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = "dynamic-v1";

// Assets to cache for offline use
const STATIC_ASSETS = [
	"/",
	"/index.html",
	"/manifest.json",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhEq3-OXg.woff2",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhFq3-OXg.woff2",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhGq3-OXg.woff2",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhHq3-OXg.woff2",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhIq3-OXg.woff2",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhLq38.woff2",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhPq3-OXg.woff2",
	"/fonts/L0x5DF4xlVMF-BfR8bXMIjhQq3-OXg.woff2",
	"bootstrap/dist/css/bootstrap.min.css",
	"highlight.js/styles/base16/onedark.css",
	"xterm/css/xterm.css",
	"/imgui.umd.js",
	"/imgui_impl.umd.js",
	"/imgui_memory_editor.umd.js",
	"/xterm-addon-image.js",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
	console.log("Service Worker: Installing...");

	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => {
				console.log("Service Worker: Caching static assets");
				return cache.addAll(STATIC_ASSETS);
			})
			.then(() => self.skipWaiting())
	);
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	console.log("Service Worker: Activating...");

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
							console.log("Service Worker: Deleting old cache", cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => self.clients.claim())
	);
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Only handle GET requests
	if (request.method !== "GET") return;

	// Skip external requests
	if (url.origin !== location.origin) return;

	// Handle different types of requests
	if (url.pathname.includes("/levels/") || url.pathname.includes("/assets/")) {
		// Cache level files and assets
		event.respondWith(
			caches
				.open(DYNAMIC_CACHE)
				.then((cache) => cache.match(request))
				.then((response) => {
					if (response) {
						return response;
					}

					// Fetch and cache new resources
					return fetch(request)
						.then((fetchResponse) => {
							// Only cache successful responses
							if (fetchResponse.ok) {
								caches
									.open(DYNAMIC_CACHE)
									.then((cache) => cache.put(request, fetchResponse.clone()));
							}
							return fetchResponse;
						})
						.catch(() => {
							// Return offline page for failed requests
							return caches.match("/offline.html");
						});
				})
		);
	} else {
		// Handle static assets
		event.respondWith(
			caches
				.open(STATIC_CACHE)
				.then((cache) => cache.match(request))
				.then((response) => {
					return response || fetch(request);
				})
		);
	}
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
	if (event.tag === "background-sync") {
		event.waitUntil(
			// Handle any background sync tasks here
			console.log("Service Worker: Background sync completed")
		);
	}
});

// Push notification handler
self.addEventListener("push", (event) => {
	const options = {
		body: event.data ? event.data.text() : "New update available",
		icon: "/icons/icon-192x192.png",
		badge: "/icons/icon-72x72.png",
		vibrate: [200, 100, 200],
		data: {
			url: "/",
		},
	};

	event.waitUntil(self.registration.showNotification("EmuDevz", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});
