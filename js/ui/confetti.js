"use strict";
/* A handful of falling fruit stickers for big moments. Skipped if you've asked for less motion. */
function confetti() {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["var(--tomato)", "var(--lemon)", "var(--leaf)", "var(--sea)", "var(--plum)"];
  const box = document.createElement("div");
  box.className = "confetti";
  box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("span");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = (Math.random() * .4).toFixed(2) + "s";
    p.style.animationDuration = (1.2 + Math.random() * .9).toFixed(2) + "s";
    p.style.setProperty("--spin", Math.round(Math.random() * 720 - 360) + "deg");
    p.style.setProperty("--drift", Math.round(Math.random() * 80 - 40) + "px");
    if (i % 3 === 0) p.style.borderRadius = "50%";
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2600);
}
