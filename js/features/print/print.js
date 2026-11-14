"use strict";
/* Printing. */
/* ---------- printing ---------- */
function printSheet(title, html) {
  $$("dialog[open]").forEach(d => d.close());
  $("#printArea").innerHTML = `<h1>${esc(title)}</h1>` + html + `<p class="print-foot">Pantry Pal · ${esc(prettyDate(todayStr()))}</p>`;
  document.body.classList.add("printing");
  setTimeout(() => window.print(), 60);
}
function printPlan() {
  const today = todayStr();
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDaysFrom(today, i));
  const cell = (d, slot) => plan.filter(m => m.date === d && (m.slot || "dinner") === slot).map(m => {
    const r = recipeByName(m.recipe); if (!r) return "";
    return esc(rName(r)) + (m.fromId ? ` <em>(${esc(t("leftovers"))})</em>` : m.cookOn && m.cookOn !== m.date && !m.prepped ? ` <em>(${esc(t("prep day"))})</em>` : "");
  }).join("<br>");
  let html = `<table class="print-table"><thead><tr><th>${esc(t("Day"))}</th><th>${esc(t("Breakfast"))}</th><th>${esc(t("Lunch"))}</th><th>${esc(t("Dinner"))}</th></tr></thead><tbody>`;
  html += days.map(d => `<tr><td><strong>${esc(dayName(d))}</strong></td><td>${cell(d, "breakfast")}</td><td>${cell(d, "lunch")}</td><td>${cell(d, "dinner")}</td></tr>`).join("");
  html += `</tbody></table>`;
  const shop = planShoppingEntries();
  if (shop.length) {
    const groups = {};
    shop.forEach(e => { const a = aisleOf(e.name); (groups[a] = groups[a] || []).push(e); });
    html += `<h2>${esc(t("Shopping list"))}</h2><div class="print-cols">` + AISLE_ORDER.filter(a => groups[a]).map(a =>
      `<div><h3>${esc(t(AISLE_LABEL[a]))}</h3><ul class="print-check">${groups[a].map(e => `<li>${esc([e.amt, e.name].filter(Boolean).join(" "))}</li>`).join("")}</ul></div>`).join("") + `</div>`;
  }
  printSheet(t("Meal plan"), html);
}
function printPrep() {
  const tasks = buildPrepSession(prepMeals);
  const sec = { start: t("Get started"), prep: t("Chop and prep"), cook: t("Cook"), store: t("Pack and store") };
  let html = "", last = "";
  for (const tk of tasks) {
    if (tk.section !== last) { if (last) html += "</ul>"; html += `<h2>${esc(sec[tk.section])}</h2><ul class="print-check">`; last = tk.section; }
    if (tk.section === "cook") html += `<li><strong>${esc(tk.title)}</strong><ol>${tk.steps.map(s => `<li>${esc(s.text)}</li>`).join("")}</ol></li>`;
    else html += `<li>${esc(tk.text)}${tk.sub ? ` <em>(${esc(tk.sub)})</em>` : ""}</li>`;
  }
  if (last) html += "</ul>";
  printSheet($("#prepTitle").textContent || t("Prep day"), html);
}
