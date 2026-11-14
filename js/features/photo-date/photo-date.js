"use strict";
/* Reading a date from a photo. */
/* ---------- reading an expiration date from a photo ---------- */
const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12, ENE: 1, ABR: 4, AGO: 8, DIC: 12 };
function findExpiryDate(text, today) {
  const T = " " + String(text).toUpperCase().replace(/\|/g, "1") + " ";
  const now = today ? parseDay(today) : new Date(); now.setHours(0, 0, 0, 0);
  const cands = [];
  const add = (y, m, d, idx, raw) => {
    if (y == null) {
      y = now.getFullYear();
      if (new Date(y, m - 1, d) < new Date(now.getTime() - 30 * 86400000)) y++;
    }
    if (y < 100) y += 2000;
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return;
    const dt = new Date(y, m - 1, d);
    if (dt.getMonth() !== m - 1) return;
    const diff = (dt - now) / 86400000;
    if (diff < -60 || diff > 365 * 5) return;
    cands.push({ date: toStr(dt), idx, raw: raw.trim() });
  };
  const mon = "(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEPT?|OCT|NOV|DEC|ENE|ABR|AGO|DIC)[A-Z]*\\.?";
  const mo = s => MONTHS[s.slice(0, 3)];
  let m;
  const re1 = /\b(20\d{2})[\/\-. ](\d{1,2})[\/\-. ](\d{1,2})\b/g;
  while ((m = re1.exec(T))) add(+m[1], +m[2], +m[3], m.index, m[0]);
  const re2 = /\b(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4}|\d{2})\b/g;
  while ((m = re2.exec(T))) { const a = +m[1], b = +m[2]; if (a > 12) add(+m[3], b, a, m.index, m[0]); else add(+m[3], a, b, m.index, m[0]); }
  const re3 = new RegExp(`\\b${mon}\\s*(\\d{1,2})(?:[,\\s]+(20\\d{2}|\\d{2}))?\\b`, "g");
  while ((m = re3.exec(T))) add(m[3] ? +m[3] : null, mo(m[1]), +m[2], m.index, m[0]);
  const re4 = new RegExp(`\\b(\\d{1,2})\\s*${mon}\\s*(20\\d{2}|\\d{2})?\\b`, "g");
  while ((m = re4.exec(T))) add(m[3] ? +m[3] : null, mo(m[2]), +m[1], m.index, m[0]);
  const re5 = new RegExp(`\\b(20\\d{2})\\s*${mon}\\s*(\\d{1,2})\\b`, "g");
  while ((m = re5.exec(T))) add(+m[1], mo(m[2]), +m[3], m.index, m[0]);
  if (!cands.length) return null;
  const kw = /(BEST|USE BY|USE|EXP|BB|SELL|ENJOY|CONSUMIR|CADUCA|CAD|VENCE|VENC|FECHA)/g;
  const kwPos = [];
  while ((m = kw.exec(T))) kwPos.push(m.index + m[0].length);
  const near = cands.filter(c => kwPos.some(p => c.idx >= p - 2 && c.idx - p <= 30));
  const pool = near.length ? near : cands;
  return pool.sort((a, b) => b.date.localeCompare(a.date))[0];
}
async function downscale(file, max) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}
async function readDateFromPhoto(file) {
  const note = $("#suggestNote");
  note.textContent = t("Reading the date... The first time takes a little longer.");
  try {
    if (!window.Tesseract) await loadScript(TESSERACT_URL);
    const img = await downscale(file, 1600);
    const worker = await Tesseract.createWorker("eng");
    const { data } = await worker.recognize(img);
    await worker.terminate();
    const found = findExpiryDate(data.text);
    if (found) {
      $("#fExpires").value = found.date;
      note.textContent = t("Read \"{raw}\" as {date}. Please double-check it.", { raw: found.raw, date: prettyDate(found.date) });
    } else {
      note.textContent = t("Couldn't find a date. Try a close, well-lit photo of just the date, or type it in.");
    }
  } catch (e) {
    note.textContent = t("Couldn't read the photo. This feature needs an internet connection.");
  }
}
