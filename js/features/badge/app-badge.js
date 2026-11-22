"use strict";
/* A number on the home screen icon: how many foods need eating today (or are past their date).
   Works where the phone supports it: Android, and iPhones with Pal on the home screen. */
function appBadgeCount() {
  return items.filter(i => { const d = daysLeft(i.expires); return d !== null && d <= 0 && !i.leftover; }).length;
}
function updateAppBadge() {
  if (!("setAppBadge" in navigator)) return;
  try {
    const n = settings.iconBadge === false ? 0 : appBadgeCount();
    (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {});
  } catch (e) {}
}
function appBadgeInit() {
  const box = $("#iconBadgeToggle");
  if (box) {
    box.closest("label").classList.toggle("hidden", !("setAppBadge" in navigator));
    box.checked = settings.iconBadge !== false;
    box.addEventListener("change", e => { settings.iconBadge = e.target.checked; saveSettings(); updateAppBadge(); });
  }
  updateAppBadge();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) updateAppBadge(); });
}
