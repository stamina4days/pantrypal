"use strict";
/* Small interface helpers. */
/* ---------- small UI helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/* Benji asks for one thing per visit at most (the tour, the home screen tip, the backup reminder, or his hats).
   The first one that wants to show claims the visit; it keeps showing on later redraws, the rest wait. */
let ppNudge = null;
function oneNudge(kind, wants) {
  if (ppNudge === kind) return !!wants;
  if (ppNudge || !wants) return false;
  ppNudge = kind; return true;
}
const tn = (n, one, many, v) => t(n === 1 ? one : many, Object.assign({ n }, v || {}));
/* Add-ons can plug into a few spots on the page. With none loaded, each spot adds nothing. */
const ppHooks = {};
const hook = (name, ...args) => (ppHooks[name] ? ppHooks[name](...args) : "") || "";

let toastTimer = null;
function toast(msg, undoSnap) {
  const el = $("#toast");
  // Over a full page, the message has to sit inside that page to be seen.
  const host = (typeof Router !== "undefined" && Router.top()) || document.body;
  if (el.parentNode !== host) host.appendChild(el);
  el.innerHTML = `<span>${esc(msg)}</span>` + (undoSnap ? `<button id="undoBtn">${esc(t("Undo"))}</button>` : "");
  el.classList.add("show");
  // Undo takes a snapshot() string, or a function that puts things back on its own
  if (undoSnap) $("#undoBtn").onclick = () => { if (typeof undoSnap === "function") undoSnap(); else restore(undoSnap); el.classList.remove("show"); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), undoSnap ? 12000 : 7000);   // plenty of time to read, and to undo
}
const snapshot = () => JSON.stringify({ items, history, shopping, plan, cookedLog });
function restore(s) {
  const o = JSON.parse(s);
  ({ items, history, shopping, plan, cookedLog } = o);
  saveItems(); saveHistory(); saveShopping(); savePlan(); saveCooked(); renderAll();
}
/* The whole kitchen, recipes and settings included, for undoing the big ones (emptying it, bringing back a copy). */
function wholeSnapshot() {
  const s = JSON.stringify({ items, history, shopping, plan, cookedLog, myRecipes, barcodes, settings });
  return () => {
    const o = JSON.parse(s);
    ({ items, history, shopping, plan, cookedLog, barcodes } = o);
    RECIPES.filter(r => r.mine).forEach(r => RECIPES.splice(RECIPES.indexOf(r), 1));
    myRecipes = o.myRecipes || []; myRecipes.forEach(addMineToRecipes);
    Object.keys(settings).forEach(k => delete settings[k]); Object.assign(settings, o.settings);
    saveItems(); saveHistory(); saveShopping(); saveBarcodes(); savePlan(); saveCooked(); saveMine(); saveSettings();
    if (typeof renderDietSummary === "function") renderDietSummary();
    renderAll(); toast(t("Everything's back."));
  };
}
function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
function setPressed(groupSel, btn) {
  $$(groupSel + " button").forEach(x => { x.classList.toggle("on", x === btn); x.setAttribute("aria-pressed", x === btn); });
}
function segment(id, attr, onPick) {
  $(id).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    setPressed(id, b);
    onPick(b.dataset[attr]);
  });
}
/* "milk", "milk and eggs", "milk, eggs, and bread" (with the serial comma). */
function listJoin(names) {
  const a = names.filter(Boolean);
  if (a.length <= 1) return a[0] || "";
  if (a.length === 2) return a[0] + " " + t("and") + " " + a[1];
  return a.slice(0, -1).join(", ") + ", " + t("and") + " " + a[a.length - 1];
}

/* Every tab is drawn as a scene that fills the phone screen between the header and the tabs.
   Keep --topbar-h and --tabbar-h up to date so the scenes can size themselves (see --scene-h in tokens.css). */
(function watchChrome() {
  const set = () => {
    const top = document.querySelector(".topbar"), bar = document.querySelector(".tabbar"), root = document.documentElement.style;
    if (top && top.offsetHeight) root.setProperty("--topbar-h", top.offsetHeight + "px");
    if (bar && bar.offsetHeight) root.setProperty("--tabbar-h", bar.offsetHeight + "px");
  };
  const start = () => {
    set();
    if ("ResizeObserver" in window) { const ro = new ResizeObserver(set); [".topbar", ".tabbar"].forEach(s => { const el = document.querySelector(s); if (el) ro.observe(el); }); }
    window.addEventListener("resize", set);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
