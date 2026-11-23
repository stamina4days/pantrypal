"use strict";
/* Receipt check. */
/* ---------- receipts ---------- */
async function readReceipt(file) {
  toast(t("Reading your receipt. This can take up to 30 seconds."));
  try {
    if (!window.Tesseract) await loadScript(TESSERACT_URL);
    const img = await downscale(file, 2000);
    const worker = await Tesseract.createWorker("eng");
    const { data } = await worker.recognize(img);
    await worker.terminate();
    const rows = parseReceipt(data.text);
    if (!rows.length) { toast(t("Couldn't find any items. Try a flat, well-lit photo of the whole receipt.")); return; }
    openReceiptReview(rows);
  } catch (e) { toast(t("Couldn't read the receipt. This feature needs an internet connection.")); }
}
let receiptRows = [];
const receiptLoc = name => /\bfrozen\b|congelad/i.test(name) ? "Freezer" : guessLoc(name);
/* Where a food will go and how long it keeps, so you can see it before you add it */
function receiptWhere(name) {
  if (!name.trim()) return "";
  const loc = receiptLoc(name), est = estimateShelf(name, loc);
  return locLabel(loc) + (est ? ", " + t("keeps {time}", { time: keepText(est.days) }) : "");
}
/* The foods Benji recognized come first, checked. Anything he isn't sure is food waits below, unchecked. */
function openReceiptReview(rows) {
  receiptRows = rows;
  const row = (r, i) => `<div class="receipt-row${r.known ? "" : " unsure"}">
    <input type="checkbox" data-ri="${i}" ${r.known ? "checked" : ""} aria-label="${esc(t("Add {name}", { name: r.name }))}">
    <div class="grow"><input class="r-name" data-rn="${i}" value="${esc(r.name)}" aria-label="${esc(t("Name"))}">
    <span class="r-where small" data-rw="${i}">${esc(receiptWhere(r.name))}${r.amount ? ", " + esc(fmtNum(r.amount) + " " + (r.unit || "")) : ""}</span>
    <span class="muted small r-raw">${esc(t("On the receipt: {line}", { line: r.raw }))}</span></div></div>`;
  const food = rows.map((r, i) => [r, i]).filter(([r]) => r.known), unsure = rows.map((r, i) => [r, i]).filter(([r]) => !r.known);
  $("#receiptBody").innerHTML = `<p class="receipt-sum">${esc(food.length
      ? tn(food.length, "Benji found 1 food. Tap a name to fix it.", "Benji found {n} foods. Tap any name to fix it.")
      : t("Benji couldn't tell which of these are food. Tick the ones you want."))}</p>`
    + food.map(([r, i]) => row(r, i)).join("")
    + (unsure.length ? `<h3 class="receipt-unsure">${esc(t("Not sure these are food"))}</h3>
      <p class="muted small">${esc(t("Tick any you want to add."))}</p>` + unsure.map(([r, i]) => row(r, i)).join("") : "");
  receiptCount();
  $("#receiptDialog").showModal();
}
function receiptCount() {
  const n = $$("#receiptBody [data-ri]:checked").length;
  $("#confirmReceipt").textContent = n ? tn(n, "Add 1 food", "Add {n} foods") : t("Add to My Food");
  $("#confirmReceipt").disabled = !n;
}
document.addEventListener("change", e => { if (e.target.closest && e.target.closest("#receiptBody [data-ri]")) receiptCount(); });
document.addEventListener("input", e => {
  const n = e.target.closest && e.target.closest("#receiptBody [data-rn]"); if (!n) return;
  const i = Number(n.dataset.rn), r = receiptRows[i], w = $(`#receiptBody [data-rw="${i}"]`);
  if (w) w.textContent = receiptWhere(n.value) + (r && r.amount ? ", " + fmtNum(r.amount) + " " + (r.unit || "") : "");
});
function confirmReceipt() {
  bump("receipts");
  const snap = snapshot();
  let n = 0;
  $$("#receiptBody [data-ri]:checked").forEach(c => {
    const i = Number(c.dataset.ri), r = receiptRows[i];
    const name = $(`#receiptBody [data-rn="${i}"]`).value.trim();
    if (!name) return;
    const loc = receiptLoc(name), est = estimateShelf(name, loc);
    if (r.price) learnPrice(name, r.amount, r.unit, r.price);
    items.push({ id: uid(), added: todayStr(), bought: todayStr(), verified: todayStr(), name, amount: r.amount, unit: r.unit || "", location: loc,
      expires: est ? addDaysFrom(todayStr(), est.days) : "", notes: "", barcode: "", staple: isStaple(name) });
    n++;
  });
  saveItems(); saveSettings();
  $("#receiptDialog").close();
  renderAll();
  toast(tn(n, "Added 1 item from your receipt.", "Added {n} items from your receipt."), snap);
}
