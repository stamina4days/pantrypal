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
/* "How does Benji work this out?" Plain answers for the dates and the money numbers, opened from the food page,
   the money tag on Today, and Waste Less. */
const keepText = days => days >= 365 ? tn(Math.round(days / 365), "about a year", "about {n} years")
  : days >= 60 ? tn(Math.round(days / 30), "about a month", "about {n} months") : tn(days, "about a day", "about {n} days");
const PRICE_PARA = "Every food gets a price. If you scanned a receipt, Benji uses what you paid. If not, he uses a typical US grocery store price for that amount of food.";
function explainDate(item) {
  const place = locIndex(item.location) === 2 ? "freezer" : locIndex(item.location) === 0 ? "fridge" : (item.location || "").toLowerCase() === "counter" ? "counter" : "pantry";
  const est = estimateShelf(item.name, item.location);
  const first = est
    ? t("{name} usually keeps {time} in the {place}, so that's Benji's guess when you add it. If you picked a date yourself, he uses yours.", { name: item.name.charAt(0).toUpperCase() + item.name.slice(1), time: keepText(est.days), place: t(place) })
    : t("Benji doesn't have a typical shelf life for {name}, so this is the date that was picked when it was added.", { name: item.name });
  return Ask.notice({ title: t("How Benji picks a date"), paras: [first,
    t("These times come from general food safety guidelines for food stored the usual way. Opening a package shortens it, so tap I opened it after you open one. Freezing switches to the much longer freezer time."),
    t("It's always an estimate. If the package date is different, tap Edit and change it, and check the food itself before you eat it.")] });
}
function explainMoney(kind) {
  const paras = kind === "saved" ? [t(PRICE_PARA),
    t("Saved from the trash adds up the price of every food you finished before its date passed. Food you toss doesn't count."),
    t("Foods Benji can't put a price on count as nothing, so your real savings are probably a bit higher.")]
    : [t(PRICE_PARA),
    t("Money at risk is his guess at how much could end up in the trash this week. Food close to its date counts more, and so does food your kitchen has thrown out before."),
    t("Cook it, freeze it, or plan it into a meal, and the number goes down.")];
  return Ask.notice({ title: t("How Benji counts money"), paras });
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-explain]"); if (!b) return;
  const k = b.dataset.explain;
  if (k === "date") { const i = items.find(x => x.id === itemPageId); if (i) explainDate(i); }
  else explainMoney(k);
});
/* Send feedback: opens an email to us, filled in with the details that help fix a problem */
const FEEDBACK_EMAIL = "signaftersix@gmail.com";
function feedbackMailto() {
  const ua = navigator.userAgent || "";
  const installed = window.matchMedia && matchMedia("(display-mode: standalone)").matches;
  const body = [
    t("What happened, or what's your idea?"), "", "", "",
    "----",
    t("These details help us fix things. You can delete them."),
    "Benji's Kitchen " + (typeof APP_VERSION !== "undefined" ? APP_VERSION : ""),
    "Phone and browser: " + ua,
    "Screen: " + screen.width + " x " + screen.height + ", window " + innerWidth + " x " + innerHeight,
    "Text size: " + (settings.textSize || "normal") + ", theme: " + (settings.kitchenTheme || "classic") + (installed ? ", on the home screen" : ", in the browser"),
    "Page: " + (location.hash || "#/today")
  ].join("\n");
  return "mailto:" + FEEDBACK_EMAIL + "?subject=" + encodeURIComponent(t("Benji's Kitchen feedback")) + "&body=" + encodeURIComponent(body);
}
function sendFeedback() { location.href = feedbackMailto(); }
const feedbackButton = () => `<button class="wide feedback-btn" type="button" data-feedback><svg class="ic" aria-hidden="true"><use href="img/icons/ui/mail.svg#i"/></svg> ${esc(t("Send feedback"))}</button>`;
function openHelp() {
  $("#helpBody").innerHTML = `<div class="feedback-card"><p><strong>${esc(t("Found a problem, or have an idea?"))}</strong> ${esc(t("Tell us. It opens an email to us with a few details about your phone filled in."))}</p>${feedbackButton()}</div>`
    + HELP.map(([title, paras]) => `<h3>${esc(t(title))}</h3>${paras.map(p => `<p>${esc(t(p))}</p>`).join("")}`).join("")
    + `<p><button class="wide" type="button" data-start-tour><svg class="ic" aria-hidden="true"><use href="img/icons/ui/signpost.svg#i"/></svg> ${esc(t("Take the tour"))}</button></p>`
    + `<p><button class="link-btn" id="resetHints">${esc(t("Show the tips again"))}</button></p>`;
  $("#helpDialog").showModal();
}
