"use strict";
/* Pantry audit. */
/* ---------- pantry audit ---------- */
let auditSel = new Set(), auditExtra = [];
function openAudit() {
  auditSel = new Set(); auditExtra = [];
  const pool = basePool();
  AUDIT.forEach(([sid, , , list], si) => list.forEach((it, ii) => {
    const id = si + "-" + ii;
    if (sid === "basics") { if (!(settings.missingBasics || []).includes(canon(it[0]).trim())) auditSel.add(id); }
    else if (pool.some(p => p.key && canon(it[0]) && related(p.key, canon(it[0])))) auditSel.add(id);
  }));
  renderAudit();
  $("#auditAdd").value = "";
  $("#auditDialog").showModal();
}
function renderAudit() {
  const label = it => LANG === "es" ? it[1] : it[0];
  $("#auditBody").innerHTML = AUDIT.map(([sid, title, , list], si) => `
    <h3>${esc(t(title))}</h3>${sid === "basics" ? `<p class="muted small">${esc(t("These start out selected. Turn off anything you're out of."))}</p>` : ""}
    <div class="chips wrap">${list.map((it, ii) => { const id = si + "-" + ii, on = auditSel.has(id); return `<button type="button" class="chip ${on ? "on" : ""}" aria-pressed="${on}" data-ai="${id}">${esc(label(it))}</button>`; }).join("")}</div>`).join("");
  $("#auditExtra").innerHTML = auditExtra.map(x => `<li>${esc(x.name)} <span class="muted small">${esc(amountText(x))}</span></li>`).join("");
  const n = [...auditSel].filter(id => AUDIT[Number(id.split("-")[0])][0] !== "basics").length + auditExtra.length;
  $("#auditDone").textContent = n ? tn(n, "Add 1 item", "Add {n} items") : t("Done");
}
function finishAudit() {
  bump("audits");
  const pool = basePool();
  const snap = snapshot();
  let added = 0;
  const missing = [];
  AUDIT.forEach(([sid, , loc, list], si) => list.forEach((it, ii) => {
    const on = auditSel.has(si + "-" + ii);
    if (sid === "basics") { if (!on) missing.push(canon(it[0]).trim()); return; }
    if (!on) return;
    const key = canon(it[0]);
    if (pool.some(p => p.key && key && related(p.key, key))) return;
    const name = LANG === "es" ? it[1] : it[0];
    const est = estimateShelf(it[0], loc);
    items.push({ id: uid(), added: todayStr(), bought: todayStr(), verified: todayStr(), name, amount: it[2], unit: it[3], location: loc,
      expires: est ? addDaysFrom(todayStr(), est.days) : "", notes: "", barcode: "", staple: isStaple(name) });
    added++;
  }));
  auditExtra.forEach(x => { items.push({ id: uid(), added: todayStr(), bought: todayStr(), verified: todayStr(), notes: "", barcode: "", staple: isStaple(x.name), ...x }); added++; });
  settings.missingBasics = missing;
  settings.assumeBasics = true;
  saveItems(); saveSettings();
  $("#auditDialog").close();
  renderAll();
  toast(tn(added, "Added 1 item. Dates are estimates, so fix any that are off.", "Added {n} items. Dates are estimates, so fix any that are off."), snap);
}
