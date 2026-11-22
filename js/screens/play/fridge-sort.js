"use strict";
/* Fridge Sort: ten quick cards. Most ask where a food keeps best. A few are your real food,
   and answering those keeps My Food accurate, so playing does the "still have it?" check for you. */
const SORT_ROUND = 10, SORT_REAL_MAX = 3;
const SORT_PLACES = [
  { id: "Fridge", label: "Fridge", icon: "fridge" },
  { id: "Shelf", label: "Counter or pantry", icon: "house" },
  { id: "Freezer", label: "Freezer", icon: "snow" }
];
let sortRound = null;

function playStats() { return settings.play || (settings.play = {}); }

function sortRealCards() {
  const today = todayStr();
  return items.filter(i => !i.leftover && !i.recipe)
    .map(i => ({ i, seen: i.verified || i.bought || i.added || today }))
    .filter(x => daysBetween(x.seen, today) >= 3)
    .sort((a, b) => (a.seen < b.seen ? -1 : 1))
    .slice(0, SORT_REAL_MAX).map(x => ({ real: true, item: x.i }));
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function openSort() {
  const real = sortRealCards();
  const quiz = shuffle(SORT_CARDS.slice()).slice(0, SORT_ROUND - real.length).map(([food, place, why]) => ({ real: false, food, place, why }));
  const cards = quiz.slice();
  real.forEach((c, k) => cards.splice(Math.min(cards.length, 2 + k * 3), 0, c));
  sortRound = { cards, i: 0, score: 0, right: 0, quizN: quiz.length, checks: 0, answer: null, changed: false };
  renderSort();
  if (!$("#sortPage").open) $("#sortPage").showModal();
}

function renderSort() {
  const r = sortRound, stage = $("#sortStage");
  $("#sortDots").innerHTML = r.cards.map((c, k) => `<span class="${k < r.i ? "done" : k === r.i ? "now" : ""}"></span>`).join("");
  $("#sortCount").textContent = r.i < r.cards.length ? t("Card {a} of {b}", { a: r.i + 1, b: r.cards.length }) : t("All done");
  $("#sortScore").textContent = tn(r.score, "1 point", "{n} points");
  if (r.i >= r.cards.length) { stage.innerHTML = sortEndHtml(); return; }
  const c = r.cards[r.i], a = r.answer;
  if (c.real) {
    const it = c.item, extra = hook("realAnswers", it);
    stage.innerHTML = `<div class="sort-card real">
      <span class="sort-tag">${esc(t("From your kitchen"))}</span>
      ${foodArt(it.name, it, "sort-art")}
      <h3>${esc(t("Is your {name} still in the {place}?", { name: it.name, place: locLabel(it.location).toLowerCase() }))}</h3>
      ${a ? `<p class="sort-why">${esc(hook("realAnswerText", a) || (a === "keep" ? t("Thanks! Benji checked it off.") : a === "used" ? t("Nice, that counts as used.") : t("Got it. It's off your list.")))}</p>
        <button class="primary sort-next" type="button" data-sort-next>${esc(t("Next card"))}</button>`
      : `<div class="sort-answers ${extra ? "five" : "three"}">
        <button type="button" data-real="keep"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg>${esc(extra ? t("All there") : t("Still have it"))}</button>
        ${extra}
        <button type="button" data-real="used"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/plate.svg#i"/></svg>${esc(t("Used it up"))}</button>
        <button type="button" data-real="wasted"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/trash.svg#i"/></svg>${esc(t("Tossed it"))}</button></div>`}
    </div>`;
    return;
  }
  const ok = a && a === c.place, best = SORT_PLACES.find(p => p.id === c.place);
  stage.innerHTML = `<div class="sort-card ${a ? (ok ? "right" : "wrong") : ""}">
    ${foodArt(c.food, null, "sort-art")}
    <h3>${esc(t(c.food))}</h3>
    <p class="sort-q">${esc(t("Where does it keep best?"))}</p>
    <div class="sort-answers">${SORT_PLACES.map(p => `<button type="button" data-place="${p.id}" ${a ? "disabled" : ""}
      class="${a && p.id === c.place ? "is-best" : ""} ${a && p.id === a && !ok ? "is-picked" : ""}">
      <svg class="ic" aria-hidden="true"><use href="img/icons/ui/${p.icon}.svg#i"/></svg>${esc(t(p.label))}</button>`).join("")}</div>
    ${a ? `<p class="sort-verdict">${esc(ok ? t("Right!") : t("Close! Best is the {place}.", { place: t(best.label).toLowerCase() }))}</p>
      <p class="sort-why">${esc(t(c.why))}</p>
      <button class="primary sort-next" type="button" data-sort-next>${esc(r.i === r.cards.length - 1 ? t("See how I did") : t("Next card"))}</button>` : ""}
  </div>`;
}

function sortEndHtml() {
  const r = sortRound, st = playStats();
  const stars = r.right >= r.quizN ? 3 : r.right >= Math.ceil(r.quizN * 0.7) ? 2 : r.right ? 1 : 0;
  const best = Math.max(st.sortBest || 0, r.score);
  return `<div class="sort-end">
    ${palBubble(stars >= 2 ? "proud" : "happy", stars === 3 ? t("A perfect round! You know your kitchen.") : stars === 2 ? t("Nice sorting! You really know where things go.") : t("Every round teaches Benji and you something new."), [], "pal-big")}
    <p class="sort-stars" aria-label="${esc(tn(stars, "1 star out of 3", "{n} stars out of 3"))}">${[0, 1, 2].map(k => `<svg class="ic ${k < stars ? "lit" : ""}" aria-hidden="true"><use href="img/icons/ui/star.svg#i"/></svg>`).join("")}</p>
    <p class="sort-result">${esc(t("{a} of {b} right", { a: r.right, b: r.quizN }))}</p>
    ${r.checks ? `<p class="sort-checks">${esc(tn(r.checks, "You checked 1 food in your kitchen, so your list is up to date.", "You checked {n} foods in your kitchen, so your list is up to date."))}</p>` : ""}
    ${hook("sortEnd", r)}
    <p class="muted">${esc(t("Best score: {n} points", { n: best }))}</p>
    <div class="row"><button type="button" data-sort-done>${esc(t("Done"))}</button><button class="primary" type="button" data-sort-again>${esc(t("Play again"))}</button></div>
  </div>`;
}

function sortFinish() {
  const r = sortRound, st = playStats();
  st.sortBest = Math.max(st.sortBest || 0, r.score);
  st.sortPlays = (st.sortPlays || 0) + 1;
  st.sortChecks = (st.sortChecks || 0) + r.checks;
  if (r.right >= r.quizN) st.sortPerfect = (st.sortPerfect || 0) + 1;
  saveSettings();
  checkNewBadges();
  sfx(r.right >= Math.ceil(r.quizN * 0.7) ? "cheer" : "ding");
  if (r.changed) renderAll();
  renderPlay();
}

function sortInit() {
  $("#sortStage").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || !sortRound) return;
    const r = sortRound, c = r.cards[r.i];
    if (b.dataset.place && !r.answer) {
      r.answer = b.dataset.place;
      if (r.answer === c.place) { r.right++; r.score += 10; sfx("pop"); buzz(8); } else { sfx("tick"); buzz([6, 40, 6]); }
      renderSort(); $("#sortStage .sort-next").focus(); return;
    }
    if (b.dataset.real && !r.answer) {
      r.answer = b.dataset.real; r.checks++; r.score += 10; r.changed = true;
      if (r.answer === "keep") { c.item.verified = todayStr(); saveItems(); sfx("pop"); }
      else if (ppHooks.realAnswer && ppHooks.realAnswer(r.answer, c.item)) { saveItems(); sfx("pop"); }
      else { removeItem(c.item, r.answer); saveItems(); }
      renderSort(); $("#sortStage .sort-next").focus(); return;
    }
    if (b.hasAttribute("data-sort-next")) {
      r.i++; r.answer = null;
      if (r.i >= r.cards.length) sortFinish();
      renderSort(); return;
    }
    if (b.hasAttribute("data-sort-again")) { openSort(); return; }
    if (b.hasAttribute("data-sort-done")) $("#sortPage").close();
  });
}
