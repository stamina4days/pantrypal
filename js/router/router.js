"use strict";
/* Page navigation. Every screen is a full page with its own address (like #/recipe/shakshuka),
   it slides in and out, and the phone's back button closes the page on top.

   How it works: each screen is a <dialog class="screen">. Opening one adds a history entry.
   Closing one from a button rewrites the current entry instead of going back, and any
   leftover entries that don't change anything are skipped when you press back. */
const Router = (() => {
  const stack = [];
  let ready = false;
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function routeFor(d) {
    const r = ROUTES[d.id];
    try { return typeof r === "function" ? r() : (r || d.id); } catch (e) { return d.id; }
  }
  function currentTab() {
    const a = document.querySelector(".tab.active");
    return a ? a.id.slice(4) : "today";
  }
  function url() {
    const top = stack[stack.length - 1];
    return "#/" + (top ? routeFor(top) : TAB_ROUTES[currentTab()]);
  }
  function state() { return { pp: 1, stack: stack.map(d => d.id), tab: currentTab() }; }
  function same(a, b) { return a && b && a.tab === b.tab && a.stack.join() === b.stack.join(); }
  function push() { if (ready) try { window.history.pushState(state(), "", url()); } catch (e) {} }
  function replace() { if (ready) try { window.history.replaceState(state(), "", url()); } catch (e) {} }

  function addBar(d) {
    if (!d.classList.contains("screen") || d.querySelector(".screen-bar")) return;
    const bar = document.createElement("div");
    bar.className = "screen-bar";
    bar.innerHTML = `<button type="button" class="back-btn" data-t-aria="Back" aria-label="Back"><span class="back-arrow"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/back.svg#i"/></svg></span><span data-t>Back</span></button>
      <span class="screen-crumb" aria-hidden="true"></span>`;
    d.prepend(bar);
    const art = d.dataset.art, h = d.querySelector("h2");
    if (art && h) (h.closest(".r-head") || h).insertAdjacentHTML("beforebegin", `<img class="screen-art" src="${art}" alt="">`);
    if (!d.querySelector(".timer-slot")) {
      const slot = document.createElement("div");
      slot.className = "timer-slot timer-bar hidden";
      slot.setAttribute("aria-live", "polite");
      bar.after(slot);
    }
    bar.querySelector(".back-btn").addEventListener("click", () => {
      const ev = new Event("cancel", { cancelable: true });
      d.dispatchEvent(ev);
      if (!ev.defaultPrevented) d.close();
    });
  }

  function wrap(d) {
    if (d._routed) return;
    d._routed = true;
    addBar(d);
    const nativeShow = d.showModal.bind(d), nativeClose = d.close.bind(d);
    let leaving = null;
    d.showModal = function () {
      if (leaving) {                       // reopened while sliding out: keep it
        clearTimeout(leaving); leaving = null;
        d.classList.remove("leaving");
        if (!stack.includes(d)) { stack.push(d); push(); }
        return;
      }
      if (d.open) { replace(); return; }
      nativeShow();
      d.classList.remove("leaving");
      if (!reduced() && ready) {
        d.classList.add("entering");
        setTimeout(() => d.classList.remove("entering"), 420);
      }
      stack.push(d);
      push();
      d.scrollTop = 0;
      const crumb = d.querySelector(".screen-crumb");
      if (crumb) crumb.textContent = crumbFor(d);
      if (typeof onScreenOpen === "function") onScreenOpen(d);
    };
    d.close = function (v) {
      if (!d.open || leaving) return;
      const i = stack.indexOf(d);
      if (i >= 0) { stack.splice(i, 1); replace(); }
      if (reduced() || !ready) { nativeClose(v); return; }
      d.classList.add("leaving");
      leaving = setTimeout(() => { leaving = null; d.classList.remove("leaving"); nativeClose(v); }, 230);
    };
    d.addEventListener("cancel", e => { e.preventDefault(); d.close(); });
    // A form with method="dialog" closes without our help, so keep the history in step.
    d.addEventListener("close", () => {
      const i = stack.indexOf(d);
      if (i >= 0) { stack.splice(i, 1); replace(); }
      const hook = SCREEN_CLOSE[d.id];
      if (hook) hook();
    });
  }

  function crumbFor(d) {
    const under = stack[stack.length - 2];
    if (under) { const h = under.querySelector("h2"); if (h && h.textContent.trim()) return h.textContent.trim(); }
    return t(TAB_TITLES[currentTab()] || "My Food");
  }

  /* Open whatever an address points at. Returns true if it found something. */
  function go(path, opts) {
    path = String(path || "").replace(/^#?\/?/, "");
    const tab = Object.keys(TAB_ROUTES).find(k => TAB_ROUTES[k] === path);
    if (tab) {
      [...stack].reverse().forEach(d => { stack.splice(stack.indexOf(d), 1); d.close(); });
      showTab(tab);
      return true;
    }
    for (const [re, open] of DEEP_LINKS) {
      const m = path.match(re);
      if (m) {
        try { if (open(m, opts) !== false) return true; } catch (e) { console.warn(e); }
      }
    }
    return false;
  }

  function onPop(e) {
    const s = e.state;
    if (!s || !s.pp) {                     // someone typed an address or tapped an old link
      const path = location.hash;
      try { window.history.replaceState(state(), "", url()); } catch (err) {}
      if (path && !go(path)) toast(t("That page moved. Here's your kitchen instead."));
      return;
    }
    if (same(s, state())) { window.history.back(); return; }
    [...stack].reverse().forEach(d => {
      if (!s.stack.includes(d.id)) { stack.splice(stack.indexOf(d), 1); d.close(); }
    });
    if (s.tab !== currentTab()) showTab(s.tab, true);
  }

  function prepare() { $$("dialog").forEach(wrap); }
  function start() {
    prepare();
    // Tap anywhere on a link like <a href="#/recipe/shakshuka"> to go there without a page load.
    document.addEventListener("click", e => {
      const a = e.target.closest && e.target.closest('a[href^="#/"]');
      if (!a) return;
      e.preventDefault();
      go(a.getAttribute("href"));
    });
    window.addEventListener("popstate", onPop);
    ready = true;
    const start = location.hash;
    try { window.history.replaceState(state(), "", url()); } catch (e) {}
    if (start && start.length > 2) go(start, { first: true });
  }

  return { prepare, start, go, wrap, tabChanged: replace, isOpen: id => stack.some(d => d.id === id), top: () => stack[stack.length - 1] || null };
})();
