/* Makes the app work offline and handles background expiry reminders.
   - The page itself (index.html) comes from the network first, so updates show up.
   - Everything else (scripts, styles, pages, recipes, pictures) comes from the saved copy
     right away and refreshes in the background, so the app opens fast with no signal.
   Bump CACHE when you publish a big change to clear out old copies. */
importScripts("offline-files.js");   // defines OFFLINE_FILES
const CACHE = "pantrypal-v11w";
const DATA_CACHE = "pantrypal-data";

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(OFFLINE_FILES);
    // Recipes come from data/recipes.json (in the list above). Single recipe files are saved as they load.
  })());
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE && k !== DATA_CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
function isPage(url) { return url.pathname.endsWith("/") || url.pathname.endsWith("/index.html"); }

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (FONT_HOSTS.includes(url.hostname)) {
    // Fonts rarely change: use the saved copy first so the app looks right offline.
    e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  if (url.pathname.includes("/audio/")) return;   // songs stream straight from the site
  if (isPage(url)) {
    e.respondWith(fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response("Offline", { status: 503 });
  }));
});

/* Background check (Chrome on Android, when installed to the home screen). */
self.addEventListener("periodicsync", e => {
  if (e.tag === "expiry-check") e.waitUntil(checkExpiring());
});

async function checkExpiring() {
  const cache = await caches.open(DATA_CACHE);
  const res = await cache.match("pantry-data.json");
  if (!res) return;
  const data = await res.json();
  const items = data.items || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const stamp = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  if (await cache.match("notified-" + stamp)) return; // once a day
  const daysLeft = s => { const [y, m, d] = s.split("-").map(Number); return Math.round((new Date(y, m - 1, d) - today) / 86400000); };
  const soon = items.filter(i => i.expires && daysLeft(i.expires) === 1);
  const todayItems = items.filter(i => i.expires && daysLeft(i.expires) === 0);
  if (!soon.length && !todayItems.length) return;
  await cache.put("notified-" + stamp, new Response("1"));
  const names = list => list.slice(0, 3).map(i => i.name).join(", ") + (list.length > 3 ? ` +${list.length - 3}` : "");
  const parts = [];
  if (soon.length) parts.push("Expires tomorrow: " + names(soon));
  if (todayItems.length) parts.push("Expires today: " + names(todayItems));
  await self.registration.showNotification("Pantry Pal", { body: parts.join(". "), icon: "img/icons/icon-192.png", tag: "expiry" });
}

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow("./")));
});
