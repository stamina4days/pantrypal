"use strict";
/* Expiry reminders: phone notifications where the browser allows them, and a calendar file that works everywhere. */
function icsEsc(s) { return String(s).replace(/\\/g, "\\\\").replace(/[,;]/g, m => "\\" + m).replace(/\n/g, "\\n"); }
function makeICS(list) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pantry Pal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const i of list) {
    const day = addDaysFrom(i.expires, -1).replace(/-/g, "");
    const title = t("{name} expires tomorrow", { name: i.name });
    lines.push("BEGIN:VEVENT", `UID:${i.id}-${i.expires}@pantrypal`, `DTSTAMP:${stamp}`, `DTSTART:${day}T090000`, "DURATION:PT15M",
      `SUMMARY:${icsEsc(title)}`, `DESCRIPTION:${icsEsc(t("Use it up or freeze it. Open Pantry Pal for recipe ideas."))}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(title)}`, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function calendarReminders(list) {
  const ok = list.filter(i => i.expires && daysLeft(i.expires) >= 1);
  if (!ok.length) { toast(t("No items with an expiration date at least a day away.")); return; }
  download(ok.length === 1 ? "pantry-reminder.ics" : "pantry-reminders.ics", makeICS(ok), "text/calendar");
  toast(tn(ok.length, "Calendar file ready with 1 reminder. Open it to add it to your calendar.", "Calendar file ready with {n} reminders. Open it to add them to your calendar."));
}
function syncForReminders() {
  if (!settings.reminders || !("caches" in window)) return;
  const data = { lang: LANG, items: items.map(i => ({ name: i.name, expires: i.expires })) };
  caches.open(DATA_CACHE).then(c => c.put("pantry-data.json", new Response(JSON.stringify(data)))).catch(() => {});
}
function swReady(ms) {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), ms))]);
}
async function setReminders(on) {
  const status = $("#reminderStatus");
  if (!on) {
    settings.reminders = false; saveSettings();
    const reg = await swReady(2000);
    try { if (reg && reg.periodicSync) await reg.periodicSync.unregister("expiry-check"); } catch (e) {}
    status.textContent = "";
    return;
  }
  if (!("Notification" in window)) {
    $("#remindersToggle").checked = false;
    status.textContent = t("This browser can't show notifications. Use the calendar option below instead.");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    $("#remindersToggle").checked = false;
    status.textContent = t("Notifications are blocked. You can allow them in your browser's site settings, or use the calendar option below.");
    return;
  }
  settings.reminders = true; saveSettings(); syncForReminders();
  const reg = await swReady(3000);
  let background = false;
  if (reg && "periodicSync" in reg) {
    try { await reg.periodicSync.register("expiry-check", { minInterval: 12 * 60 * 60 * 1000 }); background = true; } catch (e) {}
  }
  try { if (reg) await reg.showNotification("Pantry Pal", { body: t("Reminders are on."), icon: "img/icons/icon-192.png", tag: "test" }); } catch (e) {}
  status.textContent = background
    ? t("On. Your phone will check about once a day and let you know what expires tomorrow.")
    : t("Notifications are allowed, but this browser can't check while the app is closed. On Android, use Chrome and Add to Home screen, then turn this on again. Calendar reminders below work on every phone.");
}
