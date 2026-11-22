"use strict";
/* One-time tips and the help page. */
function renderHints() {
  settings.hints = settings.hints || {};
  $$(".hint-slot").forEach(el => {
    const id = el.dataset.hint;
    el.innerHTML = !settings.hints[id] && HINTS[id]
      ? `<div class="hint"><span><svg class="ic" aria-hidden="true"><use href="img/icons/ui/bulb.svg#i"/></svg> ${esc(t(HINTS[id]))}</span><button class="link-btn" data-hint-ok="${id}">${esc(t("Got it"))}</button></div>` : "";
  });
}
function openHelp() {
  $("#helpBody").innerHTML = HELP.map(([title, paras]) => `<h3>${esc(t(title))}</h3>${paras.map(p => `<p>${esc(t(p))}</p>`).join("")}`).join("")
    + `<p><button class="wide" type="button" data-start-tour><svg class="ic" aria-hidden="true"><use href="img/icons/ui/sparkle.svg#i"/></svg> ${esc(t("Take the tour"))}</button></p>`
    + `<p><button class="link-btn" id="resetHints">${esc(t("Show the tips again"))}</button></p>`;
  $("#helpDialog").showModal();
}
