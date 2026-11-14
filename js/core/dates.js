"use strict";
/* Dates in local days. */
/* ---------- dates (local days, no timezone surprises) ---------- */
function toStr(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function parseDay(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
const todayStr = () => toStr(new Date());
function addDaysFrom(base, n) { const d = parseDay(base || todayStr()); d.setDate(d.getDate() + n); return toStr(d); }
function daysLeft(exp) {
  if (!exp) return null;
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  return Math.round((parseDay(exp) - t0) / 86400000);
}
const locale = () => LANG === "es" ? "es-US" : "en-US";
function prettyDate(s) { return s ? parseDay(s).toLocaleDateString(locale(), { month: "short", day: "numeric" }) : ""; }
function dayName(s) {
  const d = daysLeft(s);
  if (d === 0) return t("Today");
  if (d === 1) return t("Tomorrow");
  return parseDay(s).toLocaleDateString(locale(), { weekday: "long", month: "short", day: "numeric" });
}
/* A day inside a sentence: "today", "tomorrow", "on Monday, Nov 16" */
function dayRef(s) {
  const d = daysLeft(s);
  if (d === 0) return t("today");
  if (d === 1) return t("tomorrow");
  return t("on {day}", { day: parseDay(s).toLocaleDateString(locale(), { weekday: "long", month: "short", day: "numeric" }) });
}
function expiryLabel(d) {
  if (d === null) return { text: t("No date"), cls: "none" };
  if (d < 0) return { text: d === -1 ? t("Expired yesterday") : t("Expired {n} days ago", { n: -d }), cls: "expired" };
  if (d === 0) return { text: t("Today"), cls: "urgent" };
  if (d === 1) return { text: t("Tomorrow"), cls: "urgent" };
  return { text: t("{n} days", { n: d }), cls: d <= 3 ? "urgent" : d <= 7 ? "soon" : "ok" };
}
const shortLeft = d => d === null ? t("no date") : d === 0 ? t("today") : d === 1 ? t("tomorrow") : t("{n} days", { n: d });
const daySort = d => d === null ? 99999 : d;
