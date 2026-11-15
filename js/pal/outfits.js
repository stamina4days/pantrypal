"use strict";
/* Pal dresses for the season. Drawn in the space above Pal's head (y below 6). */
function palSeason(d) {
  d = d || new Date();
  const m = d.getMonth(), day = d.getDate();
  if (m === 9) return "fall-pumpkin";                  // October
  if (m === 11 && day >= 15) return "winter-holiday";  // late December
  if (m === 11 || m <= 1) return "winter";             // Dec, Jan, Feb
  if (m <= 4) return "spring";                         // Mar to May
  if (m <= 7) return "summer";                         // Jun to Aug
  return "fall";                                       // Sep, Nov
}
function palOutfit() {
  if (settings.palOutfits === false) return "";
  const ink = 'stroke="var(--ink)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  switch (palSeason()) {
    case "winter":          // knit hat with a pom-pom, and a scarf
      return `<path d="M30 8c0-18 60-18 60 0z" fill="#2E8FC7" ${ink}/><path d="M26 8h68" ${ink}/><circle cx="60" cy="-14" r="7" fill="#FFFDF6" ${ink}/>
        <path d="M14 112c20 8 72 8 92 0v10c-20 8-72 8-92 0z" fill="#E5482F" ${ink}/><path d="M84 120v16l10-2v-14" fill="#E5482F" ${ink}/>`;
    case "winter-holiday":  // red hat with a white trim
      return `<path d="M32 8c4-20 30-30 50-18l14 12c-6-2-10 0-12 6z" fill="#E5482F" ${ink}/><path d="M26 6h64v8H26z" fill="#FFFDF6" ${ink}/><circle cx="98" cy="4" r="7" fill="#FFFDF6" ${ink}/>`;
    case "spring":          // a flower tucked behind the "ear"
      return `<g transform="translate(96 4)"><circle cx="0" cy="-9" r="7" fill="#F4A6A0" ${ink}/><circle cx="9" cy="0" r="7" fill="#F4A6A0" ${ink}/><circle cx="0" cy="9" r="7" fill="#F4A6A0" ${ink}/><circle cx="-9" cy="0" r="7" fill="#F4A6A0" ${ink}/><circle cx="0" cy="0" r="5" fill="#FFD23F" ${ink}/></g>`;
    case "summer":          // straw sun hat
      return `<ellipse cx="60" cy="6" rx="52" ry="9" fill="#F3D27A" ${ink}/><path d="M34 6c0-22 52-22 52 0z" fill="#F3D27A" ${ink}/><path d="M35 0h50" stroke="#E5482F" stroke-width="6"/>`;
    case "fall-pumpkin":    // a little pumpkin on top
      return `<path d="M60 -12v-8c0-4 6-6 8-2" fill="none" ${ink}/><ellipse cx="60" cy="-2" rx="22" ry="13" fill="#F28C28" ${ink}/><path d="M50 -12c-4 8-4 14 0 22M70 -12c4 8 4 14 0 22" fill="none" stroke="var(--ink)" stroke-width="3"/>`;
    default:                // fall: a cozy scarf
      return `<path d="M14 112c20 8 72 8 92 0v10c-20 8-72 8-92 0z" fill="#F28C28" ${ink}/><path d="M30 120v16l10-2v-14" fill="#F28C28" ${ink}/><path d="M34 122v8" stroke="#FFD23F" stroke-width="3"/>`;
  }
}
