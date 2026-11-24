"use strict";
/* Hands-free cook mode: listens for "next", "back", "repeat", "timer", and "ingredients". */
function toggleVoice() {
  if (!cook) return;
  if (cook.listening) { cook.listening = false; try { cook.rec.stop(); } catch (e) {} renderCook(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(t("Voice commands aren't supported in this browser. Try Chrome on Android.")); return; }
  const rec = new SR();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = e => voiceCommand(e.results[e.results.length - 1][0].transcript);
  rec.onend = () => { if (cook && cook.listening) { try { rec.start(); } catch (e) {} } };
  rec.onerror = e => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { if (cook) cook.listening = false; toast(t("Microphone access was blocked.")); if (cook) renderCook(); } };
  try { rec.start(); } catch (e) { toast(t("Couldn't start the microphone.")); return; }
  cook.rec = rec; cook.listening = true;
  renderCook();
  toast(t("Listening. Say \"next\", \"back\", \"repeat\", \"timer\", or \"ingredients\"."));
}
function voiceCommand(raw) {
  if (!cook) return;
  const s = norm(raw);
  if (/ (next) /.test(s)) cookGo(1);
  else if (/ (back|previous) /.test(s)) cookGo(-1);
  else if (/ (repeat|again) /.test(s)) speak(rSteps(cook.r)[cook.idx]);
  else if (/ (timer) /.test(s)) { const m = stepMinutes(rSteps(cook.r)[cook.idx]); if (m) startTimer(rName(cook.r), m); else speak(t("This step doesn't have a time.")); }
  else if (/ (ingredient|ingredients) /.test(s)) speak(cook.r.ingredients.map(g => ingLabel(g, cook.f, cook.r)).join(". "));
}
