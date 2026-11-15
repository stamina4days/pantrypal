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
function openReceiptReview(rows) {
  receiptRows = rows;
  $("#receiptBody").innerHTML = rows.map((r, i) => `<div class="receipt-row">
    <input type="checkbox" data-ri="${i}" ${r.known ? "checked" : ""} aria-label="${esc(t("Add this item"))}">
    <div class="grow"><input class="r-name" data-rn="${i}" value="${esc(r.name)}" aria-label="${esc(t("Name"))}">
    <span class="muted small">${esc(r.raw)}${r.amount ? ", " + esc(fmtNum(r.amount) + " " + (r.unit || "")) : ""}</span></div></div>`).join("");
  $("#receiptDialog").showModal();
}
function confirmReceipt() {
  bump("receipts");
  const snap = snapshot();
  let n = 0;
  $$("#receiptBody [data-ri]:checked").forEach(c => {
    const i = Number(c.dataset.ri), r = receiptRows[i];
    const name = $(`#receiptBody [data-rn="${i}"]`).value.trim();
    if (!name) return;
    const loc = /\bfrozen\b|congelad/i.test(name) ? "Freezer" : guessLoc(name), est = estimateShelf(name, loc);
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
