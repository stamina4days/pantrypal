"use strict";
/* The opening screen: Benji stocks the shelves while the recipes load, then it turns into a start menu,
   like a game. The first time, Benji asks what to call you. */
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
    if (tagline) tagline.textContent = t("Benji is waking up");
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
  /* The start menu. Resolves with what you picked: "start", "hats", "play", or "tour". */
  function menu() {
    const s = el(); if (!s) return Promise.resolve("start");
    clearInterval(lineTimer);
    document.documentElement.classList.remove("fast");
    s.classList.add("menu");
    s.setAttribute("role", "dialog");
    s.setAttribute("aria-modal", "true");
    s.setAttribute("aria-labelledby", "smTitle");
    s.removeAttribute("aria-live");
    const stage = s.querySelector(".splash-stage");
    const needName = !settings.named && !(settings.userName || "").trim();
    return new Promise(done => {
      const benji = (mood, pose) => palSVG(mood, 132, { pose });
      const showName = again => {
        s.classList.remove("shopfront");
        stage.innerHTML = `<div class="sm-benji">${benji("happy", "wave")}</div>
          <h1 class="splash-name" id="smTitle">Pantry Pal</h1>
          <form class="sm-card" id="smNameForm">
            <p class="sm-say">${esc(again ? t("Sure! What should I call you?")
              : t("Hi! I'm Benji. I help you save money by saving food. What should I call you?"))}</p>
            <label class="sr-only" for="smName">${esc(t("Your first name"))}</label>
            <input id="smName" autocomplete="given-name" maxlength="30" placeholder="${esc(t("Your first name"))}" value="${esc(settings.userName || "")}">
            <button type="submit" class="primary sm-go">${esc(t("Nice to meet you!"))}</button>
            ${again ? "" : `<button type="button" class="text-btn" id="smNoName">${esc(t("Skip for now"))}</button>
            <p class="sm-fine">${esc(t("By using Pantry Pal, you agree to its terms. Food dates are estimates, so always check food before you eat it. Read the full terms anytime in Settings."))}</p>`}
          </form>`;
        const f = stage.querySelector("#smNameForm");
        f.addEventListener("submit", e => {
          e.preventDefault();
          const v = stage.querySelector("#smName").value.trim();
          settings.named = true;
          if (v) settings.userName = v;
          saveSettings();
          if (typeof renderKitchenName === "function") renderKitchenName();
          if (typeof sfx === "function") sfx("cheer");
          if (again) return showMenu();
          stage.querySelector(".sm-card").innerHTML = `<p class="sm-say">${esc(v ? t("Nice to meet you, {name}! Let's save some money.", { name: v }) : t("No problem. Let's save some money!"))}</p>`;
          stage.querySelector(".sm-benji").innerHTML = benji("cheer", "cheer");
          setTimeout(() => done("start"), 1300);
        });
        const skip = stage.querySelector("#smNoName");
        if (skip) skip.addEventListener("click", () => { settings.named = true; saveSettings(); done("start"); });
        setTimeout(() => stage.querySelector("#smName").focus(), 60);
      };
      const showMenu = () => {
        const name = (settings.userName || "").trim();
        const hello = !settings.onboarded ? t("Ready when you are!")
          : name ? t("Welcome back, {name}!", { name }) : t("Welcome back!");
        // Benji's shop front: a glowing sign, Benji in the window behind crates of produce, and the menu as hanging signs
        const crate = foods => `<span class="sf-crate" aria-hidden="true">${foods.map(f => `<img src="img/food/${f}.svg" alt="">`).join("")}</span>`;
        s.classList.add("shopfront");
        stage.innerHTML = `<div class="sf-sign"><h1 class="splash-name" id="smTitle">Pantry Pal</h1></div>
          <div class="sf-window">
            <p class="sm-hello">${esc(hello)}</p>
            <div class="sm-benji">${benji("happy", "wave")}</div>
          </div>
          <div class="sf-counter">${crate(["apple", "carrot"])}${crate(["banana", "bread"])}</div>
          <div class="sm-menu">
            <button type="button" class="primary sm-go" data-sm="start">${esc(t("Start"))}</button>
            <button type="button" data-sm="hats"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/hat.svg#i"/></svg> ${esc(t("Benji's hats"))}</button>
            <button type="button" data-sm="play"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/game.svg#i"/></svg> ${esc(t("Play a game"))}</button>
            <button type="button" data-sm="tour"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/sparkle.svg#i"/></svg> ${esc(t("Take the tour"))}</button>
          </div>
          <button type="button" class="text-btn sm-rename" data-sm="name">${esc(name ? t("Not {name}? Change your name", { name }) : t("Tell Benji your name"))}</button>`;
        stage.querySelectorAll("[data-sm]").forEach(b => b.addEventListener("click", () => {
          const a = b.dataset.sm;
          if (a === "name") return showName(true);
          if (typeof sfx === "function") sfx("pop");
          done(a);
        }));
        setTimeout(() => { const g = stage.querySelector(".sm-go"); if (g) g.focus(); }, 60);
      };
      // Keep keyboard focus on the start screen
      s.addEventListener("keydown", e => {
        if (e.key !== "Tab") return;
        const f = [...s.querySelectorAll("button, input")];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      });
      needName ? showName(false) : showMenu();
    });
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
  return { start, progress, menu, finish, fail };
})();
