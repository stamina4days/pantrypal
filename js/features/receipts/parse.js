"use strict";
/* Reading receipt text. */
/* Receipt words often drop their vowels ("STRWBRY") or get a letter misread by the camera ("BANAMAS").
   When a word isn't a known food, look for the food word it most likely stands for. */
let receiptVocab = null;
function receiptWords() {
  if (receiptVocab) return receiptVocab;
  const words = new Set();
  for (const p of PHRASES.keys()) p.split(/\s+/).forEach(w => { if (w.length >= 3 && /^[a-z]+$/.test(w)) words.add(w); });
  receiptVocab = [...words];
  return receiptVocab;
}
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const isSubseq = (s, w) => { let i = 0; for (const c of w) if (c === s[i]) i++; return i === s.length; };
function guessReceiptWord(word) {
  const w = word.toLowerCase();
  const vocab = receiptWords();
  if (vocab.includes(w)) return w;
  let best = null, bestScore = 0;
  for (const v of vocab) {
    let score = 0;
    // A misread letter or two in a whole word
    const d = w.length >= 5 ? editDistance(w, v) : 9;
    if (d === 1 || (d === 2 && w.length >= 7)) score = 1 - d / 10;
    // A short code with the vowels dropped: same first letter, and every letter of the code in order inside the word
    else if (w.length >= 3 && v[0] === w[0] && isSubseq(w, v)) {
      const cons = v.replace(/[aeiou]/g, "").length;
      const fit = w.length / Math.max(cons, 1);
      if (fit >= 0.6) score = 0.5 * Math.min(fit, 1) + 0.3 * (w.length / v.length);
    }
    if (score > bestScore || (score === bestScore && best && v.length < best.length)) { best = v; bestScore = score; }
  }
  return bestScore >= 0.45 ? best : null;
}
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
    let expanded = words.map(w => (w in RECEIPT_ABBR ? RECEIPT_ABBR[w] : w.toLowerCase())).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!expanded) continue;
    let key = canon(expanded);
    // Not a food we know yet: try reading each unknown word as a shortened or misread food word
    const nonFood = RECEIPT_NONFOOD.test(line);
    if (nonFood) key = "";
    if (!key && price != null && !nonFood) {
      const guess = words.map(w => (w in RECEIPT_ABBR ? RECEIPT_ABBR[w] : /^[A-Z]{3,}$/.test(w) ? (guessReceiptWord(w) || w.toLowerCase()) : w.toLowerCase()))
        .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      if (canon(guess)) { expanded = guess; key = canon(guess); }
    }
    const known = !!key;
    if (price == null && !known) continue;   // the store name, address, and phone have no price and aren't food
    const name = expanded.replace(/\b\w/g, c => c.toUpperCase());
    // The same food rung up twice in a row: one row, with the count and price added up
    const last = out[out.length - 1];
    if (last && last.known && known && last.name === name && last.unit === unit && !unit) {
      last.amount = (last.amount || 1) + (qty || 1);
      if (price != null) last.price = Math.round(((last.price || 0) + price) * 100) / 100;
      last.raw += " + " + line;
      pendingQty = null;
      continue;
    }
    out.push({ raw: line, name, amount: qty, unit, known, price });
    pendingQty = null;
  }
  return out;
}
