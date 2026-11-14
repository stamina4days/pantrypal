"use strict";
/* One-time tips and the help page. */
function renderHints() {
  settings.hints = settings.hints || {};
  $$(".hint-slot").forEach(el => {
    const id = el.dataset.hint;
    el.innerHTML = !settings.hints[id] && HINTS[id]
      ? `<div class="hint"><span>&#128161; ${esc(t(HINTS[id]))}</span><button class="link-btn" data-hint-ok="${id}">${esc(t("Got it"))}</button></div>` : "";
  });
}
function openHelp() {
  $("#helpBody").innerHTML = HELP.map(([title, paras]) => `<h3>${esc(t(title))}</h3>${paras.map(p => `<p>${esc(t(p))}</p>`).join("")}`).join("")
    + `<p><button class="link-btn" id="resetHints">${esc(t("Show the tips again"))}</button></p>`;
  $("#helpDialog").showModal();
}
