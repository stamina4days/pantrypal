"use strict";
/* Cook mode: one step at a time in big text, with timers, read aloud, and voice commands. */
function openCookMode(r, f, fromRecipe) {
  cook = { r, f, idx: 0, fromRecipe, listening: false, rec: null };
  renderCook();
  renderHints();
  $("#cookDialog").showModal();
  if (typeof Motion !== "undefined") Motion.steam(r);
  keepAwake(true);
  if (settings.readAloud) speak(rSteps(r)[0]);
}
function renderCook() {
  const steps = rSteps(cook.r), s = steps[cook.idx];
  $("#cookTitle").textContent = rName(cook.r);
  $("#cookProgress").textContent = t("Step {a} of {b}", { a: cook.idx + 1, b: steps.length });
  $("#cookStep").textContent = s;
  $("#cookHelper").innerHTML = helperHtml(cook.r, cook.idx);
  const min = stepMinutes(s);
  $("#cookStepTimer").innerHTML = min ? `<button class="chip timer-btn big" data-timer="${min}" data-label="${esc(rName(cook.r))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/timer.svg#i"/></svg> ${esc(t("Start a {n} minute timer", { n: min }))}</button>` : "";
  $("#cookIngr").innerHTML = cook.r.ingredients.map(g => `<li>${esc(ingLabel(g, cook.f, cook.r))}${g.opt ? ` <span class="muted small">(${esc(t("optional"))})</span>` : ""}</li>`).join("");
  $("#cookPrev").disabled = cook.idx === 0;
  $("#cookNext").textContent = cook.idx === steps.length - 1 ? t("Finish") : t("Next");
  $("#cookRead").setAttribute("aria-pressed", !!settings.readAloud);
  $("#cookRead").classList.toggle("on", !!settings.readAloud);
  $("#cookVoice").setAttribute("aria-pressed", cook.listening);
  $("#cookVoice").classList.toggle("on", cook.listening);
}
function cookGo(delta) {
  const steps = rSteps(cook.r);
  if (delta > 0 && cook.idx === steps.length - 1) {
    const back = cook.fromRecipe;
    helperFinished(cook.r);
    closeCook();
    if (back && $("#recipeDialog").open) showCookedPanel();
    return;
  }
  cook.idx = Math.max(0, Math.min(steps.length - 1, cook.idx + delta));
  renderCook();
  if (settings.readAloud) speak(steps[cook.idx]);
}
function closeCook() {
  if (cook) { cook.listening = false; try { cook.rec && cook.rec.stop(); } catch (e) {} }
  try { speechSynthesis.cancel(); } catch (e) {}
  keepAwake(false);
  if ($("#cookDialog").open) $("#cookDialog").close();
  cook = null;
}
