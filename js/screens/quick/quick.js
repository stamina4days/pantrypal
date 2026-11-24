"use strict";
/* The notepad for adding several foods at once, one per line, like "2 lbs chicken" or "a dozen eggs". */
const QA_UNITS = "lbs?|pounds?|oz|ounces?|kg|kilos?|g|grams?|cups?|cans?|bags?|boxes|box|bottles?|packs?|packages?|bunch(?:es)?|heads?|loaf|loaves|dozen|gallons?|gal|liters?|litros?|ml|pieces?|slices?|cartons?|jars?|latas?|bolsas?|cajas?|botellas?|paquetes?|piezas?|docenas?|manojos?|frascos?|rebanadas?";
const QA_RE = new RegExp(`^(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?)\\s*(?:(${QA_UNITS})\\.?\\s+(?:of\\s+|de\\s+)?)?(.+)$`, "i");
function parseQuick(text) {
  return text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).map(s => {
    let amount = null, unit = "", name = s;
    const m = s.match(QA_RE);
    if (m) {
      amount = parseAmt(m[1].replace(",", ".")) ?? Number(m[1].replace(",", "."));
      unit = m[2] || "";
      name = m[3].trim();
      if (/^(dozen|docenas?)$/i.test(unit)) { amount *= 12; unit = ""; }
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);
    const frozen = /\bfrozen\b|\bcongelad[oa]s?\b/i.test(name);
    const location = frozen ? "Freezer" : guessLoc(name);
    const est = estimateShelf(name, location);
    return { name, amount, unit, location, expires: est ? addDaysFrom(todayStr(), est.days) : "", dateGuess: !!est };
  });
}
function renderQuickPreview() {
  const list = parseQuick($("#quickText").value);
  $("#quickPreview").innerHTML = list.map(x =>
    `<li><strong>${esc(x.name)}</strong> <span class="muted small">${esc([amountText(x), locLabel(x.location), x.expires ? t("expires {date}", { date: prettyDate(x.expires) }) : t("no date")].filter(Boolean).join(", "))}</span></li>`).join("");
  $("#confirmQuick").textContent = list.length ? tn(list.length, "Add 1 item", "Add {n} items") : t("Add");
  $("#confirmQuick").disabled = !list.length;
}
function confirmQuick() {
  const list = parseQuick($("#quickText").value);
  if (!list.length) return;
  const snap = snapshot();
  list.forEach(x => items.push({ id: uid(), added: todayStr(), bought: todayStr(), notes: "", barcode: "", staple: isStaple(x.name), ...x }));
  saveItems();
  $("#quickDialog").close();
  renderAll();
  if (typeof Motion !== "undefined") Motion.unpack(list.map(x => x.name));
  toast(tn(list.length, "Added 1 item with an estimated date.", "Added {n} items with estimated dates."), snap);
}
