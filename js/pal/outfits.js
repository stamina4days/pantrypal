"use strict";
/* Benji's hats. Seasonal hats are always his; the rest unlock when you earn a badge.
   Each hat sits on the top curve of the dollar sign, and "lift" moves the sprout up so it pokes out the top. */
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

const HAT_INK = 'stroke="var(--pal-ink)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
const hatDome = fill => `<path d="M38 22 C38 -20 122 -20 122 22 Z" fill="${fill}" ${HAT_INK}/>`;
const hatBand = fill => `<rect x="34" y="14" width="92" height="13" rx="6.5" fill="${fill}" ${HAT_INK}/>`;
const hatRibs = color => `<path d="M58 -8 V14 M80 -11 V14 M102 -8 V14" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;

/* unlock: the badge that earns the hat. season: worn automatically in that season. game: won in the Play corner. */
const BENJI_HATS = [
  { id: "fall", name: "Fall beanie", season: true, lift: 18, art: () => hatDome("#F28C28") + hatRibs("#C4651A") + hatBand("#FFD23F") },
  { id: "fall-pumpkin", name: "Pumpkin hat", season: true, lift: 16,
    art: () => `<path d="M40 22 C34 -18 126 -18 120 22 Z" fill="#F28C28" ${HAT_INK}/><path d="M62 -10 C56 2 56 14 60 22 M98 -10 C104 2 104 14 100 22 M80 -13 V22" fill="none" stroke="#C4651A" stroke-width="3" stroke-linecap="round"/>` },
  { id: "winter", name: "Winter beanie", season: true, lift: 18, art: () => hatDome("#2E8FC7") + hatRibs("#1F6E9C") + hatBand("#F6EBD9") },
  { id: "winter-holiday", name: "Holiday hat", season: true, lift: 18,
    art: () => `<path d="M38 20 C40 -14 76 -24 104 -10 C122 -2 138 6 146 24 C132 14 122 12 118 20 Z" fill="#E5482F" ${HAT_INK}/>` + hatBand("#FFFDF6") + `<circle cx="146" cy="28" r="9" fill="#FFFDF6" ${HAT_INK}/>` },
  { id: "spring", name: "Spring flower", season: true, lift: 0,
    art: () => `<g transform="translate(122 30)"><circle cx="0" cy="-9" r="7" fill="#F4A6A0" ${HAT_INK}/><circle cx="9" cy="0" r="7" fill="#F4A6A0" ${HAT_INK}/><circle cx="0" cy="9" r="7" fill="#F4A6A0" ${HAT_INK}/><circle cx="-9" cy="0" r="7" fill="#F4A6A0" ${HAT_INK}/><circle cx="0" cy="0" r="5" fill="#FFD23F" ${HAT_INK}/></g>` },
  { id: "summer", name: "Sun hat", season: true, lift: 18,
    art: () => `<ellipse cx="80" cy="20" rx="66" ry="10" fill="#F3D27A" ${HAT_INK}/><path d="M46 20 C46 -18 114 -18 114 20 Z" fill="#F3D27A" ${HAT_INK}/><path d="M47 10 H113" stroke="#E5482F" stroke-width="7"/>` },
  { id: "chef", name: "Chef's hat", unlock: "first-cook", lift: 34,
    art: () => `<circle cx="56" cy="-6" r="15" fill="#FFFFFF" ${HAT_INK}/><circle cx="104" cy="-6" r="15" fill="#FFFFFF" ${HAT_INK}/><circle cx="80" cy="-16" r="18" fill="#FFFFFF" ${HAT_INK}/>`
      + `<path d="M50 4 C62 -2 98 -2 110 4" fill="none" stroke="#FFFFFF" stroke-width="10"/><rect x="44" y="2" width="72" height="20" rx="5" fill="#FFFFFF" ${HAT_INK}/><path d="M60 6 V18 M80 6 V18 M100 6 V18" stroke="#D9CFC2" stroke-width="2.5" stroke-linecap="round"/>` },
  { id: "turkey", name: "Turkey hat", unlock: "rescue-10", lift: 24,
    // A roast turkey worn upside down: the back sits on Benji's head and the drumsticks point up like horns.
    art: () => {
      // Each drumstick: a plump meaty part near the body, narrowing to a bone at the top
      const leg = (x1, y1, mx, my, x2, y2) => {
        const seg = (ax, ay, bx, by, w, c) => `<path d="M${ax} ${ay} L${bx} ${by}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
        return seg(mx, my, x2, y2, 15, "var(--pal-ink)") + seg(x1, y1, mx, my, 27, "var(--pal-ink)")
          + seg(mx, my, x2, y2, 8, "#D9A06A") + seg(x1, y1, mx, my, 20, "#B9682E")
          + `<path d="M${x1 + (mx - x1) * .25 - 3} ${y1 + (my - y1) * .25} L${x1 + (mx - x1) * .75 - 3} ${y1 + (my - y1) * .75}" stroke="#E0A060" stroke-width="4" stroke-linecap="round"/>`;
      };
      const bone = (x, y) => `<circle cx="${x - 4}" cy="${y}" r="5" fill="#FFF8EC" ${HAT_INK.replace('stroke-width="4"', 'stroke-width="3"')}/><circle cx="${x + 4}" cy="${y}" r="5" fill="#FFF8EC" ${HAT_INK.replace('stroke-width="4"', 'stroke-width="3"')}/>`;
      return leg(58, -8, 44, -28, 36, -44) + leg(102, -8, 116, -28, 124, -44) + bone(33, -49) + bone(127, -49)
        + `<path d="M34 22 C30 -10 54 -22 80 -22 C106 -22 130 -10 126 22 Z" fill="#C97B3C" ${HAT_INK}/>`
        + `<path d="M48 0 C56 -12 70 -16 82 -16" fill="none" stroke="#E8A866" stroke-width="5" stroke-linecap="round"/>`
        + `<path d="M40 16 Q60 8 80 14 Q100 20 120 12" fill="none" stroke="#9A5524" stroke-width="3" stroke-linecap="round"/>`
        + `<path d="M34 22 H126" ${HAT_INK}/>`;
    } },
  { id: "party", name: "Party hat", unlock: "streak-7", lift: 0,
    art: () => `<g transform="rotate(18 108 10)"><path d="M90 16 L108 -34 L126 16 Z" fill="#7CC6F2" ${HAT_INK}/><path d="M97 -3 L119 -3 M93 8 L123 8" stroke="#F4D27A" stroke-width="5"/><circle cx="108" cy="-36" r="7" fill="#E5482F" ${HAT_INK}/><path d="M86 18 Q108 24 130 18" fill="none" ${HAT_INK}/></g>` },
  { id: "tophat", name: "Top hat", unlock: "saver", lift: 30,
    art: () => `<ellipse cx="80" cy="16" rx="50" ry="8" fill="#2E2724" ${HAT_INK}/><path d="M56 16 V-18 C56 -22 104 -22 104 -18 V16 Z" fill="#2E2724" ${HAT_INK}/><rect x="56" y="2" width="48" height="9" fill="#5FAE6E"/><path d="M56 2 H104 M56 11 H104" stroke="var(--pal-ink)" stroke-width="2"/>` },
  { id: "crown", name: "Crown", unlock: "zero-waste-week", lift: 20,
    art: () => `<path d="M42 22 L40 -10 L58 4 L80 -18 L102 4 L120 -10 L118 22 Z" fill="#F4C542" ${HAT_INK}/><circle cx="61" cy="14" r="4" fill="#E5482F"/><circle cx="80" cy="13" r="4.5" fill="#2E8FC7"/><circle cx="99" cy="14" r="4" fill="#5FAE6E"/><circle cx="40" cy="-12" r="4" fill="#F4C542" ${HAT_INK}/><circle cx="120" cy="-12" r="4" fill="#F4C542" ${HAT_INK}/>` },
  { id: "beret", name: "Beret", unlock: "world-kitchen", lift: 12,
    art: () => `<ellipse cx="84" cy="8" rx="48" ry="15" transform="rotate(-8 84 8)" fill="#C8463A" ${HAT_INK}/><path d="M42 18 C60 24 104 22 126 8" fill="none" stroke="#9E3329" stroke-width="3" stroke-linecap="round"/>` },
  { id: "nightcap", name: "Night cap", unlock: "night-owl", lift: 18,
    art: () => `<path d="M122 20 C120 -14 84 -24 56 -10 C38 -2 22 6 14 24 C28 14 38 12 42 20 Z" fill="#6B7FD7" ${HAT_INK}/><path d="M100 -12 C92 0 92 10 94 18 M74 -16 C68 -4 66 8 68 18 M50 -6 C46 4 46 12 48 18" fill="none" stroke="#F4D27A" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>` + hatBand("#FFFDF6") + `<circle cx="14" cy="28" r="9" fill="#FFFDF6" ${HAT_INK}/>` },
  { id: "cap", name: "Ball cap", unlock: "little-helper", lift: 18,
    art: () => `<path d="M112 16 C130 14 150 18 152 24 C140 28 120 26 108 24 Z" fill="#F6EBD9" ${HAT_INK}/><path d="M38 22 C38 -20 122 -20 122 22 Z" fill="#5FAE6E" ${HAT_INK}/><path d="M80 -11 V20 M56 -4 Q60 8 60 20 M104 -4 Q100 8 100 20" fill="none" stroke="#3F8650" stroke-width="2.5"/><path d="M38 22 H122" ${HAT_INK}/>` },
  // Won by playing games in the Play corner
  { id: "sweatband", name: "Sweatband", unlock: "sort-5", game: true, lift: 0,
    art: () => `<path d="M36 34 C44 12 116 12 124 34 L124 46 C116 26 44 26 36 46 Z" fill="#E5482F" ${HAT_INK}/><path d="M38 37 C48 18 112 18 122 37 M38 43 C48 24 112 24 122 43" fill="none" stroke="#FFFDF6" stroke-width="2.5" stroke-linecap="round"/>` },
  { id: "propeller", name: "Propeller cap", unlock: "sort-perfect", game: true, lift: 24,
    art: () => `<path d="M40 22 C40 -16 120 -16 120 22 Z" fill="#2E8FC7" ${HAT_INK}/><path d="M80 -8 V22" stroke="#F4C542" stroke-width="7"/><path d="M48 4 C60 -2 100 -2 112 4" fill="none" stroke="#E5482F" stroke-width="6"/>`
      + `<path d="M80 -8 V-20" ${HAT_INK}/><ellipse cx="62" cy="-24" rx="18" ry="5" fill="#F4C542" ${HAT_INK}/><ellipse cx="98" cy="-24" rx="18" ry="5" fill="#E5482F" ${HAT_INK}/><circle cx="80" cy="-23" r="4.5" fill="#FFFDF6" ${HAT_INK}/>` },
  { id: "gradcap", name: "Graduation cap", unlock: "word-3", game: true, lift: 22,
    art: () => `<path d="M50 22 V6 C62 12 98 12 110 6 V22 Z" fill="#2E2724" ${HAT_INK}/><path d="M80 -14 L136 0 L80 14 L24 0 Z" fill="#2E2724" ${HAT_INK}/>`
      + `<path d="M80 0 L124 4 V26" fill="none" stroke="#F4C542" stroke-width="3" stroke-linecap="round"/><path d="M119 24 L124 38 L129 24 Z" fill="#F4C542" stroke="#9C7A1C" stroke-width="1.5" stroke-linejoin="round"/><circle cx="80" cy="0" r="3.5" fill="#F4C542"/>` },
  { id: "wizard", name: "Wizard hat", unlock: "word-streak-5", game: true, lift: 18,
    art: () => `<path d="M40 20 C56 -4 70 -40 92 -62 C94 -34 108 -6 120 20 Z" fill="#6B4FB8" ${HAT_INK}/><ellipse cx="80" cy="20" rx="56" ry="9" fill="#6B4FB8" ${HAT_INK}/>`
      + `<path d="M70 -6 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#F4C542"/><circle cx="96" cy="-24" r="3" fill="#F4C542"/><circle cx="88" cy="6" r="2.5" fill="#F4C542"/><circle cx="62" cy="10" r="2" fill="#F4C542"/>` },
  { id: "detective", name: "Detective cap", unlock: "sort-checks-25", game: true, lift: 20,
    art: () => `<path d="M30 24 C34 14 46 14 50 20 Z" fill="#B08A5A" ${HAT_INK}/><path d="M110 20 C114 14 126 14 132 24 Z" fill="#B08A5A" ${HAT_INK}/>`
      + `<path d="M40 22 C40 -18 120 -18 120 22 Z" fill="#C9A26B" ${HAT_INK}/><path d="M60 -10 V20 M80 -13 V20 M100 -10 V20 M44 2 H116 M42 12 H118" stroke="#8C6A3E" stroke-width="2.5" stroke-linecap="round"/>`
      + `<path d="M80 -14 C72 -24 68 -18 74 -14 M80 -14 C88 -24 92 -18 86 -14" fill="none" stroke="#8C6A3E" stroke-width="3" stroke-linecap="round"/><path d="M40 22 H120" ${HAT_INK}/>` }
];
const benjiHat = id => BENJI_HATS.find(h => h.id === id);

/* Is this hat Benji's yet? */
function hatUnlocked(h) {
  if (!h || !h.unlock) return !!h;
  if (typeof badgeList !== "function") return false;
  try { const b = badgeList().find(x => x.id === h.unlock); return !!(b && b.done); } catch (e) { return false; }
}

/* The hat Benji has on: "season" (the default) follows the calendar, "none" is no hat, or a hat you picked. */
function benjiHatChoice() {
  if (typeof settings === "undefined") return "season";
  if (settings.benjiHat) return settings.benjiHat;
  return settings.palOutfits === false ? "none" : "season";
}
function palOutfit(forceId) {
  const choice = forceId || benjiHatChoice();
  if (choice === "none") return { art: "", lift: 0 };
  let h = choice === "season" ? benjiHat(palSeason()) : benjiHat(choice);
  if (!forceId && h && !h.season && !hatUnlocked(h)) h = benjiHat(palSeason());
  return h ? { art: h.art(), lift: h.lift } : { art: "", lift: 0 };
}
