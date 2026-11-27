"use strict";
/* A short guided tour of Today: what Benji's Kitchen is for and where things are. Benji points at each part of
   the screen in turn. Runs once after first-time setup (or every visit, if that's turned on in Settings).
   Also anytime from the start screen, Help, Settings, or Search. */

const TOUR_STEPS = [
  { mood: "wave", title: "Hi, I'm Benji!",
    text: "Benji's Kitchen helps you save money by saving food. It keeps track of what you bought, tells you what to eat first, and finds recipes that use it up. Every bit of food you don't throw away is money you keep." },
  { target: ".today-add", pose: "point", title: "Add your groceries",
    text: "Start here when you get home from the store. Type what you bought or scan a barcode, and I'll guess when each food goes bad." },
  { target: "#todayFridge", pose: "point", title: "Eat these first",
    text: "The magnets on my fridge are the foods to eat soonest, with how long each one has. Tap one to see it, or tap the note for all your food." },
  { target: "#todayCanCook", pose: "point", title: "What can I cook?",
    text: "Tap here any time you're hungry. I'll show you what you can make with the food you already have, no shopping needed." },
  { target: "#todaySpecial", pose: "point", title: "Dinner ideas",
    text: "The chalkboard has tonight's pick. Not sure what to make? I pick recipes that use what you already have, starting with whatever is about to go bad." },
  { target: "#tabbtn-plan", pose: "point", title: "Plan and shop",
    text: "Plan your whole week in one tap, then get a shopping list with only what you're missing, so you buy less." },
  { target: "#todayJar", pose: "point", title: "Watch your savings grow",
    text: "Every food you finish in time goes in the jar on my shelf. My sprout grows as the money you save adds up." },
  { target: "#todayPlayBtn", pose: "point", title: "Got a minute?",
    text: "Tap the game on my counter to play quick games. Some of them also check what's still in your kitchen, and winning them gets me new hats." },
  { target: "#todayHatsBtn", pose: "point", title: "Dress me up",
    text: "Tap the hat on the peg to open my hat closet. Earn badges and win games to unlock new hats, then pick the one I wear." },
  { mood: "cheer", title: "You're all set!",
    text: "Tap me anytime to say hi. Now let's go save some money!" }
];
let tour = null;

function tourTarget(step) {
  if (!step.target) return null;
  const el = $(step.target);
  if (!el || el.closest(".hidden")) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? el : null;
}

function startTour() {
  if (tour) return;
  $$("dialog[open]").forEach(d => d.close());
  if (typeof Router !== "undefined" && Router.go) Router.go("today"); else showTab("today");
  const steps = TOUR_STEPS.filter((s, k) => k === 0 || k === TOUR_STEPS.length - 1 || s.target);
  const box = document.createElement("div");
  box.id = "tour";
  box.className = "tour";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "tourTitle");
  box.innerHTML = `<div class="tour-hole" aria-hidden="true"></div><div class="tour-card"></div>`;
  document.body.appendChild(box);
  document.body.classList.add("touring");
  tour = { steps, i: 0, box, back: document.activeElement };
  window.scrollTo(0, 0);
  setTimeout(() => {
    if (!tour) return;
    tour.steps = tour.steps.filter((s, k) => !s.target || tourTarget(s));   // only the parts showing right now
    renderTour();
  }, 60);
  window.addEventListener("resize", renderTour);
}

function renderTour() {
  if (!tour) return;
  // Skip steps whose part of the screen isn't showing right now (like the cook button with nothing expiring)
  while (tour.i > 0 && tour.i < tour.steps.length - 1 && !tourTarget(tour.steps[tour.i])) tour.i += tour.dir || 1;
  const step = tour.steps[tour.i], el = tourTarget(step), n = tour.steps.length;
  const hole = $(".tour-hole", tour.box), card = $(".tour-card", tour.box);
  const last = tour.i === n - 1, first = tour.i === 0;
  card.innerHTML = `<div class="tour-top">${palSVG(step.mood && step.mood !== "wave" ? step.mood : "happy", 70, { pose: step.pose || (step.mood === "cheer" ? "cheer" : "wave") })}
      <div class="tour-words"><h2 id="tourTitle">${esc(t(step.title))}</h2><p>${esc(palYou(t(step.text)))}</p></div></div>
    <div class="tour-foot">
      <span class="tour-dots" aria-label="${esc(t("Step {a} of {b}", { a: tour.i + 1, b: n }))}">${tour.steps.map((s, k) => `<i class="${k === tour.i ? "on" : ""}"></i>`).join("")}</span>
      ${last ? "" : `<button type="button" class="text-btn" data-tour="skip">${esc(t("Skip"))}</button>`}
      ${first || last ? "" : `<button type="button" data-tour="back">${esc(t("Back"))}</button>`}
      <button type="button" class="primary" data-tour="next">${esc(last ? t("Let's go") : first ? t("Show me around") : t("Next"))}</button>
    </div>
    <p class="tour-where small">${esc(t("You can always find the tour in Help, in Settings, or on the start screen."))}</p>`;
  if (el) {
    // On big screens the page is zoomed: measure in the page's own pixels
    const z = typeof ppZoom === "function" ? ppZoom() : 1, vh = innerHeight / z;
    const b0 = el.getBoundingClientRect(), r = { left: b0.left / z, top: b0.top / z, width: b0.width / z, height: b0.height / z, bottom: b0.bottom / z }, pad = 6;
    Object.assign(hole.style, { display: "block", left: (r.left - pad) + "px", top: (r.top - pad) + "px", width: (r.width + pad * 2) + "px", height: (r.height + pad * 2) + "px" });
    const below = r.top + r.height / 2 < vh / 2;
    card.classList.toggle("tour-below", below);
    card.classList.toggle("tour-above", !below);
    card.style.top = below ? Math.min(r.bottom + 16, vh - card.offsetHeight - 12) + "px" : "";
    card.style.bottom = below ? "" : Math.max(vh - r.top + 16, 12) + "px";
    if (!below && vh - (vh - r.top + 16) - card.offsetHeight < 8) { card.style.bottom = ""; card.style.top = "12px"; }
  } else {
    hole.style.display = "none";
    card.classList.remove("tour-below", "tour-above");
    card.style.top = ""; card.style.bottom = "";
  }
  card.classList.toggle("tour-center", !el);
  tour.box.classList.toggle("tour-dim", !el);
  const next = $('[data-tour="next"]', card);
  if (next) next.focus();
}

function endTour() {
  if (!tour) return;
  window.removeEventListener("resize", renderTour);
  tour.box.remove();
  document.body.classList.remove("touring");
  const back = tour.back;
  tour = null;
  settings.toured = true;
  saveSettings();
  if (back && back.focus && document.contains(back)) back.focus();
}

function tourInit() {
  document.addEventListener("change", e => {
    if (!e.target.matches("#tourAutoToggle")) return;
    settings.tourEveryVisit = e.target.checked;
    saveSettings();
  });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-tour]");
    if (b && tour) {
      const a = b.dataset.tour;
      if (a === "skip") return endTour();
      if (a === "next") { if (tour.i >= tour.steps.length - 1) { sfx("cheer"); return endTour(); } tour.i++; tour.dir = 1; sfx("tick"); }
      if (a === "back") { tour.i = Math.max(0, tour.i - 1); tour.dir = -1; }
      renderTour();
      return;
    }
    if (e.target.closest("[data-start-tour]")) startTour();
  });
  document.addEventListener("keydown", e => {
    if (!tour) return;
    if (e.key === "Escape") { e.preventDefault(); endTour(); }
    if (e.key === "Tab") {   // keep keyboard focus inside the tour card
      const f = $$("button", tour.box);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  // New here? The tour starts when first-time setup closes.
  // If they went straight into the pantry audit, it waits until the audit closes.
  let pending = false;
  const maybeStart = () => setTimeout(() => {
    if (!pending || tour) return;
    if ($$("dialog[open]").length) return;
    pending = false;
    startTour();
  }, 450);
  $("#onboardDialog").addEventListener("close", () => {
    if (ob && ob.mode === "first" && !settings.toured) { pending = true; maybeStart(); }
  });
  $("#auditDialog").addEventListener("close", maybeStart);
}
