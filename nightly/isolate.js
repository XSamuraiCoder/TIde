// Cross-origin isolation for the web version on GitHub Pages, which can't send the headers for it.
// The calculator link (WebTILP's library, in webtilp/) runs on WebAssembly threads, which need
// SharedArrayBuffer, which browsers only allow on a cross-origin isolated page. This file is both:
// - on the page, a script that installs itself as a service worker and reloads once it's in control;
// - as that service worker, a pass-through that adds the two headers to every response.
// The desktop app and the dev server send the headers themselves, so there it does nothing.
/* eslint-disable no-restricted-globals */
// It is also what makes the web version an installable app (a PWA) that opens offline: each of the
// site's own files it fetches is kept, the newest copy, and used when the network isn't there.
// The network comes first, so an online TIde is always the newest one deployed.
if (typeof window === "undefined") {
  const CACHE = `tide-${self.registration.scope}`; // the stable and the nightly keep their own
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
  self.addEventListener("fetch", event => {
    const request = event.request;
    // Requests the browser can't repeat from a worker are left to it.
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
    const keep = request.method === "GET" && new URL(request.url).origin === self.location.origin && !request.headers.has("range");
    event.respondWith((async () => {
      let response;
      try {
        response = await fetch(request);
      } catch (err) {
        // Offline: the copy kept last time, if there is one.
        const kept = keep && await caches.match(request, { cacheName: CACHE });
        if (kept) return kept;
        throw err;
      }
      // Opaque responses (other sites, no CORS) can't be changed, and needn't be: credentialless allows them.
      if (response.status === 0) return response;
      const headers = new Headers(response.headers);
      headers.set("Cross-Origin-Opener-Policy", "same-origin");
      headers.set("Cross-Origin-Embedder-Policy", "credentialless");
      const isolated = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      if (keep && response.status === 200) {
        const copy = isolated.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => { /* storage full: online only */ }));
      }
      return isolated;
    })());
  });
} else if (!window.crossOriginIsolated && window.isSecureContext && "serviceWorker" in navigator) {
  const script = document.currentScript.src;
  // Reload once per tab, when the worker is in place; not again if isolation still fails (a hard
  // reload, for one, bypasses service workers).
  const reload = () => {
    if (sessionStorage.getItem("tide-isolate")) return;
    sessionStorage.setItem("tide-isolate", "1");
    location.reload();
  };
  navigator.serviceWorker.register(script, { scope: new URL(".", script).pathname }).then(registration => {
    if (registration.active && !navigator.serviceWorker.controller) reload();
    else navigator.serviceWorker.addEventListener("controllerchange", reload);
  }).catch(err => console.warn("TIde: no cross-origin isolation, so no calculator link:", err));
}
