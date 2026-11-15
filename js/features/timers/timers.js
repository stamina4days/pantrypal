"use strict";
/* Kitchen timers. */
/* ---------- timers ---------- */
let timers = [], timerTick = null, audioCtx = null;
function startTimer(label, minutes) {
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (e) {}
  timers.push({ id: uid(), label, end: Date.now() + minutes * 60000, done: false });
  if (!timerTick) timerTick = setInterval(tickTimers, 1000);
  renderTimers();
  toast(t("Timer started: {n} min", { n: minutes }));
}
function fmtLeft(ms) { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
function renderTimers() {
  const html = timers.map(tm => `<span class="timer ${tm.done ? "ring" : ""}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/timer.svg#i"/></svg> ${esc(tm.label)} <strong>${tm.done ? esc(t("Done!")) : fmtLeft(tm.end - Date.now())}</strong>
    <button class="timer-x" data-timerx="${tm.id}" aria-label="${esc(t("Stop timer"))}">&times;</button></span>`).join("");
  $$(".timer-slot").forEach(el => { el.innerHTML = html; el.classList.toggle("hidden", !timers.length); });
}
function tickTimers() {
  const now = Date.now();
  timers.forEach(tm => { if (!tm.done && now >= tm.end) { tm.done = true; alarm(tm); } });
  if (!timers.length) { clearInterval(timerTick); timerTick = null; }
  renderTimers();
}
function beep() {
  if (!audioCtx) return;
  [0, 0.35, 0.7].forEach(off => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime + off); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + off + 0.3);
    o.start(audioCtx.currentTime + off); o.stop(audioCtx.currentTime + off + 0.3);
  });
}
async function alarm(tm) {
  beep();
  if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
  speak(t("Timer done: {label}", { label: tm.label }));
  toast(t("Timer done: {label}", { label: tm.label }));
  try {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      const reg = await swReady(1000);
      if (reg) reg.showNotification("Pantry Pal", { body: t("Timer done: {label}", { label: tm.label }), icon: "img/icons/icon-192.png", tag: "timer-" + tm.id });
    }
  } catch (e) {}
}
