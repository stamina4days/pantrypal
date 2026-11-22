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
/* Send feedback: opens an email to us, filled in with the details that help fix a problem */
const FEEDBACK_EMAIL = "signaftersix@gmail.com";
function feedbackMailto() {
  const ua = navigator.userAgent || "";
  const installed = window.matchMedia && matchMedia("(display-mode: standalone)").matches;
  const body = [
    t("What happened, or what's your idea?"), "", "", "",
    "----",
    t("These details help us fix things. You can delete them."),
    "Pantry Pal " + (typeof APP_VERSION !== "undefined" ? APP_VERSION : ""),
    "Phone and browser: " + ua,
    "Screen: " + screen.width + " x " + screen.height + ", window " + innerWidth + " x " + innerHeight,
    "Text size: " + (settings.textSize || "normal") + ", theme: " + (settings.kitchenTheme || "classic") + (installed ? ", on the home screen" : ", in the browser"),
    "Page: " + (location.hash || "#/today")
  ].join("\n");
  return "mailto:" + FEEDBACK_EMAIL + "?subject=" + encodeURIComponent(t("Pantry Pal feedback")) + "&body=" + encodeURIComponent(body);
}
function sendFeedback() { location.href = feedbackMailto(); }
const feedbackButton = () => `<button class="wide feedback-btn" type="button" data-feedback><svg class="ic" aria-hidden="true"><use href="img/icons/ui/mail.svg#i"/></svg> ${esc(t("Send feedback"))}</button>`;
function openHelp() {
  $("#helpBody").innerHTML = `<div class="feedback-card"><p><strong>${esc(t("Found a problem, or have an idea?"))}</strong> ${esc(t("Tell us. It opens an email to us with a few details about your phone filled in."))}</p>${feedbackButton()}</div>`
    + HELP.map(([title, paras]) => `<h3>${esc(t(title))}</h3>${paras.map(p => `<p>${esc(t(p))}</p>`).join("")}`).join("")
    + `<p><button class="wide" type="button" data-start-tour><svg class="ic" aria-hidden="true"><use href="img/icons/ui/sparkle.svg#i"/></svg> ${esc(t("Take the tour"))}</button></p>`
    + `<p><button class="link-btn" id="resetHints">${esc(t("Show the tips again"))}</button></p>`;
  $("#helpDialog").showModal();
}
