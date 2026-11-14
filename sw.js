/* Makes the app work offline and handles background expiry reminders.
   Uses the network first so your edits show up, and falls back to the
   saved copy when there's no connection. Bump CACHE to force a refresh. */
const CACHE = "pantrypal-v5";
const DATA_CACHE = "pantrypal-data";
const FILES = ["./", "index.html", "styles.css", "app.js", "recipes.js", "recipes-more.js", "recipes-es.js", "i18n.js", "units.js", "planner.js", "kitchen.js", "extras.js", "manifest.json", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE && k !== DATA_CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
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
  const es = data.lang === "es";
  const parts = [];
  if (soon.length) parts.push((es ? "Vence mañana: " : "Expires tomorrow: ") + names(soon));
  if (todayItems.length) parts.push((es ? "Vence hoy: " : "Expires today: ") + names(todayItems));
  await self.registration.showNotification("Pantry Pal", { body: parts.join(". "), icon: "icon.svg", tag: "expiry" });
}

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow("./")));
});
