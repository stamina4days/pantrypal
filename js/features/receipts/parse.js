"use strict";
/* Reading receipt text. */
/* Turn receipt text into likely food lines: [{raw, name, amount, unit}] */
function parseReceipt(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let pendingQty = null;   // "2 @ 0.50" on its own line belongs to the item under it
  for (const line of lines) {
    if (RECEIPT_SKIP.test(line)) continue;
    const alone = line.match(/^(\d{1,2})\s*@\s*\$?\d+\.\d{2}\s*$/);
    if (alone) { pendingQty = Number(alone[1]); continue; }
    if (/\d{1,2}[:/]\d{2}([:/]\d{2,4})?/.test(line) && !/[A-Z]{3,}/i.test(line.replace(/\d/g, ""))) continue;
    const weight = line.match(/(\d+(?:\.\d+)?)\s*(lb|lbs|kg|oz)\b\s*@/i);
    if (weight && out.length && !/[A-Z]{3,}/.test(line.replace(/\b(LB|LBS|KG|OZ)\b/gi, ""))) {
      const last = out[out.length - 1];
      last.amount = Number(weight[1]); last.unit = weight[2].toLowerCase().replace("lbs", "lb");
      const per = line.match(/@\s*\$?(\d+\.\d{2})/);
      if (!last.price && per) last.price = Math.round(last.amount * Number(per[1]) * 100) / 100;
      continue;
    }
    let qty = null, unit = "";
    const prices = line.match(/\d+\.\d{2}/g);
    const price = prices ? Number(prices[prices.length - 1]) : null;
    const qm = line.match(/^(\d{1,2})\s*(?:@|x)\s/i);
    if (qm) qty = Number(qm[1]);
    // Pack sizes printed on the label: "12CT", "6 PK", "DOZEN", "GAL", "1/2 GAL"
    let rest = line.toUpperCase();
    let size = null;
    const ct = rest.match(/\b(\d{1,3})\s*(CT|PK|PACK|COUNT)\b/);
    if (ct) { size = Number(ct[1]); rest = rest.replace(ct[0], " "); }
    else if (/\b(DOZEN|DOZ|DZ)\b/.test(rest)) { size = 12; rest = rest.replace(/\b(DOZEN|DOZ|DZ)\b/, " "); }
    else if (/\b(1\/2|HALF)\s*GAL\b/.test(rest)) { size = 0.5; unit = "gallon"; rest = rest.replace(/\b(1\/2|HALF)\s*GAL\b/, " "); }
    else if (/\bGAL\b/.test(rest)) { size = 1; unit = "gallon"; }
    else {
      const wt = rest.match(/\b(\d+(?:\.\d+)?)\s*(LB|LBS|OZ|KG)\b(?!\s*@)/);
      if (wt) { size = Number(wt[1]); unit = wt[2].toLowerCase().replace("lbs", "lb"); rest = rest.replace(wt[0], " "); }
    }
    if (pendingQty && qty == null) qty = pendingQty;
    if (size != null) qty = (qty || 1) * size;
    let words = rest
      .replace(/\$?\d+\.\d{2}\s*[A-Z]?\b/g, " ")
      .replace(/\b\d{4,}\b/g, " ")
      .replace(/(\d+(?:\.\d+)?)\s*(LB|LBS|KG|OZ)\s*@.*$/i, " ")
      .replace(/^(\d{1,2})\s*(@|X)\s/, " ")
      .replace(/[^A-Z0-9% ]+/g, " ")
      .split(/\s+/).filter(w => w && !/^\d+%?$/.test(w) && w.length > 1);
    if (!words.length) continue;
    const expanded = words.map(w => (w in RECEIPT_ABBR ? RECEIPT_ABBR[w] : w.toLowerCase())).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!expanded) continue;
    const key = canon(expanded);
    const known = !!key;
    if (price == null && !known) continue;   // the store name, address, and phone have no price and aren't food
    const name = expanded.replace(/\b\w/g, c => c.toUpperCase());
    out.push({ raw: line, name, amount: qty, unit, known, price });
    pendingQty = null;
  }
  return out;
}
