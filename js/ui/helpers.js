"use strict";
/* Small interface helpers. */
/* ---------- small UI helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  if (undoSnap) $("#undoBtn").onclick = () => { restore(undoSnap); el.classList.remove("show"); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), undoSnap ? 12000 : 7000);   // plenty of time to read, and to undo
}
const snapshot = () => JSON.stringify({ items, history, shopping, plan, cookedLog });
function restore(s) {
  const o = JSON.parse(s);
  ({ items, history, shopping, plan, cookedLog } = o);
  saveItems(); saveHistory(); saveShopping(); savePlan(); saveCooked(); renderAll();
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
