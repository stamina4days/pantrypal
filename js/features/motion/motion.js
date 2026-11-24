"use strict";
/* Motion: the moves that make the app feel alive.
   Benji looks at your taps, talks while his bubble fills in word by word, waves, hops, wrings his gloves, yawns, and his sprout grows.
   Food you use in time drops into the jar, a coin flips up for Benji to catch, groceries hop out of the bag and into the fridge,
   badges slam down, cook mode steams, the fridge door swings open, and the kitchen window shows the time of day and the season.
   With reduce motion turned on, every one of these has a calm version: things fade in and out, or simply change. */
const Motion = (() => {
  const calm = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const restart = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };
  const later = (fn, ms) => setTimeout(fn, ms);

  /* ---------- Benji talks: the bubble fills in word by word while his mouth moves ---------- */
  const heard = new Set();   // lines Benji already said this visit show up right away
  /* opts: { svg: the Benji who is talking, ms: time per word, force: say it even if he said it before } */
  function say(p, text, opts) {
    if (!p) return;
    const o = opts || {};
    text = text == null ? p.textContent : String(text);
    clearTimeout(p._typeTimer);
    const svg = o.svg || (p.closest(".pal-row") && p.closest(".pal-row").querySelector(".pal"));
    if (svg) svg.classList.remove("talking");
    if (calm() || !text || (heard.has(text) && !o.force)) { p.textContent = text; heard.add(text); return false; }
    heard.add(text);
    p.textContent = "";
    const spans = text.split(/(\s+)/).filter(Boolean).map(w => {
      const s = document.createElement("span");
      if (/\S/.test(w)) s.className = "mw";
      s.textContent = w; p.appendChild(s); return s;
    }).filter(s => s.className);
    if (svg) svg.classList.add("talking");
    let i = 0;
    const step = () => {
      if (i >= spans.length || !p.isConnected) { if (svg) svg.classList.remove("talking"); return; }
      spans[i++].classList.add("on");
      p._typeTimer = later(step, o.ms || Math.min(110, 50 + spans[i - 1].textContent.length * 9));
    };
    step();
    return spans.length;
  }

  /* The start screen: Benji waves and says hello, then waves again now and then */
  let greetTimer = null;
  function greet(svg, p) {
    clearInterval(greetTimer);
    if (!svg || !p) return;
    const words = say(p, null, { svg, ms: 380, force: true });
    if (!words || !svg.querySelector(".pal-wave")) return;
    // Keep waving for as long as he's talking
    const waves = Math.max(2, Math.ceil(words * 380 / 620));
    svg.style.setProperty("--wave-n", waves);
    restart(svg, "waving");
    later(() => svg.classList.remove("waving"), waves * 620 + 50);
    greetTimer = setInterval(() => {
      if (!svg.isConnected) { clearInterval(greetTimer); return; }
      if (document.hidden) return;
      svg.style.setProperty("--wave-n", 2);
      restart(svg, "waving");
      later(() => svg.classList.remove("waving"), 1300);
    }, 7000);
  }

  /* A new Benji on screen says his line and moves the way he feels. */
  function intro(row) {
    row.dataset.mo = "1";
    const p = row.querySelector(".bubble p"), svg = row.querySelector(".pal");
    const fresh = say(p);
    if (!svg || !fresh || calm()) return;
    if (svg.querySelector(".pal-wave") && !svg.classList.contains("pal-cheer")) restart(svg, "waving");
    else if (svg.classList.contains("pal-happy") || svg.classList.contains("pal-wink")) restart(svg, "hop");
    later(() => svg.classList.remove("waving", "hop"), 1600);
  }
  let introQueued = false;
  function scanRows() {
    introQueued = false;
    document.querySelectorAll(".pal-row:not([data-mo])").forEach(intro);
    afterToday();
  }

  /* Benji's eyes look toward wherever you tap. */
  function lookAt(x, y) {
    if (calm()) return;
    document.querySelectorAll(".pal .pal-eyes").forEach(g => {
      const svg = g.ownerSVGElement, r = svg.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
      const cx = r.left + r.width * .48, cy = r.top + r.height * .55;
      const dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, len / 120) * 4;
      g.style.transform = `translate(${(dx / len * k).toFixed(1)}px, ${(dy / len * k).toFixed(1)}px)`;
      clearTimeout(g._look);
      g._look = later(() => { g.style.transform = ""; }, 1800);
    });
  }

  /* Benji's sprout grows at $10, $50, and $100 saved. The first time he is seen bigger, the new leaves unfurl. */
  function checkSprout() {
    if (typeof benjiSprout !== "function" || typeof settings === "undefined") return;
    const stage = benjiSprout();
    if (settings.sproutSeen == null) { settings.sproutSeen = stage; saveSettings(); return; }
    if (stage <= settings.sproutSeen) { if (stage < settings.sproutSeen) { settings.sproutSeen = stage; saveSettings(); } return; }
    const old = document.querySelector("#tab-today.active #alerts .pal");
    if (!old) return;
    settings.sproutSeen = stage; saveSettings();
    // Hats come off for a moment so you can see the sprout grow
    const mood = ((old.getAttribute("class") || "").match(/pal-(\w+)/) || [])[1] || "happy";
    const box = document.createElement("span");
    box.innerHTML = palSVG(mood, 72, { outfit: false, wear: false });
    const svg = box.firstElementChild;
    old.replaceWith(svg);
    restart(svg, "grow" + stage);
    later(() => { svg.classList.remove("grow" + stage); if (typeof renderToday === "function" && svg.isConnected) renderToday(); }, 4200);
    const row = svg.closest(".pal-row");
    if (row && typeof palSay === "function") {
      later(() => palSay(row, stage >= 3 ? t("Look, my sprout bloomed! That's $100 of food you didn't throw away.")
        : stage === 2 ? t("My sprout grew new leaves! You've saved $50 of food.") : t("My sprout is growing! You've saved $10 of food.")), 900);
    }
    if (typeof sfx === "function") sfx("cheer");
  }

  /* ---------- the jar on Today: food you used in time drops in with a splash ---------- */
  const jarQueue = [];
  function jar(item) { if (item && jarQueue.length < 3) jarQueue.push(item); }
  function afterToday() {
    if (!jarQueue.length) return;
    const tab = document.getElementById("tab-today"), j = document.getElementById("todayJar");
    if (!tab || !tab.classList.contains("active") || !j || (typeof Router !== "undefined" && Router.top())) return;
    const glass = j.querySelector(".k-glass"); if (!glass) return;
    const list = jarQueue.splice(0);
    const r = glass.getBoundingClientRect();
    if (!r.width) return;
    if (calm()) { restart(glass, "jar-glow"); return; }
    list.forEach((it, i) => later(() => {
      const f = document.createElement("div");
      f.className = "jar-drop";
      f.setAttribute("aria-hidden", "true");
      const z = typeof ppZoom === "function" ? ppZoom() : 1;
      f.style.left = ((r.left + r.width / 2) / z - 18) + "px";
      f.style.top = (r.top / z - 70) + "px";
      f.innerHTML = foodArt(it.name, it, "jar-food") + `<span class="jar-splash"><i></i><i></i><i></i><i></i></span>`;
      document.body.appendChild(f);
      later(() => { restart(glass, "jar-wobble"); if (typeof sfx === "function") sfx("pop"); }, 520);
      later(() => f.remove(), 1300);
    }, 250 + i * 450));
  }

  /* ---------- a coin flips up and Benji catches it ---------- */
  function coinHtml() {
    return `<div class="coin-catch" aria-hidden="true"><span class="cc-coin"><span>$</span></span>
      <span class="cc-benji cc-wait">${palSVG("cheer", 64, { pose: "cheer" })}</span><span class="cc-benji cc-got">${palSVG("proud", 64, { pose: "hold" })}</span></div>`;
  }

  /* ---------- groceries hop out of the bag and into the fridge ---------- */
  function unpack(names) {
    names = (names || []).filter(Boolean);
    if (!names.length || typeof momentLayer !== "function") return;
    const show = names.slice(0, 6), n = show.length;
    const el = momentLayer();
    el.innerHTML = `<div class="unpack${calm() ? " calm" : ""}">
      <span class="up-fridge"><span class="up-freezer"></span><span class="up-door"></span></span>
      ${show.map((nm, i) => `<span class="up-food" style="--i:${i};--bx:${Math.round((i - (n - 1) / 2) * 38)}px">${foodArt(nm, null, "up-art")}</span>`).join("")}
      <span class="up-bag"><span class="up-bag-top"></span></span>
    </div>`;
    clearTimeout(momentTimer);
    momentTimer = later(() => { el.innerHTML = ""; }, 1700 + n * 180);
  }

  /* ---------- a badge slams down with a puff of dust ---------- */
  function badge(b, tries) {
    if (!b || typeof momentLayer !== "function") return;
    const el = momentLayer();
    // Wait for a stamp or the groceries to finish first
    if (el.innerHTML.trim() && (tries || 0) < 3) { later(() => badge(b, (tries || 0) + 1), 1200); return; }
    el.innerHTML = `<div class="moment-box"><div class="badge-slam${calm() ? " calm" : ""}">
      <span class="bs-ribbon"></span><span class="bs-medal"><svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFE27A" stroke="#4A3200" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span class="bs-name">${esc(t(b.name))}</span></span>
      <span class="bs-dust"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div></div>`;
    clearTimeout(momentTimer);
    momentTimer = later(() => { el.innerHTML = ""; }, 2300);
  }

  /* ---------- cook mode: steam rises off the dish ---------- */
  function steam(r) {
    const head = document.querySelector("#cookDialog .r-head");
    if (!head || !r) return;
    let s = head.querySelector(".cook-steam");
    if (!s) { s = document.createElement("span"); s.className = "cook-steam"; s.setAttribute("aria-hidden", "true"); head.insertBefore(s, head.firstChild); }
    s.innerHTML = `<i></i><i></i><i></i>${recipeArt(r, "cs-dish")}`;
    restart(s, "go");
  }

  /* ---------- the fridge door swings open before My Food slides in ---------- */
  function fridge(then) {
    const f = document.getElementById("todayFridge");
    if (!f || calm()) { then(); return; }
    restart(f, "opening");
    if (typeof sfx === "function") sfx("pop");
    later(() => { then(); f.classList.remove("opening"); }, 420);
  }

  /* ---------- the plan: days turn like calendar pages ---------- */
  function planShown() {
    const w = document.getElementById("planWeek");
    if (!w || calm()) return;
    restart(w, "turning");
    clearTimeout(w._turn);
    w._turn = later(() => w.classList.remove("turning"), 1100);
  }
  function turnPage(page) {
    if (!page) return;
    restart(page, calm() ? "flash" : "turn");
  }

  /* ---------- the kitchen window and clock: the time of day, the season, the weather ---------- */
  // Seasons are flipped south of the equator. The time zone is the only hint we have without asking for location.
  function southern() {
    try { return /^(Australia|Pacific\/Auckland|America\/(Sao_Paulo|Argentina|Santiago|Montevideo|Asuncion)|Africa\/Johannesburg)/.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ""); } catch (e) { return false; }
  }
  function season(d) {
    let m = d.getMonth();
    if (southern()) m = (m + 6) % 12;
    return m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "fall";
  }
  function weather(d) {
    // The same weather all day, picked from the date
    const key = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    const roll = ((key * 9301 + 49297) % 233280) / 233280;
    const s = season(d);
    if (s === "winter") return roll < .6 ? "snow" : roll < .8 ? "clouds" : "clear";
    if (s === "spring") return roll < .35 ? "rain" : roll < .7 ? "petals" : "clear";
    if (s === "summer") return roll < .2 ? "rain" : roll < .5 ? "clouds" : "clear";
    return roll < .3 ? "rain" : roll < .85 ? "leaves" : "clouds";
  }
  function partOfDay(h) { return h >= 5 && h < 10 ? "morning" : h >= 10 && h < 17 ? "day" : h >= 17 && h < 20 ? "evening" : "night"; }
  let kitchenTimer = null, wxNow = "";
  function buildKitchen() {
    const room = document.querySelector("#tab-today .k-room");
    if (!room || room.querySelector(".k-window")) return;
    room.insertAdjacentHTML("beforeend", `<span class="k-window" aria-hidden="true"><span class="k-sky"><span class="k-stars"></span><span class="k-sun"></span><span class="k-wx"></span></span><span class="k-frame"></span><span class="k-sill"></span></span>
      <span class="k-beam" aria-hidden="true"></span>`);
    const fz = room.querySelector(".k-freezer");
    if (fz) fz.innerHTML = `<span class="k-clock"><span class="k-hand kh-h"></span><span class="k-hand kh-m"></span><span class="k-hand kh-s"></span><span class="k-pin"></span></span>`;
  }
  function tickKitchen() {
    const kit = document.querySelector("#tab-today .kitchen");
    if (!kit) return;
    buildKitchen();
    const d = new Date(), h = d.getHours(), m = d.getMinutes();
    const part = partOfDay(h);
    ["morning", "day", "evening", "night"].forEach(p => kit.classList.toggle("k-t-" + p, p === part));
    const hand = (sel, deg) => { const el = kit.querySelector(sel); if (el) el.style.transform = `rotate(${deg}deg)`; };
    hand(".kh-h", (h % 12) * 30 + m / 2);
    hand(".kh-m", m * 6);
    const sEl = kit.querySelector(".kh-s"); if (sEl) sEl.style.animationDelay = `-${d.getSeconds()}s`;
    // The sun climbs from morning to noon and sets in the evening; the light through the window leans with it
    const t24 = h + m / 60;
    const sunUp = Math.max(0, Math.min(1, 1 - Math.abs(t24 - 13) / 7));
    kit.style.setProperty("--sun-y", Math.round(70 - sunUp * 55) + "%");
    kit.style.setProperty("--sun-x", Math.round(15 + Math.max(0, Math.min(1, (t24 - 6) / 14)) * 70) + "%");
    kit.style.setProperty("--beam-skew", Math.round((t24 - 13) * 4) + "deg");
    const wx = weather(d);
    if (wx !== wxNow) {
      wxNow = wx;
      const box = kit.querySelector(".k-wx");
      if (box) {
        const count = { snow: 9, rain: 10, leaves: 4, petals: 5, clouds: 2, clear: 0 }[wx];
        box.className = "k-wx wx-" + wx;
        box.innerHTML = Array.from({ length: count }, (_, i) => `<i style="--n:${i};--x:${(i * 37 + 7) % 100}%;--d:${(i * 0.53) % 3}s"></i>`).join("");
      }
      kit.classList.toggle("k-wet", wx === "rain");
    }
    fitKitchen();
  }
  /* The window only hangs where there's room for it */
  function fitKitchen() {
    const kit = document.querySelector("#tab-today .kitchen");
    if (!kit) return;
    const win = kit.querySelector(".k-window");
    if (!win) return;
    win.classList.remove("k-hide");
    const wr = win.getBoundingClientRect();
    if (!wr.width) return;
    const label = kit.querySelector(".k-console-label"), cook = kit.querySelector(".k-cancook");
    const lr = label && label.getBoundingClientRect(), cr = cook && cook.getBoundingClientRect();
    if ((lr && wr.bottom > lr.top - 4) || (cr && wr.top < cr.bottom)) win.classList.add("k-hide");
  }

  function init() {
    // Watch for Benji showing up anywhere, and look at it once per frame
    new MutationObserver(() => { if (!introQueued) { introQueued = true; requestAnimationFrame(scanRows); } })
      .observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointerdown", e => lookAt(e.clientX, e.clientY), { passive: true });
    // When a page closes over Today, anything waiting for the jar drops in
    document.addEventListener("close", () => later(afterToday, 300), true);
    tickKitchen();
    kitchenTimer = setInterval(() => { if (!document.hidden) tickKitchen(); }, 30000);
    addEventListener("resize", () => requestAnimationFrame(fitKitchen));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tickKitchen(); });
  }

  return { init, say, greet, jar, afterToday, coinHtml, unpack, badge, steam, fridge, planShown, turnPage, checkSprout, tickKitchen, fitKitchen, calm };
})();
