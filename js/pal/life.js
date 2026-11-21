"use strict";
/* Pal's little reactions: say hi when tapped, dance when you rescue food. */
let palTapIdx = 0;
function palSay(row, text) {
  const p = row && row.querySelector(".bubble p");
  if (!p) return;
  if (!p.dataset.orig) p.dataset.orig = p.textContent;
  p.textContent = text;
  clearTimeout(row._palTimer);
  row._palTimer = setTimeout(() => { p.textContent = p.dataset.orig; delete p.dataset.orig; }, 4200);
}
function palTapped(btn) {
  const svg = btn.querySelector(".pal");
  if (svg) { svg.classList.remove("boing"); void svg.getBoundingClientRect(); svg.classList.add("boing"); }
  sfx("pop"); buzz(8);
  const lines = palLines("tap");
  palSay(btn.closest(".pal-row"), palYou(lines[palTapIdx++ % lines.length]));
}
function palDance() {
  $$(".pal").forEach(p => { p.classList.remove("dance"); void p.getBoundingClientRect(); p.classList.add("dance"); });
  setTimeout(() => $$(".pal.dance").forEach(p => p.classList.remove("dance")), 1600);
}
function palLifeInit() {
  document.addEventListener("click", e => {
    const b = e.target.closest(".pal-tap"); if (b) palTapped(b);
    const r = e.target.closest(".read-aloud");
    if (r) { const p = r.parentNode.querySelector("p"); if (p) speak(p.textContent); }
  });
}
