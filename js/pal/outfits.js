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

/* unlock: the badge that earns the hat. season: worn automatically in that season. game: won in the Play corner.
   shop: the shop item (data/store.js) that includes it. */
const BENJI_HATS = [
  { id: "fall", name: "Fall beanie", season: true, lift: 18, art: () => hatDome("#F28C28") + hatRibs("#C4651A") + hatBand("#FFD23F") },
  { id: "fall-pumpkin", name: "Jack-o'-lantern hat", season: true, lift: 0, noSprout: true,
    // A carved pumpkin worn as a hat, glowing through its eyes and grin, with its own stem and vine on top
    art: () => `<path d="M30 24 C18 -6 34 -38 62 -38 C70 -42 90 -42 98 -38 C126 -38 142 -6 130 24 C112 30 48 30 30 24 Z" fill="#F28C28" ${HAT_INK}/>`
      + `<path d="M58 -36 C44 -20 42 4 48 26 M102 -36 C116 -20 118 4 112 26 M80 -40 V-30" fill="none" stroke="#C4651A" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M50 -8 L64 -28 L72 -6 Z M110 -8 L96 -28 L88 -6 Z M76 -2 L80 -10 L84 -2 Z" fill="#FFD23F" stroke="#7A3A0E" stroke-width="2.5" stroke-linejoin="round"/>`
      + `<path d="M44 2 C58 24 102 24 116 2 L108 4 L104 12 L96 6 L90 14 L84 7 L76 7 L70 14 L64 6 L56 12 L52 4 Z" fill="#FFD23F" stroke="#7A3A0E" stroke-width="2.5" stroke-linejoin="round"/>`
      + `<path d="M76 -40 C74 -50 78 -56 86 -58 L88 -52 C84 -50 82 -46 84 -40 Z" fill="#5C7A2E" ${HAT_INK}/><path d="M86 -50 C96 -58 106 -52 102 -44 C100 -40 94 -42 96 -46" fill="none" stroke="#3F8650" stroke-width="3" stroke-linecap="round"/>` },
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
      + `<path d="M80 -14 C72 -24 68 -18 74 -14 M80 -14 C88 -24 92 -18 86 -14" fill="none" stroke="#8C6A3E" stroke-width="3" stroke-linecap="round"/><path d="M40 22 H120" ${HAT_INK}/>` },
  // From Benji's shop (the Fun hat pack)
  { id: "cowboy", name: "Cowboy hat", shop: "hats-fun", lift: 26,
    art: () => `<path d="M12 16 C30 32 130 32 148 16 C140 8 124 12 116 16 L110 -10 C106 -22 90 -16 80 -11 C70 -16 54 -22 50 -10 L44 16 C36 12 20 8 12 16 Z" fill="#B5793F" ${HAT_INK}/>`
      + `<path d="M46 6 C66 10 94 10 114 6" fill="none" stroke="#6E4524" stroke-width="7"/><path d="M80 -11 C80 -4 80 0 80 4" stroke="#8C5A2E" stroke-width="3" stroke-linecap="round"/>` },
  { id: "pirate", name: "Pirate hat", shop: "hats-fun", lift: 24,
    art: () => `<path d="M22 20 C36 -6 58 -24 80 -26 C102 -24 124 -6 138 20 C110 10 50 10 22 20 Z" fill="#2E2724" ${HAT_INK}/>`
      + `<path d="M30 15 C56 6 104 6 130 15" fill="none" stroke="#F4C542" stroke-width="3.5"/><circle cx="80" cy="-6" r="7" fill="#FFFDF6"/><circle cx="77.5" cy="-7" r="1.6" fill="#2E2724"/><circle cx="82.5" cy="-7" r="1.6" fill="#2E2724"/>`
      + `<path d="M70 4 L90 10 M90 4 L70 10" stroke="#FFFDF6" stroke-width="3" stroke-linecap="round"/>` },
  { id: "viking", name: "Viking helmet", shop: "hats-fun", lift: 20,
    art: () => `<path d="M42 8 C24 2 16 -18 20 -36 C28 -22 40 -14 50 -8 Z" fill="#FFF8EC" ${HAT_INK}/><path d="M118 8 C136 2 144 -18 140 -36 C132 -22 120 -14 110 -8 Z" fill="#FFF8EC" ${HAT_INK}/>`
      + `<path d="M38 22 C38 -18 122 -18 122 22 Z" fill="#AEB8C0" ${HAT_INK}/><path d="M80 -16 V16" stroke="#8B969E" stroke-width="6"/>` + hatBand("#9C7A4A")
      + `<circle cx="50" cy="20.5" r="2.5" fill="#F4C542"/><circle cx="80" cy="20.5" r="2.5" fill="#F4C542"/><circle cx="110" cy="20.5" r="2.5" fill="#F4C542"/>` },
  { id: "frog", name: "Frog hat", shop: "hats-fun", lift: 26,
    art: () => hatDome("#7CC36A") + `<circle cx="56" cy="-14" r="13" fill="#FFFFFF" ${HAT_INK}/><circle cx="104" cy="-14" r="13" fill="#FFFFFF" ${HAT_INK}/>`
      + `<circle cx="58" cy="-12" r="5.5" fill="#2E2724"/><circle cx="102" cy="-12" r="5.5" fill="#2E2724"/><path d="M62 8 C72 16 88 16 98 8" fill="none" stroke="#2F6B24" stroke-width="3.5" stroke-linecap="round"/>`
      + `<circle cx="50" cy="10" r="4" fill="#F4A6A0"/><circle cx="110" cy="10" r="4" fill="#F4A6A0"/>` + hatBand("#4FA046") },
  // From Benji's shop: the Holiday hat pack
  { id: "elf", name: "Elf hat", shop: "hats-holiday", lift: 0, noSprout: true, art: () =>
    `<path d="M40 20 C46 -10 70 -34 100 -40 C112 -42 124 -36 130 -26 C120 -30 110 -28 104 -20 C114 -6 118 6 120 20 Z" fill="#3E9B4F" ${HAT_INK}/>`
    + `<path d="M36 26 L46 10 L56 26 L66 10 L76 26 L86 10 L96 26 L106 10 L116 26 L124 14" fill="#E5482F" ${HAT_INK}/>`
    + `<circle cx="132" cy="-24" r="8" fill="#F4C542" ${HAT_INK}/><path d="M128 -22 H136" stroke="var(--pal-ink)" stroke-width="2"/>` },
  { id: "antlers", name: "Reindeer antlers", shop: "hats-holiday", lift: 0, art: () => {
    const a = (s) => `<g transform="translate(80 0) scale(${s} 1)"><path d="M-30 18 C-34 0 -40 -14 -52 -30 M-40 -12 C-50 -14 -58 -10 -64 -2 M-46 -22 C-46 -34 -40 -42 -32 -46" fill="none" stroke="var(--pal-ink)" stroke-width="11" stroke-linecap="round"/><path d="M-30 18 C-34 0 -40 -14 -52 -30 M-40 -12 C-50 -14 -58 -10 -64 -2 M-46 -22 C-46 -34 -40 -42 -32 -46" fill="none" stroke="#9C6A3C" stroke-width="5" stroke-linecap="round"/></g>`;
    return a(1) + a(-1) + `<path d="M38 26 C44 4 116 4 122 26" fill="none" stroke="var(--pal-ink)" stroke-width="9" stroke-linecap="round"/><path d="M38 26 C44 4 116 4 122 26" fill="none" stroke="#E5482F" stroke-width="4" stroke-linecap="round"/>`; } },
  { id: "witch", name: "Witch hat", shop: "hats-holiday", lift: 0, noSprout: true, art: () =>
    `<path d="M48 18 C58 -8 64 -36 78 -56 C88 -60 98 -54 108 -62 C102 -48 98 -38 100 -26 C104 -6 108 8 112 18 Z" fill="#3A2E4A" ${HAT_INK}/>`
    + `<ellipse cx="80" cy="20" rx="64" ry="10" fill="#3A2E4A" ${HAT_INK}/><path d="M50 8 C66 13 94 13 110 8 L111 15 C94 20 66 20 49 15 Z" fill="#8A5AB8" ${HAT_INK}/>`
    + `<rect x="73" y="7" width="14" height="12" rx="2" fill="none" stroke="#F4C542" stroke-width="3"/>` },
  { id: "bunny", name: "Bunny ears", shop: "hats-holiday", lift: 0, art: () =>
    `<path d="M58 22 C46 -10 44 -44 56 -52 C70 -50 72 -14 70 18 Z" fill="#FFFFFF" ${HAT_INK}/><path d="M60 8 C54 -14 54 -36 58 -42 C64 -36 64 -14 64 6 Z" fill="#F7B6C8"/>`
    + `<path d="M102 22 C114 -10 120 -40 110 -50 C96 -50 90 -14 90 18 Z" fill="#FFFFFF" ${HAT_INK}/><path d="M100 8 C106 -14 110 -34 106 -40 C100 -34 96 -14 96 6 Z" fill="#F7B6C8"/>`
    + `<path d="M38 26 C44 4 116 4 122 26" fill="none" stroke="var(--pal-ink)" stroke-width="9" stroke-linecap="round"/><path d="M38 26 C44 4 116 4 122 26" fill="none" stroke="#F7B6C8" stroke-width="4" stroke-linecap="round"/>` },
  // The Food hat pack
  { id: "taco", name: "Taco hat", shop: "hats-food", lift: 24, art: () =>
    `<path d="M34 22 C34 -22 126 -22 126 22" fill="#7CC36A" ${HAT_INK}/><circle cx="58" cy="-6" r="7" fill="#E5482F" ${HAT_INK}/><circle cx="96" cy="-10" r="7" fill="#E5482F" ${HAT_INK}/><path d="M66 -12 l6 -6 6 6 M84 -14 l5 -5 5 5" fill="none" stroke="#F4C542" stroke-width="4" stroke-linecap="round"/>`
    + `<path d="M30 24 C30 -10 130 -10 130 24 C120 18 40 18 30 24 Z" fill="#F2C14E" ${HAT_INK}/><path d="M48 6 l2 3 M72 0 l2 3 M98 2 l2 3 M114 10 l2 3" stroke="#C98A1E" stroke-width="3" stroke-linecap="round"/>` },
  { id: "sushi", name: "Sushi hat", shop: "hats-food", lift: 26, art: () =>
    `<rect x="40" y="-6" width="80" height="30" rx="12" fill="#FFFDF6" ${HAT_INK}/><path d="M50 4 h4 M66 12 h4 M90 2 h4 M104 14 h4" stroke="#D9CFC0" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M34 -4 C40 -20 120 -24 128 -6 C120 -2 44 2 34 -4 Z" fill="#F28C5A" ${HAT_INK}/><path d="M52 -12 C60 -8 66 -8 72 -14 M82 -14 C90 -10 96 -10 104 -16" fill="none" stroke="#FFFDF6" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="74" y="-4" width="12" height="28" rx="2" fill="#3B4F40" stroke="var(--pal-ink)" stroke-width="3"/>` },
  { id: "pizza", name: "Pizza slice hat", shop: "hats-food", lift: 0, noSprout: true, art: () =>
    `<path d="M40 16 L80 -58 L120 16 Z" fill="#F4C542" ${HAT_INK}/><path d="M48 12 L80 -48 L112 12" fill="none" stroke="#E5482F" stroke-width="5" stroke-linejoin="round" opacity=".6"/>`
    + `<circle cx="80" cy="-24" r="7" fill="#C8463A" ${HAT_INK}/><circle cx="66" cy="2" r="7" fill="#C8463A" ${HAT_INK}/><circle cx="96" cy="-2" r="6" fill="#C8463A" ${HAT_INK}/>`
    + `<rect x="34" y="10" width="92" height="16" rx="8" fill="#D9934A" ${HAT_INK}/>` },
  { id: "cupcake", name: "Cupcake hat", shop: "hats-food", lift: 30, art: () =>
    `<path d="M44 26 L50 0 H110 L116 26 Z" fill="#7FC4E8" ${HAT_INK}/><path d="M60 2 L58 24 M72 2 L71 24 M88 2 L89 24 M100 2 L102 24" stroke="#4E9CC4" stroke-width="2.5"/>`
    + `<path d="M40 2 C34 -10 46 -18 56 -14 C56 -30 76 -34 82 -24 C90 -36 112 -30 108 -14 C120 -16 126 -4 120 2 Z" fill="#F7B6C8" ${HAT_INK}/>`
    + `<circle cx="64" cy="-12" r="2" fill="#F4C542"/><circle cx="92" cy="-8" r="2" fill="#7CC36A"/><circle cx="78" cy="-4" r="2" fill="#2E8FC7"/><circle cx="82" cy="-38" r="7" fill="#E5482F" ${HAT_INK}/><path d="M82 -45 C84 -52 90 -54 94 -54" fill="none" stroke="var(--pal-ink)" stroke-width="3" stroke-linecap="round"/>` },
  // The Job hat pack
  { id: "firefighter", name: "Firefighter helmet", shop: "hats-jobs", lift: 22, art: () =>
    `<path d="M24 22 C30 14 40 14 44 18 C44 -20 116 -20 116 18 C120 14 132 14 140 24 C120 30 40 30 24 22 Z" fill="#D93B30" ${HAT_INK}/>`
    + `<path d="M80 -14 V16" stroke="#B52E25" stroke-width="6"/><path d="M66 -4 H94 V14 C94 18 66 18 66 14 Z" fill="#F4C542" ${HAT_INK}/><text x="80" y="11" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="11" fill="#2E2724">FF</text>` },
  { id: "hardhat", name: "Hard hat", shop: "hats-jobs", lift: 34, art: () =>
    `<path d="M22 24 C22 18 34 16 44 18 H116 C132 16 146 18 150 24 C150 28 22 30 22 24 Z" fill="#FFD23F" ${HAT_INK}/>`
    + `<path d="M42 20 C40 -6 54 -26 80 -28 C106 -26 120 -6 118 20 Z" fill="#FFD23F" ${HAT_INK}/>`
    + `<path d="M70 -26 C68 -10 68 6 70 20 H90 C92 6 92 -10 90 -26 C84 -29 76 -29 70 -26 Z" fill="#F2B705" ${HAT_INK}/>`
    + `<path d="M46 8 H66 M94 8 H114" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/><path d="M46 8 H66 M94 8 H114" stroke="#E5482F" stroke-width="2" stroke-dasharray="4 4"/>` },
  { id: "astronaut", name: "Space helmet", shop: "hats-jobs", lift: 34, art: () =>
    `<path d="M32 26 C26 -36 134 -36 128 26 Z" fill="#F2F5F8" ${HAT_INK}/>`
    + `<path d="M46 8 C46 -18 114 -18 114 8 C98 16 62 16 46 8 Z" fill="#F4C542" ${HAT_INK}/><path d="M56 -4 C62 -10 72 -12 80 -11" fill="none" stroke="#FFF3C4" stroke-width="4" stroke-linecap="round"/>`
    + `<circle cx="30" cy="12" r="9" fill="#AEB8C0" ${HAT_INK}/><circle cx="130" cy="12" r="9" fill="#AEB8C0" ${HAT_INK}/><rect x="30" y="20" width="100" height="10" rx="5" fill="#AEB8C0" ${HAT_INK}/>`
    + `<circle cx="80" cy="25" r="3" fill="#2E8FC7"/>` },
  { id: "pilot", name: "Pilot cap", shop: "hats-jobs", lift: 20, art: () =>
    `<path d="M36 16 C30 -8 130 -8 124 16 Z" fill="#23365A" ${HAT_INK}/><path d="M42 12 H118 V22 H42 Z" fill="#1A2740" ${HAT_INK}/><path d="M44 22 C60 32 100 32 116 22 Z" fill="#111A2C" ${HAT_INK}/>`
    + `<path d="M62 2 C70 6 74 4 80 0 C86 4 90 6 98 2" fill="none" stroke="#F4C542" stroke-width="3.5" stroke-linecap="round"/><circle cx="80" cy="1" r="3.5" fill="#F4C542"/><path d="M46 14 H114" stroke="#F4C542" stroke-width="2"/>` }
];
const benjiHat = id => BENJI_HATS.find(h => h.id === id);

/* Is this hat Benji's yet? */
function hatUnlocked(h) {
  if (h && h.shop) return typeof ownsItem === "function" && ownsItem(h.shop);
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
  return h ? { art: h.art(), lift: h.lift, noSprout: !!h.noSprout } : { art: "", lift: 0 };
}

/* Benji's outfits, from the outfit pack in Benji's shop. Worn with any hat. layer "face" draws on top of his face. */
const BENJI_OUTFITS = [
  { id: "glasses", name: "Round glasses", layer: "face", art: () =>
    `<circle cx="70" cy="86" r="11.5" fill="rgba(191,227,244,.35)" stroke="var(--pal-ink)" stroke-width="3.2"/><circle cx="93" cy="84" r="11.5" fill="rgba(191,227,244,.35)" stroke="var(--pal-ink)" stroke-width="3.2"/>`
    + `<path d="M81 85 Q82 82 83 84 M58.5 86 L50 82 M104.5 83 L114 78" fill="none" stroke="var(--pal-ink)" stroke-width="3" stroke-linecap="round"/>` },
  { id: "bowtie", name: "Bow tie", art: () =>
    `<path d="M84 110 L66 100 L64 120 Z" fill="#E5482F" stroke="var(--pal-ink)" stroke-width="3" stroke-linejoin="round"/><path d="M84 110 L102 100 L104 120 Z" fill="#E5482F" stroke="var(--pal-ink)" stroke-width="3" stroke-linejoin="round"/>`
    + `<rect x="78" y="104" width="12" height="12" rx="3" fill="#C43820" stroke="var(--pal-ink)" stroke-width="3"/><circle cx="72" cy="110" r="1.6" fill="#FFFDF6"/><circle cx="96" cy="110" r="1.6" fill="#FFFDF6"/>` },
  { id: "scarf", name: "Cozy scarf", art: () =>
    `<path d="M70 100 C86 112 112 116 130 110 L132 124 C112 130 84 126 66 114 Z" fill="#2E8FC7" stroke="var(--pal-ink)" stroke-width="3" stroke-linejoin="round"/>`
    + `<path d="M78 108 L80 120 M94 113 L95 125 M110 116 L110 128" stroke="#FFFDF6" stroke-width="3"/>`
    + `<path d="M112 122 L106 152 L120 154 L124 124 Z" fill="#2E8FC7" stroke="var(--pal-ink)" stroke-width="3" stroke-linejoin="round"/><path d="M106 152 l2 6 M112 153 l1 6 M118 154 l1 6" stroke="var(--pal-ink)" stroke-width="2.5" stroke-linecap="round"/>` },
  { id: "apron", name: "Kitchen apron", art: () => {
    const ink = 'stroke="var(--pal-ink)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"';
    return `<path d="M62 104 L48 56 M102 104 L116 58" fill="none" stroke="var(--pal-ink)" stroke-width="7" stroke-linecap="round"/><path d="M62 104 L48 56 M102 104 L116 58" fill="none" stroke="#C43820" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M60 102 H104 L106 124 C118 126 128 130 130 134 L124 180 C104 188 58 188 38 180 L32 134 C34 130 46 126 58 124 Z" fill="#E5482F" ${ink}/>`
    + `<path d="M34 134 C56 140 108 140 128 134" fill="none" stroke="#FFFDF6" stroke-width="4"/>`
    + `<path d="M32 136 C20 132 14 140 18 146 C22 150 28 144 32 140 M32 140 C24 146 22 156 26 158" fill="none" stroke="var(--pal-ink)" stroke-width="5" stroke-linecap="round"/><path d="M32 136 C20 132 14 140 18 146 C22 150 28 144 32 140 M32 140 C24 146 22 156 26 158" fill="none" stroke="#FFFDF6" stroke-width="2" stroke-linecap="round"/>`
    + `<rect x="66" y="148" width="30" height="20" rx="4" fill="#FFFDF6" ${ink}/><path d="M66 154 H96" stroke="#E5482F" stroke-width="2"/>`
    + `<path d="M82 108 C78 104 72 110 82 118 C92 110 86 104 82 108 Z" fill="#FFFDF6"/>`; } }
];
BENJI_OUTFITS.forEach(o => { o.shop = "outfits"; });
const benjiOutfitItem = id => BENJI_OUTFITS.find(o => o.id === id);
const outfitUnlocked = o => !!o && typeof ownsItem === "function" && ownsItem(o.shop);
/* The outfit Benji has on, if any and if it's his. */
function benjiOutfitNow(forceId) {
  const id = forceId || (typeof settings !== "undefined" && settings.benjiOutfit) || "";
  const o = benjiOutfitItem(id);
  return o && (forceId || outfitUnlocked(o)) ? o : null;
}
