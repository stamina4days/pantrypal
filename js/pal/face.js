"use strict";
/* Pal, your fridge buddy: faces, moods, what Pal says, and the little food emoji
   that make lists feel alive. Loaded after extras.js. */

/* ---------- Pal's face ---------- */
function palSVG(mood, size) {
  const s = size || 64;
  const eye = (x) => `<circle class="pe" cx="${x}" cy="80" r="5.5" fill="var(--pal-ink)"/>`;
  const happyEye = (x) => `<path d="M${x - 7} 82 Q${x} 72 ${x + 7} 82" stroke="var(--pal-ink)" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const faces = {
    happy: eye(46) + eye(74) + `<path d="M48 94 Q60 106 72 94" stroke="var(--pal-ink)" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    wink: eye(46) + happyEye(74) + `<path d="M48 94 Q60 106 72 94" stroke="var(--pal-ink)" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    proud: happyEye(46) + happyEye(74) + `<path d="M46 92 Q60 112 74 92 Z" fill="var(--pal-ink)"/><path d="M53 100 Q60 106 67 100 Q60 98 53 100" fill="#F28B9C"/>`
      + `<path d="M100 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="var(--lemon)"/><path d="M16 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="var(--lemon)"/>`,
    worried: eye(46) + eye(74) + `<path d="M37 68 L52 72 M83 68 L68 72" stroke="var(--pal-ink)" stroke-width="3.5" stroke-linecap="round"/>`
      + `<path d="M49 100 Q54 95 59 100 Q64 105 70 100" stroke="var(--pal-ink)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      + `<path d="M93 60 Q98 68 93 72 Q88 68 93 60z" fill="#7CC6F2"/>`,
    hungry: eye(46) + eye(74) + `<ellipse cx="60" cy="99" rx="7" ry="7.5" fill="var(--pal-ink)"/>`
  };
  return `<svg class="pal pal-${mood}" width="${s}" height="${Math.round(s * 1.35)}" viewBox="0 -22 120 162" aria-hidden="true">
    <rect x="14" y="128" width="16" height="8" rx="4" fill="var(--pal-ink)"/><rect x="90" y="128" width="16" height="8" rx="4" fill="var(--pal-ink)"/>
    <rect x="10" y="6" width="100" height="126" rx="24" fill="var(--pal-body)" stroke="var(--pal-ink)" stroke-width="4"/>
    <path d="M12 48 H108" stroke="var(--pal-ink)" stroke-width="4"/>
    <rect x="88" y="18" width="7" height="20" rx="3.5" fill="var(--pal-ink)"/><rect x="88" y="58" width="7" height="18" rx="3.5" fill="var(--pal-ink)"/>
    <circle cx="32" cy="28" r="9" fill="var(--tomato)"/><path d="M32 19 Q36 13 41 15" stroke="var(--leaf)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="94" rx="7" ry="4.5" fill="#F7A8B8" opacity=".75"/><ellipse cx="86" cy="94" rx="7" ry="4.5" fill="#F7A8B8" opacity=".75"/>
    ${faces[mood] || faces.happy}
    ${palOutfit()}
  </svg>`;
}
function palBubble(mood, msg, actions, cls) {
  return `<div class="pal-row ${cls || ""}"><button type="button" class="pal-tap" aria-label="${esc(t("Say hi to Pal"))}">${palSVG(mood, 58)}</button><div class="bubble">${"speechSynthesis" in window ? `<button type="button" class="read-aloud" aria-label="${esc(t("Read this to me"))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/speaker.svg#i"/></svg></button>` : ""}<p>${esc(msg)}</p>${actions && actions.length
    ? `<div class="bubble-actions">${actions.map(a => `<button ${a.attrs}>${esc(a.label)}</button>`).join("")}</div>` : ""}</div></div>`;
}
