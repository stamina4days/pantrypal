"use strict";
/* Pal's little reactions: say hi when tapped, dance when you rescue food. */
let palTapIdx = 0, palTapCount = 0;
function palSay(row, text, hatBtn) {
  const p = row && row.querySelector(".bubble p");
  if (!p) return;
  if (!p.dataset.orig) p.dataset.orig = p.textContent;
  p.textContent = text;
  const old = row.querySelector(".pal-hat-btn"); if (old) old.remove();
  if (hatBtn) p.insertAdjacentHTML("afterend", `<button type="button" class="pal-hat-btn" data-go-hats>${esc(t("See my hats"))}</button>`);
  clearTimeout(row._palTimer);
  row._palTimer = setTimeout(() => {
    p.textContent = p.dataset.orig; delete p.dataset.orig;
    const b = row.querySelector(".pal-hat-btn"); if (b) b.remove();
  }, hatBtn ? 7000 : 4200);
}
function palTapped(btn) {
  const svg = btn.querySelector(".pal");
  if (svg) { svg.classList.remove("boing"); void svg.getBoundingClientRect(); svg.classList.add("boing"); }
  sfx("pop"); buzz(8);
  const lines = palLines("tap");
  palTapCount++;
  if (palTapCount % 4 === 0 && typeof palHatLine === "function") return palSay(btn.closest(".pal-row"), palYou(palHatLine()), true);
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
