"use strict";
/* What this phone supports. */
/* ---------- what this phone supports ---------- */
async function runDiagnostics() {
  const rows = [];
  const add = (label, ok, note) => rows.push({ label, ok, note });
  const reg = await swReady(1500);
  add("Works offline", !!(reg && navigator.serviceWorker.controller), location.protocol.startsWith("http") ? t("Reload the page once if this says no.") : t("Needs the Acode preview or a real website, not a file."));
  add("Camera", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext, t("Needs https or the Acode preview."));
  add("Built-in barcode scanner", "BarcodeDetector" in window, t("If not, a backup scanner loads from the internet."));
  add("Reading receipts and dates from photos", navigator.onLine, t("Needs internet."));
  add("Voice commands", !!(window.SpeechRecognition || window.webkitSpeechRecognition), t("Works best in Chrome on Android."));
  add("Read aloud", "speechSynthesis" in window, "");
  add("Keep screen on in cook mode", "wakeLock" in navigator, "");
  add("Notifications", "Notification" in window && Notification.permission === "granted", "Notification" in window ? t("Turn on in Settings, under Reminders.") : t("Not available in this browser."));
  add("Background reminders", !!(reg && "periodicSync" in reg), t("Chrome on Android, installed to the home screen."));
  add("Share button", !!navigator.share, t("If not, lists are copied instead."));
  add("Vibration for timers", "vibrate" in navigator, "");
  add("Installed as an app", matchMedia("(display-mode: standalone)").matches || navigator.standalone === true, t("See Help for how to install."));
  let storage = "";
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); storage = t("Using {a} MB of {b} MB available.", { a: (e.usage / 1048576).toFixed(1), b: Math.round(e.quota / 1048576) }); } } catch (e) {}
  $("#diagBody").innerHTML = `<ul class="diag">${rows.map(r => `<li class="${r.ok ? "ok" : "no"}"><span class="mark" aria-hidden="true">${r.ok ? "&#10003;" : "&#10007;"}</span>
    <span><strong>${esc(t(r.label))}</strong> <span class="sr">${esc(r.ok ? t("Yes") : t("No"))}</span>${r.note && !r.ok ? `<br><span class="muted small">${esc(r.note)}</span>` : ""}</span></li>`).join("")}</ul>
    ${storage ? `<p class="muted small">${esc(storage)}</p>` : ""}<p class="muted small">${esc(navigator.userAgent)}</p>`;
  $("#diagDialog").showModal();
}
