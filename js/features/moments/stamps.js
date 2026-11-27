"use strict";
/* Big moments you can feel: a RESCUED stamp thunks down, a tossed price tag tears in half. */
let momentTimer = null;
function momentLayer() {
  let el = document.getElementById("moment");
  if (!el) { el = document.createElement("div"); el.id = "moment"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
  // Over an open page, the layer has to live in the page so it shows above it.
  const top = typeof Router !== "undefined" && Router.top();
  const host = top || document.body;
  if (el.parentNode !== host) host.appendChild(el);
  return el;
}
function reducedMotion() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }

function stampMoment(kind) {
  const words = { rescued: t("Rescued!"), used: t("All gone!"), saved: t("Saved!") };
  sfx(kind === "rescued" ? "thunk" : "pop");
  buzz(kind === "rescued" ? [12, 40, 24] : 10);
  if (kind === "rescued") palDance();
  const el = momentLayer();
  // Saving food saves money: a coin flips up and Benji catches it (a calm fade with reduce motion)
  el.innerHTML = `<div class="moment-box${reducedMotion() ? " calm" : ""}"><div class="stamp stamp-${kind}"><span>${esc(words[kind] || words.used)}</span></div>
    ${kind !== "saved" && typeof Motion !== "undefined" ? Motion.coinHtml() : ""}<p class="moment-say">${esc((kind === "rescued" && typeof hatRescueLine === "function" && hatRescueLine()) || palPick(kind === "rescued" ? "rescue" : "used"))}</p></div>`;
  clearTimeout(momentTimer);
  momentTimer = setTimeout(() => { el.innerHTML = ""; }, 2400);
}

function tearMoment(name) {
  sfx("rip"); buzz([6, 30, 6]);
  const el = momentLayer();
  const half = side => `<div class="tear-half ${side}"><span class="tear-hole"></span><span class="tear-name">${esc(name)}</span></div>`;
  el.innerHTML = `<div class="moment-box${reducedMotion() ? " calm" : ""}"><div class="tear">${half("l")}${half("r")}<span class="tear-bits"><i></i><i></i><i></i><i></i></span></div><p class="moment-say">${esc(palPick("tossed"))}</p></div>`;
  clearTimeout(momentTimer);
  momentTimer = setTimeout(() => { el.innerHTML = ""; }, 2000);
}

/* Called whenever food leaves My Food. Several at once (like after cooking) only celebrate once. */
let momentQueue = null;
function foodMoment(item, outcome, d) {
  if (!outcome) return;
  const kind = outcome === "wasted" ? "tossed" : d !== null && d >= 0 && d <= 3 ? "rescued" : "used";
  if (kind === "rescued" && typeof hatRescued === "function") hatRescued();
  // Used in time: it drops into the jar on Today
  if (kind !== "tossed" && (d === null || d >= 0) && typeof Motion !== "undefined") Motion.jar(item);
  if (!momentQueue) {
    momentQueue = { kind, name: item.name };
    setTimeout(() => {
      const q = momentQueue; momentQueue = null;
      if (q.kind === "tossed") tearMoment(q.name);
      else { stampMoment(q.kind); }
    }, 60);
  } else if (kind === "rescued") momentQueue.kind = "rescued";
}
