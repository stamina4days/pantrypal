"use strict";
/* Barcode scanner. */
/* ---------- barcode scanner ---------- */
let scanStream = null, scanTimer = null, zxingReader = null, scanDone = false;
const scanStatus = s => { $("#scanStatus").textContent = s; };

async function openScanner() {
  scanDone = false;
  $("#manualCode").value = "";
  $("#scanDialog").showModal();
  const video = $("#scanVideo");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scanStatus(t("The camera isn't available here (it needs https). Type the barcode number instead."));
    return;
  }
  scanStatus(t("Starting camera..."));
  try {
    let formats = [];
    if ("BarcodeDetector" in window) { try { formats = await BarcodeDetector.getSupportedFormats(); } catch (e) { formats = []; } }
    const wanted = formats.filter(f => ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"].includes(f));
    if (wanted.length) {
      const detector = new BarcodeDetector({ formats: wanted });
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = scanStream;
      await video.play();
      scanStatus(t("Point the camera at a barcode."));
      const tick = async () => {
        if (scanDone || !scanStream) return;
        try { const codes = await detector.detect(video); if (codes.length) return gotCode(codes[0].rawValue); } catch (e) {}
        scanTimer = setTimeout(tick, 250);
      };
      tick();
    } else {
      scanStatus(t("Loading scanner..."));
      if (!window.ZXing) await loadScript(ZXING_URL);
      zxingReader = new ZXing.BrowserMultiFormatReader();
      scanStatus(t("Point the camera at a barcode."));
      zxingReader.decodeFromVideoDevice(null, video, res => { if (res && !scanDone) gotCode(res.getText()); });
    }
  } catch (e) {
    scanStatus(t("Couldn't start the scanner. Allow camera access, or type the barcode number below."));
  }
}
function stopScanner() {
  scanDone = true;
  clearTimeout(scanTimer);
  if (scanStream) { scanStream.getTracks().forEach(tr => tr.stop()); scanStream = null; }
  if (zxingReader) { try { zxingReader.reset(); } catch (e) {} zxingReader = null; }
  $("#scanVideo").srcObject = null;
}
function gotCode(code) {
  stopScanner();
  if ($("#scanDialog").open) $("#scanDialog").close();
  if (navigator.vibrate) navigator.vibrate(80);
  lookupBarcode(String(code).trim());
}
async function lookupBarcode(code) {
  if (!code) return;
  $("#fBarcode").value = code;
  const note = $("#scanNote");
  const fill = (name, unit, loc) => {
    $("#fName").value = name;
    if (unit && !$("#fUnit").value) $("#fUnit").value = unit;
    if (loc) $("#fLoc").value = locLabel(loc);
    $("#fStaple").checked = isStaple(name);
    if (!$("#fExpires").value) suggestExpiry(true);
    if (typeof itemFormChanged === "function") itemFormChanged();
  };
  const saved = barcodes[code];
  if (saved) { fill(saved.name, saved.unit, saved.location); note.textContent = t("Found in your saved barcodes."); return; }
  note.textContent = t("Barcode {code}: looking it up...", { code });
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,quantity`);
    const data = await res.json();
    const p = data && data.product;
    const pname = p && p.product_name;
    if (data.status === 1 && pname) {
      fill(pname, "", null);
      note.textContent = t("Found: {what}. Edit the name if you like.", { what: [p.brands, pname, p.quantity].filter(Boolean).join(", ") });
    } else {
      note.textContent = t("Barcode {code} isn't in the database. Type a name and it'll be remembered next time.", { code });
    }
  } catch (e) {
    note.textContent = t("Couldn't look up {code} (are you offline?). Type a name and it'll be remembered next time.", { code });
  }
}
