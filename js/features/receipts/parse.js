"use strict";
/* Reading receipt text. */
/* Turn receipt text into likely food lines: [{raw, name, amount, unit}] */
function parseReceipt(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (RECEIPT_SKIP.test(line)) continue;
    if (/\d{1,2}[:/]\d{2}([:/]\d{2,4})?/.test(line) && !/[A-Z]{3,}/i.test(line.replace(/\d/g, ""))) continue;
    const weight = line.match(/(\d+(?:\.\d+)?)\s*(lb|lbs|kg|oz)\b\s*@/i);
    if (weight && out.length && !/[A-Z]{3,}/.test(line.replace(/\b(LB|LBS|KG|OZ)\b/gi, ""))) {
      const last = out[out.length - 1];
      last.amount = Number(weight[1]); last.unit = weight[2].toLowerCase().replace("lbs", "lb");
      const per = line.match(/@\s*\$?(\d+\.\d{2})/);
      if (!last.price && per) last.price = Math.round(last.amount * Number(per[1]) * 100) / 100;
      continue;
    }
    let qty = null;
    const prices = line.match(/\d+\.\d{2}/g);
    const price = prices ? Number(prices[prices.length - 1]) : null;
    const qm = line.match(/^(\d{1,2})\s*(?:@|x)\s/i);
    if (qm) qty = Number(qm[1]);
    let words = line.toUpperCase()
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
    const name = expanded.replace(/\b\w/g, c => c.toUpperCase());
    out.push({ raw: line, name, amount: qty, unit: "", known, price });
  }
  return out;
}
