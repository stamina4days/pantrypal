"use strict";
/* Turning pasted text into a recipe. */
/* ---------- paste a recipe from a website ---------- */
function parseDur(s) {
  let min = 0;
  const h = String(s).match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?|horas?)\b/i);
  const m = String(s).match(/(\d+)\s*(?:m|min|mins|minutes?|minutos?)\b/i);
  if (h) min += Number(h[1]) * 60;
  if (m) min += Number(m[1]);
  return min || null;
}
function parseRecipeText(text) {
  const lines = String(text).split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const ingHead = /^(ingredients?|ingredientes)\b\s*:?\s*$/i;
  const stepHead = /^(instructions?|directions?|method|preparation|steps?|how to make( it)?|preparaci[oó]n|instrucciones|pasos|modo de preparaci[oó]n|elaboraci[oó]n)\b\s*:?\s*$/i;
  const stopHead = /^(notes?|nutrition( facts| information)?|tips|recipe notes|notas|nutrici[oó]n|consejos)\b\s*:?\s*$/i;
  let name = "", serves = null, prep = 0, cook = 0, total = null, mode = null;
  const ing = [], steps = [];
  for (const l of lines) {
    const sv = l.match(/\b(serves|servings|yield|makes|porciones|rinde|raciones)\b\s*:?\s*(\d+)/i);
    if (sv && l.length < 40) { serves = Number(sv[2]); continue; }
    const tm = l.match(/\b(prep|cook|total|preparaci[oó]n|cocci[oó]n)\b\s*(time|tiempo)?\s*:?\s*(.*)$/i);
    if (tm && l.length < 50 && parseDur(tm[3])) {
      const d = parseDur(tm[3]);
      if (/total/i.test(tm[1])) total = d; else if (/prep|prepar/i.test(tm[1])) prep = d; else cook = d;
      continue;
    }
    if (ingHead.test(l)) { mode = "ing"; continue; }
    if (stepHead.test(l)) { mode = "steps"; continue; }
    if (stopHead.test(l)) { mode = "stop"; continue; }
    if (mode === "ing") { const s = l.replace(/^[-*•▢☐○]\s*/, ""); if (s && !/^for the /i.test(s)) ing.push(s); }
    else if (mode === "steps") { const s = l.replace(/^(step\s*\d+\s*[:.)-]?|paso\s*\d+\s*[:.)-]?|\d+\s*[.)])\s*/i, ""); if (s.length > 2) steps.push(s); }
    else if (!mode && !name && l.length < 90 && !/^(by|jump to|print|pin|save)\b/i.test(l)) name = l;
  }
  if (!ing.length) {
    lines.forEach(l => {
      if (l === name) return;
      if (/^(\d|¼|½|¾|[-*•])/.test(l) && l.length < 80 && !/[.!?]$/.test(l)) ing.push(l.replace(/^[-*•]\s*/, ""));
      else if (l.length > 30) steps.push(l.replace(/^(\d+\s*[.)])\s*/, ""));
    });
  }
  const fix = s => s.replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4").replace(/⅓/g, "1/3").replace(/⅔/g, "2/3").replace(/(\d)(1\/\d)/, "$1 $2");
  return { name, serves, time: total || (prep + cook) || null, ing: ing.map(fix), steps };
}
