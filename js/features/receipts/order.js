"use strict";
/* Reading an online grocery order (Walmart, Instacart, Kroger, Target, Amazon Fresh, and others).
   You copy the item list from the order email or the store's app and paste it in. Each product line
   becomes a row in the same check sheet receipts use, with its amount and price when the order shows them. */

/* Lines that are never a product: totals, fees, order details, status words, and buttons */
const ORDER_SKIP = /^(sub ?total|total|order total|estimated total|grand total|items? total|tax(es)?|tips?|driver tip|delivery( fee)?|service fee|bag fee|bottle deposit|fees?|savings|you saved|saved|discount|coupons?|promo|payment|paid|charged|visa|mastercard|amex|american express|discover|debit|credit|card ending|ending in|order|placed|delivered|arriv|shipped|shipping|ship to|deliver(ing|y) to|address|qty|quantity|weight|price|each|ea\b|per lb|unit price|substitut|replaced|replacement|refund|out of stock|not available|unavailable|add to cart|buy (it )?again|write a review|review|rate|return|view|details|track|thank|hi\b|hello|dear|your (order|items|receipt)|receipt|invoice|questions|help|contact|pickup|picked|shopper|shopped|sold by|fulfilled|item(s)? (in|from)|show|see all|edit|cancel|manage)\b/i;
/* How order emails and apps lay out each item. A price, a quantity, or a size on its own line belongs to the item above it. */
const ORDER_PRICE = /^[-+]?\s*\$\s*\d+(?:[.,]\d{2})?(\s*(\/\s*(lb|ea|each|oz))|\s*(each|ea))?$|^[-+]?\d+\.\d{2}$/i;
const ORDER_QTY = /^(?:qty|quantity)\s*[:.]?\s*(\d{1,3})\b|^(\d{1,3})\s*(?:x|×)$|^x\s*(\d{1,3})$|^(\d{1,3})\s*(?:items?|units?)$/i;
const ORDER_SIZE_ONLY = /^(?:approx\.?\s*|about\s*)?\d+(?:[.,]\d+)?\s*(?:lb|lbs|pound|pounds|oz|fl oz|ounce|ounces|kg|g|ct|count|pk|pack|each|ea|gal|gallon|gallons|qt|quart|pt|pint|l|ml|dozen)\.?(?:\s*(?:bag|bunch|box|can|bottle|jar|pkg|package))?$/i;
const ORDER_BRANDS = /^(great value|marketside|freshness guaranteed|equate|sam's choice|kroger|simple truth( organic)?|private selection|good & gather|good and gather|market pantry|favorite day|kirkland( signature)?|365( by whole foods market)?|whole foods market|signature select|o organics|open nature|lucerne|amazon fresh|happy belly|wickedly prime|trader joe's|h-?e-?b|hill country fare|central market|publix|wegmans|meijer|clancy's|aldi|food club|best choice|essential everyday|that's smart!?|our family|hy-?vee|organic)\s+/i;

/* Household things that come in grocery orders. Product names are long, so this list only has words no food name uses. */
const ORDER_NONFOOD = /\b(soap|paper towels?|towels|tissues?|toilet|detergent|bleach|cleaner|cleaning|wipes|shampoo|conditioner|lotion|deodorant|toothpaste|toothbrush|razors?|diapers?|batter(y|ies)|light bulbs?|aluminum foil|plastic wrap|ziploc|trash bags?|garbage|paper plates|plastic cups|dog food|cat food|litter|medicine|tylenol|advil|ibuprofen|bandages?|band-aid|sponges?|laundry|fabric softener|dryer sheets|air freshener|gift card|candles?|charcoal|multivitamins?|supplements)\b/i;

function orderName(line) {
  let s = line.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
  // "Whole Milk, 1 Gallon" or "Bananas - 1 lb": the size comes after the comma or dash
  s = s.split(/\s+-\s+|,\s+/)[0];
  for (let i = 0; i < 2; i++) s = s.replace(ORDER_BRANDS, "");
  s = s.replace(/\b\d+\/\d+\s*(?:gal|gallon|lb|oz|cup)s?\b/gi, " ").replace(/\b\d+(?:[.,]\d+)?\s*(?:lb|lbs|oz|fl oz|ct|count|pk|pack|gal|gallon|qt|kg|g|ml|l)\b\.?/gi, " ")
    .replace(/\$\s*\d+(?:[.,]\d{2})?/g, " ").replace(/[^A-Za-z0-9'&% ]+/g, " ").replace(/\s+/g, " ").trim();
  if (s === s.toUpperCase()) s = s.toLowerCase();
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

/* Amount and unit printed with the product: "12 ct", "2 lb", "1 Gallon", "Dozen" */
function orderSize(line) {
  const ct = line.match(/\b(\d{1,3})\s*(?:ct|count|pk|pack)\b/i);
  if (ct) return { amount: Number(ct[1]), unit: "" };
  if (/\b(dozen|doz)\b/i.test(line)) return { amount: 12, unit: "" };
  if (/\b(1\/2|half)\s*gal(lon)?\b/i.test(line)) return { amount: 0.5, unit: "gallon" };
  const gal = line.match(/\b(\d+(?:\.\d+)?)\s*gal(?:lon)?s?\b/i);
  if (gal) return { amount: Number(gal[1]), unit: "gallon" };
  const wt = line.match(/\b(\d+(?:\.\d+)?)\s*(lb|lbs|pound|pounds|oz|ounce|ounces|kg)\b/i);
  if (wt && !/fl\.?\s*oz/i.test(wt[0])) return { amount: Number(wt[1]), unit: wt[2].toLowerCase().replace(/^pounds?$/, "lb").replace("lbs", "lb").replace(/^ounces?$/, "oz") };
  return null;
}

function parseOrder(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/).map(l => l.replace(/ /g, " ").trim()).filter(Boolean);
  let last = null;
  for (const line of lines) {
    // A price, count, or size on its own line belongs to the product above it
    if (ORDER_PRICE.test(line)) {
      if (last && last.price == null) { const p = line.match(/\d+(?:[.,]\d{2})?/); last.price = p ? Number(p[0].replace(",", ".")) : null; }
      continue;
    }
    const q = line.match(ORDER_QTY);
    if (q) { if (last) last.qty = Number(q[1] || q[2] || q[3] || q[4]); continue; }
    if (ORDER_SIZE_ONLY.test(line)) { if (last && !last.size) last.size = orderSize(line); continue; }
    if (ORDER_SKIP.test(line)) continue;
    if (/^[\d\s#:\/.,-]+$/.test(line) || line.length < 3 || line.length > 120) continue;   // order numbers, dates, and stray numbers
    if (!/[a-z]{3,}/i.test(line)) continue;
    // A count and a price on the same line as the product: "2 x Bananas $1.24" or "Bananas Qty 2 $1.24"
    let qty = null, price = null, body = line;
    const lead = body.match(/^(\d{1,2})\s*(?:x|×)\s+/i);
    if (lead) { qty = Number(lead[1]); body = body.slice(lead[0].length); }
    const inQty = body.match(/\b(?:qty|quantity)\s*[:.]?\s*(\d{1,3})\b/i);
    if (inQty) { qty = Number(inQty[1]); body = body.replace(inQty[0], " "); }
    const prices = body.match(/\$\s*\d+(?:[.,]\d{2})?/g);
    if (prices) { price = Number(prices[prices.length - 1].replace(/[$\s]/g, "").replace(",", ".")); body = body.replace(/\$\s*\d+(?:[.,]\d{2})?(\s*\/\s*\w+)?/g, " "); }
    let name = orderName(body);
    if (!name || name.length < 3) continue;
    const nonFood = ORDER_NONFOOD.test(body);
    // Long product names ("Whole Vitamin D Milk"): the food word is usually at the end
    const words = name.split(" ");
    const hit = nonFood ? null : [name, ...[3, 2, 1].map(k => words.slice(-k).join(" "))].find(n => n && canon(n));
    if (hit) name = hit;
    const known = !!hit;
    last = { raw: line, name, qty, price, size: orderSize(body), known };
    out.push(last);
  }
  // Keep the foods, plus anything else that had a price or count (it might be food Benji doesn't know yet)
  return out.filter(r => r.known || r.price != null || r.qty != null).map(r => {
    const size = r.size, n = r.qty || 1;
    const amount = size ? Math.round(size.amount * n * 100) / 100 : r.qty;
    return { raw: r.raw, name: r.name, amount: amount || null, unit: size ? size.unit : "", known: r.known, price: r.price };
  });
}

function openOrder() {
  $("#orderText").value = ""; $("#orderNote").textContent = "";
  $("#orderDialog").showModal();
  setTimeout(() => { try { $("#orderText").focus(); } catch (e) {} }, 300);
}
function readOrder() {
  const rows = parseOrder($("#orderText").value);
  if (!rows.length) { $("#orderNote").textContent = t("Benji couldn't find any food in that. Copy the part of the order that lists the items, then paste it again."); return; }
  $("#orderDialog").close();
  openReceiptReview(rows, "order");
}
function orderInit() {
  $("#cancelOrder").addEventListener("click", () => $("#orderDialog").close());
  $("#confirmOrder").addEventListener("click", readOrder);
}
