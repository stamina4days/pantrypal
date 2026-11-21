"use strict";
/* The opening screen: Pal stocks the shelves while the recipes load. */
const Splash = (() => {
  const LINES = [
    "Washing the lettuce...",
    "Lining up the recipes...",
    "Checking what's ripe...",
    "Sharpening the knives...",
    "Stacking the crates...",
    "Sniffing the milk..."
  ];
  let lineTimer = null, started = 0, lineIdx = 0;
  const el = () => document.getElementById("splash");

  function start() {
    const s = el(); if (!s) return;
    started = Date.now();
    s.setAttribute("lang", LANG);
    const tagline = s.querySelector(".splash-tag");
    if (tagline) tagline.textContent = t("Your fridge buddy is waking up");
    setLine();
    lineTimer = setInterval(setLine, 900);
  }
  function setLine() {
    const n = el() && el().querySelector(".splash-line");
    if (!n) return;
    n.textContent = t(LINES[lineIdx++ % LINES.length]);
  }
  function progress(done, total, what) {
    const s = el(); if (!s) return;
    const pct = total ? Math.round(done / total * 100) : 0;
    const bar = s.querySelector(".splash-fill");
    if (bar) bar.style.width = pct + "%";
    const meter = s.querySelector(".splash-meter");
    if (meter) meter.setAttribute("aria-valuenow", String(pct));
    const c = s.querySelector(".splash-count");
    if (c) c.textContent = what === "pages"
      ? t("Setting up {a} of {b} pages", { a: done, b: total })
      : t("{a} of {b} recipes on the shelf", { a: done, b: total });
  }
  /* Keep the splash up for a beat so it doesn't just flash, then slide it away. */
  function finish() {
    const s = el(); if (!s) return Promise.resolve();
    const fast = document.documentElement.classList.contains("fast");
    const wait = fast ? 0 : Math.max(0, 900 - (Date.now() - started));
    return new Promise(res => setTimeout(() => {
      clearInterval(lineTimer);
      s.classList.add("done");
      document.body.classList.remove("booting");
      setTimeout(() => { s.remove(); res(); }, fast ? 200 : 520);
      try { localStorage.setItem("pantrypal.fast", "1"); } catch (e) {}
    }, wait));
  }
  function fail(err) {
    clearInterval(lineTimer);
    const s = el(); if (!s) return;
    document.documentElement.classList.remove("fast");
    s.classList.add("failed");
    const n = s.querySelector(".splash-line");
    const fileHint = location.protocol === "file:"
      ? t("Pantry Pal needs to run from a web address, like your GitHub Pages site. Opening the file straight from your phone won't load the recipes.")
      : t("Check your connection and try again. Once it loads one time, it works offline.");
    const miss = String(err && err.message || "").startsWith("missing:") ? String(err.message).slice(8) : "";
    if (n) n.textContent = t("I couldn't unpack the groceries.") + " " + (miss
      ? t("This file is missing from the site: {file}. Check that every file and folder uploaded to GitHub.", { file: miss })
      : fileHint);
    const c = s.querySelector(".splash-count");
    if (c) c.innerHTML = `<button class="primary" onclick="location.reload()">${esc(t("Try again"))}</button>`;
    console.error(err);
  }
  return { start, progress, finish, fail };
})();
