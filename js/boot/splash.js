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
  /* Change this when the terms change, so everyone reads and agrees to them again */
  const TERMS_VERSION = "2026-11";
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
  /* Both downloads together: the bar fills with everything, the words name what's loading now. */
  function progressAll(done, total, what, part) {
    progress(part[0], part[1], what);
    const s = el(); if (!s) return;
    const pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
    const bar = s.querySelector(".splash-fill");
    if (bar) bar.style.width = pct + "%";
    const meter = s.querySelector(".splash-meter");
    if (meter) meter.setAttribute("aria-valuenow", String(pct));
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
    const wait = fast ? 0 : Math.max(0, 400 - (Date.now() - started));
    return new Promise(res => setTimeout(() => {
      clearInterval(lineTimer);
      s.classList.add("done");
      document.body.classList.remove("booting");
      setTimeout(() => { s.remove(); res(); }, fast ? 200 : 320);
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
    const needTerms = settings.termsAccepted !== TERMS_VERSION;
    const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    const focusFirst = sel => { if (!coarse) setTimeout(() => { const g = stage.querySelector(sel); if (g) g.focus(); }, 60); };
    return new Promise(done => {
      const benji = (mood, pose) => palSVG(mood, 132, { pose });
      // The shop front behind every start screen: the striped awning, the brick wall, and a sidewalk
      s.classList.add("shopfront");
      if (!s.querySelector(".sf-street")) s.insertAdjacentHTML("beforeend", `<div class="sf-street" aria-hidden="true"></div>`);
      const food = f => `<img src="img/food/${f}.svg" alt="">`;
      const crate = foods => `<span class="sf-crate" aria-hidden="true">${foods.map(food).join("")}</span>`;
      const shelf = (side, foods) => `<span class="sf-shelf sf-shelf-${side}" aria-hidden="true">${foods.map(food).join("")}</span>`;
      /* The marquee sign and the lit window with Benji behind the counter */
      const front = (hello, mood = "happy", pose = "wave") => `<div class="sf-sign"><h1 class="splash-name" id="smTitle">Pantry Pal</h1></div>
          <div class="sf-front">
            <div class="sf-window">
              <span class="sf-lamp" aria-hidden="true"></span>
              ${shelf("l", ["jar", "honey", "flour"])}${shelf("r", ["milk", "cheese", "egg"])}
              <p class="sm-hello">${esc(hello)}</p>
              <div class="sm-benji">${benji(mood, pose)}</div>
              <span class="sf-glass" aria-hidden="true"></span>
            </div>
            <div class="sf-counter">${crate(["apple", "carrot", "tomato"])}${crate(["banana", "bread", "lemon"])}</div>
          </div>`;
      /* "Play music while you cook?" asked once, so sound never starts by surprise. The tap on Yes starts the music. */
      const hasRadio = typeof Radio !== "undefined" && Radio.answer;
      const needMusic = () => hasRadio && !Radio.asked();
      const musicQ = (cls = "") => `<div class="sf-music ${cls}" role="group" aria-labelledby="smMusicQ">
          <p class="sf-music-q" id="smMusicQ"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/music.svg#i"/></svg> <span>${esc(t("Play music while you cook?"))}</span></p>
          <div class="sf-music-btns"><button type="button" class="sf-mbtn sf-yes" data-music="yes">${esc(t("Yes, play music"))}</button><button type="button" class="sf-mbtn" data-music="no">${esc(t("No thanks"))}</button></div>
        </div>`;
      const wireMusic = (box, after) => box.querySelectorAll("[data-music]").forEach(b => b.addEventListener("click", () => {
        const yes = b.dataset.music === "yes";
        Radio.answer(yes);
        if (typeof sfx === "function") sfx("pop");
        if (after) after(yes);
      }));
      /* First time screens: the shop front, with a paper notice taped up under the counter */
      const notice = (hello, inner, mood, pose) => {
        s.classList.add("sf-first");
        stage.innerHTML = front(hello, mood, pose) + inner;
      };
      /* The first time (and after the terms change): read the terms, tick the box, then go on */
      const showTerms = () => {
        let opened = false;
        notice(t("Welcome to my shop!"), `<form class="sf-form" id="smTermsForm"><div class="sf-paper">
            <h2 class="sf-paper-title">${esc(t("Before we open the doors"))}</h2>
            <p class="sf-paper-text">${esc(t("Benji guesses how long your food lasts, but he can't see or smell it. Always check the package date and the food itself before you eat it. Please read the terms, then tick the box to go on."))}</p>
            <ol class="sf-steps">
              <li class="sf-step" id="smStepRead"><span class="sf-num" aria-hidden="true">1</span>
                <button type="button" class="sm-terms-link" id="smTermsLink"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/clipboard.svg#i"/></svg> <span>${esc(t("Read the terms"))}</span></button></li>
              <li class="sf-step locked" id="smStepAgree"><span class="sf-num" aria-hidden="true">2</span>
                <label class="sm-check" id="smCheckRow"><input type="checkbox" id="smAgree" disabled><span>${esc(t("I've read and agree to the terms"))}</span></label></li>
            </ol>
            <p class="sr-only" id="smHint" aria-live="polite">${esc(t("Open the terms first, then you can tick the box."))}</p>
            </div>
            <div class="sm-menu sf-go-wrap">
              <button type="submit" class="primary sm-go" id="smAgreeGo" disabled><svg class="ic sf-lock" aria-hidden="true"><use href="img/icons/ui/lock.svg#i"/></svg> <span>${esc(t("Let's get started"))}</span></button>
            </div>
          </form>`, "happy", "wave");
        const f = stage.querySelector("#smTermsForm"), box = f.querySelector("#smAgree"), go = f.querySelector("#smAgreeGo"), hint = f.querySelector("#smHint");
        const update = () => {
          go.disabled = !(opened && box.checked);
          hint.textContent = !opened ? t("Open the terms first, then you can tick the box.") : box.checked ? "" : t("Now tick the box to go on.");
          const link = f.querySelector("#smTermsLink");
          link.classList.toggle("read", opened);
          f.querySelector("#smStepRead").classList.toggle("done", opened);
          f.querySelector("#smStepAgree").classList.toggle("locked", !opened);
          f.querySelector("#smStepAgree").classList.toggle("done", opened && box.checked);
          go.querySelector(".sf-lock").style.display = go.disabled ? "" : "none";
          if (opened && !link.querySelector(".sm-done")) link.insertAdjacentHTML("beforeend", `<svg class="ic sm-done" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg>`);
        };
        f.querySelector("#smTermsLink").addEventListener("click", () => {
          const pg = document.getElementById("termsPage");
          if (!pg || typeof openTerms !== "function") { opened = true; box.disabled = false; update(); return; }
          pg.addEventListener("close", () => { opened = true; box.disabled = false; update(); box.focus(); }, { once: true });
          openTerms();
        });
        box.addEventListener("change", update);
        f.addEventListener("submit", e => {
          e.preventDefault();
          if (!(opened && box.checked)) return;
          settings.termsAccepted = TERMS_VERSION;
          settings.termsAcceptedOn = new Date().toISOString().slice(0, 10);
          saveSettings();
          if (typeof sfx === "function") sfx("pop");
          needName ? showName(false) : showMenu();
        });
        focusFirst("#smTermsLink");
      };
      /* Leaving the first time screens: say hello, ask about music once, then open the app */
      const goIn = hello => {
        const gw = stage.querySelector(".sf-go-wrap"); if (gw) gw.remove();
        const paper = stage.querySelector(".sf-paper");
        stage.querySelector(".sm-benji").innerHTML = benji("cheer", "cheer");
        if (!needMusic()) {
          if (hasRadio) Radio.autoStart();
          paper.innerHTML = `<p class="sm-say sf-paper-text">${esc(hello)}</p>`;
          setTimeout(() => done("start"), 1300);
          return;
        }
        paper.innerHTML = `<p class="sm-say sf-paper-text">${esc(hello)}</p>${musicQ("on-paper")}`;
        wireMusic(paper, () => setTimeout(() => done("start"), 350));
        if (!coarse) setTimeout(() => { const y = paper.querySelector(".sf-yes"); if (y) y.focus(); }, 60);
      };
      const showName = again => {
        notice(again ? t("Sure! What should I call you?") : t("Hi! I'm Benji!"), `<form class="sf-form" id="smNameForm"><div class="sf-paper">
            <h2 class="sf-paper-title">${esc(again ? t("Your name") : t("Nice to meet you"))}</h2>
            <p class="sm-say sf-paper-text">${esc(again ? t("Sure! What should I call you?")
              : t("I help you save money by saving food. What should I call you?"))}</p>
            <label class="sr-only" for="smName">${esc(t("Your first name"))}</label>
            <input id="smName" autocomplete="given-name" maxlength="30" placeholder="${esc(t("Your first name"))}" value="${esc(settings.userName || "")}">
            ${again ? "" : `<button type="button" class="text-btn sf-skip" id="smNoName">${esc(t("Skip for now"))}</button>`}
            </div>
            <div class="sm-menu sf-go-wrap">
              <button type="submit" class="primary sm-go"><span>${esc(t("Nice to meet you!"))}</span></button>
            </div>
          </form>`, "happy", "wave");
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
          goIn(v ? t("Nice to meet you, {name}! Let's save some money.", { name: v }) : t("No problem. Let's save some money!"));
        });
        const skip = stage.querySelector("#smNoName");
        if (skip) skip.addEventListener("click", () => { settings.named = true; saveSettings(); goIn(t("No problem. Let's save some money!")); });
        setTimeout(() => stage.querySelector("#smName").focus(), 60);
      };
      const showMenu = () => {
        s.classList.remove("sf-first");
        const name = (settings.userName || "").trim();
        const hello = !settings.onboarded ? t("Ready when you are!")
          : name ? t("Welcome back, {name}!", { name }) : t("Welcome back!");
        const sign = (id, icon, label) => `<button type="button" class="sf-plank" data-sm="${id}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/${icon}.svg#i"/></svg> <span>${esc(label)}</span></button>`;
        // Benji's shop front: a marquee sign, Benji behind the counter in a lit window, and the menu as hanging signs
        stage.innerHTML = `${front(hello)}
          <div class="sm-menu">
            <button type="button" class="primary sm-go" data-sm="start"><span>${esc(t("Start"))}</span></button>
            <div class="sf-planks">
              ${sign("shop", "basket", t("Benji's shop"))}${sign("hats", "hat", t("Benji's hats"))}
              ${sign("play", "game", t("Play a game"))}${sign("tour", "sparkle", t("Take the tour"))}
            </div>
          </div>
          <button type="button" class="text-btn sm-rename" data-sm="name">${esc(name ? t("Not {name}? Change your name", { name }) : t("Tell Benji your name"))}</button>`;
        stage.querySelectorAll("[data-sm]").forEach(b => b.addEventListener("click", () => {
          const a = b.dataset.sm;
          if (a === "name") return showName(true);
          if (needMusic()) {
            // Never answered: the signs make way for a paper notice that asks once, then we go where they tapped
            if (typeof sfx === "function") sfx("pop");
            const menu = stage.querySelector(".sm-menu"), rn = stage.querySelector(".sm-rename");
            if (rn) rn.remove();
            menu.outerHTML = `<div class="sf-paper sf-ask">${musicQ()}<p class="sf-music-note">${esc(t("You can change this any time with the music button at the top."))}</p></div>`;
            const ask = stage.querySelector(".sf-ask");
            wireMusic(ask, () => setTimeout(() => done(a), 300));
            if (!coarse) setTimeout(() => { const y = ask.querySelector(".sf-yes"); if (y) y.focus(); }, 60);
            return;
          }
          if (typeof Radio !== "undefined" && Radio.autoStart) Radio.autoStart();   // music starts with this tap
          if (typeof sfx === "function") sfx("pop");
          done(a);
        }));
        focusFirst(".sm-go");
      };
      // Keep keyboard focus on the start screen
      s.addEventListener("keydown", e => {
        if (e.key !== "Tab") return;
        if (document.querySelector("dialog[open]")) return;
        const f = [...s.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      });
      needTerms ? showTerms() : needName ? showName(false) : showMenu();
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
  return { start, progress, progressAll, menu, finish, fail };
})();
