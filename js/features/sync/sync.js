"use strict";
/* Shared kitchen: keeps My Food, the shopping lists, and the meal plan the same on every phone in a household.
   One phone starts a shared kitchen and gets a code like PP-K7QM-4XWD-9TRB. Other phones join with the code.
   Before anything leaves the phone, it's locked (AES-GCM) with a key made from the code, so the sync server
   (server/sync-worker.js) only ever stores data it can't read. The server finds a kitchen by a fingerprint of
   the code, never the code itself.
   Syncing is a three-way merge: what this phone had at the last sync (the "base"), what it has now, and what the
   server has now. A change made on only one side wins. If both phones changed the same thing, this phone's
   change wins. Nothing here runs unless SYNC_URL is set in config.js. */

const SYNC_SHADOW_KEY = "pantrypal.sync.base.v1";
const SYNC_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let syncBusy = false, syncAgain = false, syncTimer = null, syncApplying = false, syncState = "idle", syncKeyCache = null;

const syncOn = () => !!(typeof SYNC_URL !== "undefined" && SYNC_URL && settings.sync && settings.sync.code);
const syncEnabled = () => !!(typeof SYNC_URL !== "undefined" && SYNC_URL);

/* ---------- Codes and keys ---------- */
function newKitchenCode() {
  const r = crypto.getRandomValues(new Uint8Array(12));
  const s = Array.from(r, n => SYNC_CODE_CHARS[n % 32]).join("");
  return "PP-" + s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8);
}
/* Tidy what someone typed: capitals, no spaces, mixed up letters fixed, dashes put back */
function cleanKitchenCode(raw) {
  let s = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/O/g, "0").replace(/I/g, "1");
  if (s.startsWith("PP")) s = s.slice(2);
  s = s.replace(/0/g, "").replace(/1/g, "");   // 0, 1, O, and I never appear in codes
  if (s.length !== 12 || [...s].some(c => !SYNC_CODE_CHARS.includes(c))) return null;
  return "PP-" + s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8);
}
async function syncKeys(code) {
  if (syncKeyCache && syncKeyCache.code === code) return syncKeyCache;
  const enc = new TextEncoder(), norm = code.replace(/-/g, "");
  const idHash = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode("pantrypal-kitchen-id|" + norm)));
  const id = Array.from(idHash.slice(0, 16), b => b.toString(16).padStart(2, "0")).join("");
  const base = await crypto.subtle.importKey("raw", enc.encode(norm), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("pantrypal-sync-v1"), iterations: 200000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  syncKeyCache = { code, id, key };
  return syncKeyCache;
}
async function syncLock(obj, key) {
  let bytes = new TextEncoder().encode(JSON.stringify(obj));
  let tag = "j";
  if (typeof CompressionStream !== "undefined") {
    const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    bytes = new Uint8Array(await new Response(st).arrayBuffer()); tag = "z";
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
  const all = new Uint8Array(12 + ct.length); all.set(iv); all.set(ct, 12);
  return tag + b64url(all);
}
async function syncUnlock(str, key) {
  const all = b64urlDecode(str.slice(1));
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(0, 12) }, key, all.slice(12)));
  if (str[0] === "j") return JSON.parse(new TextDecoder().decode(plain));
  const st = new Blob([plain]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return JSON.parse(await new Response(st).text());
}

/* ---------- The data that's shared, and merging it ---------- */
const syncSnapshot = () => JSON.parse(JSON.stringify({ items, shopping, plan }));
const SYNC_EMPTY = { items: [], shopping: [], plan: [] };
const recKey = (r, i) => (r && r.id) ? String(r.id) : "x" + i + ":" + JSON.stringify(r);

/* Merge one list of records. The order is this phone's order, with new records from the server added after. */
function syncMergeRecords(base, mine, theirs) {
  const map = arr => { const m = new Map(); (arr || []).forEach((r, i) => m.set(recKey(r, i), r)); return m; };
  const B = map(base), L = map(mine), R = map(theirs);
  const S = r => r === undefined ? undefined : JSON.stringify(r);
  const pick = k => {
    const b = S(B.get(k)), l = S(L.get(k)), r = S(R.get(k));
    if (l === r) return L.get(k);
    if (l === b) return R.get(k);      // only the other phone changed it (or removed it)
    if (r === b) return L.get(k);      // only this phone changed it (or removed it)
    if (l === undefined) return R.get(k);   // removed here, changed there: keep the change
    if (r === undefined) return L.get(k);
    return L.get(k);                   // both changed it: this phone wins
  };
  const out = [], seen = new Set();
  for (const k of [...L.keys(), ...R.keys()]) {
    if (seen.has(k)) continue; seen.add(k);
    const v = pick(k); if (v !== undefined) out.push(v);
  }
  return out;
}
/* Shopping lists merge item by item, so two people checking things off the same list don't undo each other */
function flattenLists(lists) {
  const heads = [], rows = [];
  (lists || []).forEach(l => {
    const { items: its, ...head } = l; heads.push(head);
    (its || []).forEach(it => rows.push({ ...it, id: l.id + "/" + it.id, _list: l.id }));
  });
  return { heads, rows };
}
function syncMergeLists(base, mine, theirs) {
  const b = flattenLists(base), l = flattenLists(mine), r = flattenLists(theirs);
  const heads = syncMergeRecords(b.heads, l.heads, r.heads);
  const rows = syncMergeRecords(b.rows, l.rows, r.rows);
  return heads.map(h => ({ ...h, items: rows.filter(x => x._list === h.id).map(({ _list, ...x }) => ({ ...x, id: x.id.slice(h.id.length + 1) })) }));
}
function syncMerge(base, mine, theirs) {
  return {
    items: syncMergeRecords(base.items, mine.items, theirs.items),
    shopping: syncMergeLists(base.shopping, mine.shopping, theirs.shopping),
    plan: syncMergeRecords(base.plan, mine.plan, theirs.plan)
  };
}
function syncApply(data) {
  syncApplying = true;
  try {
    items = data.items; shopping = data.shopping; plan = data.plan;
    if (settings.activeList && !shopping.some(l => l.id === settings.activeList)) settings.activeList = shopping[0] ? shopping[0].id : null;
    saveItems(); saveShopping(); savePlan(); saveSettings();
  } finally { syncApplying = false; }
  renderAll();
}

/* ---------- Talking to the server ---------- */
async function syncFetch(method, id, body) {
  const r = await fetch(SYNC_URL.replace(/\/$/, "") + "/k/" + id, {
    method, cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined
  });
  let data = null; try { data = await r.json(); } catch (e) {}
  return { status: r.status, data };
}
const loadShadow = id => { const s = load(SYNC_SHADOW_KEY, null); return s && s.id === id ? s : null; };

/* One round: pull, merge, and push if anything here is new. Returns "ok", "offline", or "gone". */
async function kitchenSync(opts) {
  const o = opts || {};
  if (!syncOn()) return "off";
  if (syncBusy) { syncAgain = true; return "busy"; }
  syncBusy = true; setSyncState("syncing");
  let result = "ok";
  try {
    const { id, key } = await syncKeys(settings.sync.code);
    const shadow = loadShadow(id);
    const base = shadow ? shadow.data : (o.base || SYNC_EMPTY);
    let got = await syncFetch("GET", id);
    let v = 0, theirs = null;
    if (got.status === 200) { v = got.data.v; theirs = await syncUnlock(got.data.d, key); }
    else if (got.status === 404) {
      if (shadow && shadow.v > 0) { result = "gone"; return result; }   // the kitchen was deleted from the server
    } else throw new Error("server " + got.status);
    for (let tries = 0; tries < 4; tries++) {
      const mine = syncSnapshot();
      const merged = theirs ? syncMerge(base, mine, theirs) : mine;
      const changedHere = JSON.stringify(merged) !== JSON.stringify(mine);
      if (changedHere) { syncApply(merged); if (!o.silent && theirs) toast(t("Updated from your shared kitchen.")); }
      if (theirs && JSON.stringify(merged) === JSON.stringify(theirs)) { store(SYNC_SHADOW_KEY, { id, v, data: merged }); break; }
      const put = await syncFetch("PUT", id, { v, d: await syncLock(merged, key) });
      if (put.status === 200) { store(SYNC_SHADOW_KEY, { id, v: put.data.v, data: merged }); break; }
      if (put.status === 409 && put.data) { v = put.data.v; theirs = put.data.d ? await syncUnlock(put.data.d, key) : null; continue; }
      if (put.status === 413) { toast(t("Your shared kitchen is too big to sync. Try clearing out old shopping lists and meal plans.")); break; }
      throw new Error("server " + put.status);
    }
    settings.sync.last = Date.now(); saveSettings();
  } catch (e) {
    result = "offline";
  } finally {
    syncBusy = false;
    setSyncState(result === "ok" ? "idle" : result);
    if (syncAgain) { syncAgain = false; setTimeout(() => kitchenSync(), 300); }
  }
  return result;
}
/* Called after anything shared is saved: sync a moment later, so a burst of changes goes up together */
function kitchenSyncSoon() {
  if (syncApplying || !syncOn()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => kitchenSync(), 2500);
}
function setSyncState(s) { syncState = s; renderSyncCard(); }

/* ---------- Starting, joining, and leaving ---------- */
async function startSharedKitchen() {
  if (!navigator.onLine) { toast(t("You're offline. Connect to the internet to start a shared kitchen.")); return; }
  const code = newKitchenCode();
  if (items.some(i => i.sample)) { items = items.filter(i => !i.sample); saveItems(); }   // the sample kitchen isn't shared
  settings.sync = { code, since: todayStr() }; saveSettings();
  try { localStorage.removeItem(SYNC_SHADOW_KEY); } catch (e) {}
  const r = await kitchenSync({ silent: true });
  if (r !== "ok") { settings.sync = null; saveSettings(); toast(t("Couldn't reach the sync server. Try again in a minute.")); renderSyncCard(); return; }
  sfx("cheer"); buzz([10, 50, 10]);
  toast(t("Your shared kitchen is ready. Add other phones with the code."));
  renderSyncCard(true);
}
async function joinSharedKitchen(raw) {
  const code = cleanKitchenCode(raw);
  if (!code) { toast(t("That code doesn't look right. It has 12 letters and numbers after PP.")); return false; }
  if (settings.sync && settings.sync.code === code) { toast(t("This phone is already in that kitchen.")); return true; }
  if (!navigator.onLine) { toast(t("You're offline. Connect to the internet to join a shared kitchen.")); return false; }
  const { id } = await syncKeys(code);
  let got;
  try { got = await syncFetch("GET", id); } catch (e) { toast(t("Couldn't reach the sync server. Try again in a minute.")); return false; }
  if (got.status === 404) { toast(t("No shared kitchen has that code. Check it and try again.")); return false; }
  if (got.status !== 200) { toast(t("Couldn't reach the sync server. Try again in a minute.")); return false; }
  const hasFood = items.some(i => !i.sample) || shopping.some(l => (l.items || []).length) || plan.length;
  if (hasFood && !await Ask.confirm({ title: t("Join this kitchen?"), text: t("The food, shopping lists, and meal plan on this phone get added to the shared kitchen, so everyone sees them."), yes: t("Join") })) return false;
  if (items.some(i => i.sample)) { items = items.filter(i => !i.sample); saveItems(); }   // the sample kitchen isn't shared
  settings.sync = { code, since: todayStr() }; saveSettings();
  try { localStorage.removeItem(SYNC_SHADOW_KEY); } catch (e) {}
  const r = await kitchenSync({ silent: true, base: SYNC_EMPTY });
  if (r !== "ok") { toast(t("Joined, but couldn't sync yet. It will try again soon.")); renderSyncCard(); return true; }
  sfx("cheer"); buzz([10, 50, 10]);
  toast(t("You joined the shared kitchen!"));
  renderSyncCard();
  return true;
}
async function leaveSharedKitchen() {
  if (!await Ask.confirm({ title: t("Stop sharing on this phone?"), text: t("Your food stays on this phone, but changes won't sync anymore. Other phones keep the shared kitchen."), yes: t("Stop sharing"), danger: true })) return;
  settings.sync = null; saveSettings();
  try { localStorage.removeItem(SYNC_SHADOW_KEY); } catch (e) {}
  toast(t("This phone stopped sharing. Your food is still here."));
  renderSyncCard();
}
const joinLink = code => location.href.split("#")[0].split("?")[0] + "#/join/" + code;
async function joinFromLink(raw) {
  const code = cleanKitchenCode(raw);
  try { window.history.replaceState(window.history.state, "", location.pathname + location.search + "#/food"); } catch (e) {}
  if (!code || !syncEnabled()) return;
  if (settings.sync && settings.sync.code === code) { toast(t("This phone is already in that kitchen.")); return; }
  if (settings.sync && settings.sync.code && !await Ask.confirm({ title: t("Switch kitchens?"), text: t("This phone is in another shared kitchen. Leave it and join this one?"), yes: t("Switch") })) return;
  joinSharedKitchen(code);
}

/* ---------- The card on the Share your kitchen page ---------- */
function syncAgo(ms) {
  if (!ms) return t("Not synced yet");
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return t("Synced just now");
  if (s < 3600) return tn(Math.round(s / 60), "Synced 1 minute ago", "Synced {n} minutes ago");
  if (s < 86400) return tn(Math.round(s / 3600), "Synced 1 hour ago", "Synced {n} hours ago");
  return t("Synced on {date}", { date: prettyDate(new Date(ms).toISOString().slice(0, 10)) });
}
function renderSyncCard(showQr) {
  const box = $("#skLive"); if (!box) return;
  box.classList.toggle("hidden", !syncEnabled());
  if (!syncEnabled()) return;
  const ic = n => `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/${n}.svg#i"/></svg>`;
  if (!syncOn()) {
    box.innerHTML = `<h3>${esc(t("Keep every phone in sync"))}</h3>
      <p>${esc(t("Share one kitchen with everyone in your home. Food, shopping lists, and the meal plan stay the same on every phone that joins."))}</p>
      <p class="muted small">${esc(t("No account needed. Your kitchen is locked with its code before it leaves this phone, so not even Pantry Pal can read it."))}</p>
      <button type="button" class="primary wide" data-sync="start">${ic("house")} <span>${esc(t("Start a shared kitchen"))}</span></button>
      <button type="button" class="wide" data-sync="join">${ic("plus")} <span>${esc(t("Join with a code"))}</span></button>`;
    return;
  }
  const code = settings.sync.code;
  const status = syncState === "syncing" ? t("Syncing...") : syncState === "offline" ? t("Can't reach the sync server right now. Changes are saved here and will sync later.")
    : syncState === "gone" ? t("This shared kitchen isn't on the server anymore. Start a new one or join another.") : syncAgo(settings.sync.last);
  box.innerHTML = `<h3>${esc(t("Shared kitchen"))} <span class="sk-live-dot ${syncState === "offline" || syncState === "gone" ? "off" : ""}" aria-hidden="true"></span></h3>
    <p>${esc(t("This phone is in sync with your household. To add a phone, scan the code below with it, or type the kitchen code into Join with a code."))}</p>
    <p class="sk-code" aria-label="${esc(t("Kitchen code {code}", { code: code.split("").join(" ") }))}">${esc(code)}</p>
    <p class="muted small sk-status" aria-live="polite">${esc(status)}</p>
    <div class="sk-live-btns">
      <button type="button" data-sync="copy">${ic("clipboard")} <span>${esc(t("Copy the code"))}</span></button>
      <button type="button" data-sync="qr">${ic("camera")} <span>${esc(t("Show a code to scan"))}</span></button>
      <button type="button" data-sync="now">${ic("swap")} <span>${esc(t("Sync now"))}</span></button>
      <button type="button" data-sync="leave">${ic("close")} <span>${esc(t("Stop sharing"))}</span></button>
    </div>
    <div id="skLiveQr" class="qr-box ${showQr ? "" : "hidden"}">${showQr ? syncQrHtml(code) : ""}</div>
    <p class="muted small">${esc(t("Keep the code inside your household. Anyone with it can see and change this kitchen."))}</p>`;
}
function syncQrHtml(code) {
  return QR.svg(joinLink(code), t("Code to join this shared kitchen")) + `<p class="qr-note">${esc(t("On the other phone, open the camera and point it at this code. Tap the link that pops up to join."))}</p>`;
}

function syncInit() {
  const page = $("#shareKitchenPage");
  if (page) page.addEventListener("click", async e => {
    const b = e.target.closest("[data-sync]"); if (!b) return;
    const a = b.dataset.sync;
    if (a === "start") startSharedKitchen();
    if (a === "join") {
      const v = await Ask.prompt({ title: t("Join a shared kitchen"), label: t("Kitchen code, like PP-K7QM-4XWD-9TRB"), yes: t("Join") });
      if (v) joinSharedKitchen(v);
    }
    if (a === "now") { const r = await kitchenSync(); if (r === "ok") toast(t("All synced.")); }
    if (a === "leave") leaveSharedKitchen();
    if (a === "copy") {
      try { await navigator.clipboard.writeText(settings.sync.code); toast(t("Copied the kitchen code.")); }
      catch (err) { Ask.copy({ title: t("Your kitchen code"), value: settings.sync.code }); }
    }
    if (a === "qr") { const q = $("#skLiveQr"); if (q.classList.contains("hidden")) { q.innerHTML = syncQrHtml(settings.sync.code); q.classList.remove("hidden"); } else q.classList.add("hidden"); }
  });
  if (page) new MutationObserver(() => { if (page.open) renderSyncCard(); }).observe(page, { attributes: true, attributeFilter: ["open"] });
  renderSyncCard();
  if (!syncEnabled()) return;
  // Sync when the app opens, comes back to the front, or gets back online, and every so often while it's open
  setTimeout(() => kitchenSync(), 1500);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kitchenSync(); });
  window.addEventListener("online", () => kitchenSync());
  setInterval(() => { if (!document.hidden) kitchenSync(); }, 45000);
}
