"use strict";
/* Dates in everyday words: "Eat by Thursday" instead of "4 days", "bought Saturday" instead of "Nov 14".
   The exact numbers are still on each food's own page. */
function weekdayOf(dateStr) {
  return parseDay(dateStr).toLocaleDateString(locale(), { weekday: "long" });
}
function friendlyWhen(dateStr) {
  const d = daysLeft(dateStr);
  if (d === null) return t("No date");
  if (d < 0) return t("Past date");
  if (d === 0) return t("Eat today");
  if (d === 1) return t("Eat tomorrow");
  if (d <= 6) return t("Eat by {day}", { day: weekdayOf(dateStr) });
  if (d <= 13) return t("Next week");
  if (d <= 45) return t("In a few weeks");
  return t("Keeps a while");
}
function friendlyBought(dateStr) {
  if (!dateStr) return "";
  const ago = -daysLeft(dateStr);
  if (ago <= 0) return t("bought today");
  if (ago === 1) return t("bought yesterday");
  if (ago <= 6) return t("bought {day}", { day: weekdayOf(dateStr) });
  if (ago <= 13) return t("bought last week");
  return t("bought {date}", { date: prettyDate(dateStr) });
}
function friendlyOpened(dateStr) {
  const ago = -daysLeft(dateStr);
  if (ago <= 0) return t("opened today");
  if (ago === 1) return t("opened yesterday");
  if (ago <= 6) return t("opened {day}", { day: weekdayOf(dateStr) });
  return t("opened {date}", { date: prettyDate(dateStr) });
}
