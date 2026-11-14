"use strict";
/* Meal plan to calendar. */
/* ---------- meal plan to calendar ---------- */
function planICS() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pantry Pal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const slotTime = { breakfast: ["080000", "PT30M"], lunch: ["123000", "PT30M"], dinner: ["183000", "PT1H"] };
  const today = todayStr();
  let n = 0;
  for (const m of plan) {
    if (m.date < today) continue;
    const r = recipeByName(m.recipe); if (!r) continue;
    const slot = m.slot || "dinner", [time, dur] = slotTime[slot];
    const label = t(slot === "breakfast" ? "Breakfast" : slot === "lunch" ? "Lunch" : "Dinner");
    const desc = m.fromId ? t("Leftovers from last night") : m.prepped ? t("Prepped and in the fridge") : t("Open Pantry Pal for the recipe and cook mode.");
    lines.push("BEGIN:VEVENT", `UID:${m.id}@pantrypal-plan`, `DTSTAMP:${stamp}`, `DTSTART:${m.date.replace(/-/g, "")}T${time}`, `DURATION:${dur}`,
      `SUMMARY:${icsEsc(label + ": " + rName(r))}`, `DESCRIPTION:${icsEsc(desc)}`, "END:VEVENT");
    n++;
  }
  const prepDays = {};
  plan.forEach(m => { if (!m.fromId && !m.prepped && m.cookOn && m.cookOn !== m.date && m.cookOn >= today) (prepDays[m.cookOn] = prepDays[m.cookOn] || []).push(m); });
  for (const [d, list] of Object.entries(prepDays)) {
    const names = list.map(m => { const r = recipeByName(m.recipe); return r ? rName(r) : m.recipe; }).join(", ");
    lines.push("BEGIN:VEVENT", `UID:prep-${d}@pantrypal-plan`, `DTSTAMP:${stamp}`, `DTSTART:${d.replace(/-/g, "")}T100000`, "DURATION:PT2H",
      `SUMMARY:${icsEsc(t("Prep day") + ": " + names)}`, `DESCRIPTION:${icsEsc(t("Open Prep day in Pantry Pal for the combined plan."))}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(t("Prep day"))}`, "TRIGGER:-PT1H", "END:VALARM", "END:VEVENT");
    n++;
  }
  lines.push("END:VCALENDAR");
  return { text: lines.join("\r\n"), n };
}
function exportPlanCalendar() {
  const { text, n } = planICS();
  if (!n) { toast(t("Your plan is empty. Make a plan first.")); return; }
  download("pantry-meal-plan.ics", text, "text/calendar");
  toast(tn(n, "Calendar file ready with 1 event. Open it to add it to your calendar.", "Calendar file ready with {n} events. Open it to add them to your calendar."));
}
