/* ============================================================
   Service Worker — PWA 离线缓存
   策略：HTML/CSS/JS 用 Network-First（保证拿到最新版），
        图标等静态资源用 Cache-First（速度快）
   ============================================================ */
const CACHE_VERSION = "v7";
const CACHE_NAME = `java-interview-${CACHE_VERSION}`;

// 预缓存（只缓存不会变的图标等静态资源）
const PRECACHE_URLS = [
  "./icons/favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ============ Install ============
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting(); // 立即激活新版本
});

// ============ Activate — 清掉旧版本缓存 ============
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim(); // 立即接管所有页面
});

// ============ Fetch ============
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 判断资源类型
  const isHtml = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";
  const isCssJs = /\.(css|js)$/.test(url.pathname);

  // HTML / CSS / JS → Network-First（优先拿最新版，离线才用缓存）
  if (isHtml || isCssJs) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // 其他（图标等）→ Cache-First
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});
