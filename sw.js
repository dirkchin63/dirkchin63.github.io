const SHELL='hkime-shell-1b45b7736ce0',SESSION='hkime-session-1b45b7736ce0',FULL='hkime-practice-offline-v2',BUILD='6edc18adb4fee9602b60',SHELL_URLS=["/assets/dark-ui-dd7109fd9b5b.css","/assets/home-events/abstract.webp","/assets/home-events/audio.webp","/assets/home-events/binary.webp","/assets/home-events/cards.webp","/assets/home-events/dates.webp","/assets/home-events/faces.svg","/assets/home-events/numbers.webp","/assets/home-events/speedCards.webp","/assets/home-events/speedNumbers.webp","/assets/home-events/words.webp","/assets/index-B4ICr9VO.css","/assets/index-f8bd97cab16c.js","/assets/interface-type/hk-interface.woff","/assets/interface-type/license.json","/assets/logo.png","/bank-index.json","/demo-content.json","/","/offline-manifest.json"];
// SHELL, SESSION, FULL, BUILD and SHELL_URLS are injected by build.mjs.
const optional = async (action) => { try { return await action(); } catch { return undefined; } };
self.addEventListener('install', event => {
    event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        // Keep the previous shell/session while an already-open practice still uses it.
        const keys = await caches.keys();
        for (const prefix of ['hkime-shell-', 'hkime-session-']) {
            const old = keys.filter(k => k.startsWith(prefix) && k !== SHELL && k !== SESSION);
            await Promise.all(old.slice(0, Math.max(0, old.length - 1)).map(k => caches.delete(k)));
        }
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', event => {
    const request = event.request, url = new URL(request.url);
    if (url.origin !== self.location.origin || request.method !== 'GET') return;
    // Explicit verification/retry must not be intercepted by a stale cached asset.
    if (request.headers?.get('X-HKIME-Download')) { event.respondWith(fetch(request)); return; }
    event.respondWith((async () => {
        const shell = await optional(() => caches.open(SHELL));
        const session = await optional(() => caches.open(SESSION));
        const full = await optional(() => caches.open(FULL));
        const marker = await optional(async () => (await full?.match('/__offline_complete__'))?.json());
        const currentFull = marker?.buildId === BUILD;
        const cached = async () => await optional(() => session?.match(request)) ||
            await optional(() => shell?.match(request)) ||
            (currentFull ? await optional(() => full?.match(request)) : undefined);
        const immutable = url.pathname.startsWith('/assets/');
        if (immutable) { const hit = await cached(); if (hit) return hit; }
        try {
            const response = await fetch(request);
            if (response.ok) {
                if (immutable) await optional(() => session?.put(request, response.clone()));
                return response;
            }
            const hit = await cached();
            return hit || response;
        } catch (error) {
            const hit = await cached(); if (hit) return hit;
            if (request.mode === 'navigate') {
                const index = await optional(() => shell?.match('/')) || (currentFull ? await optional(() => full?.match('/')) : undefined);
                if (index) return index;
            }
            throw error;
        }
    })());
});
