"use strict";
/* Benji, your money-saving buddy: a dollar sign with a sprout on top. Every food you save is money saved,
   and the sprout grows as your savings do. Draws Benji's moods and poses, and his speech bubble. */

/* How big the sprout is: 0 seed, 1 sprout, 2 leafy, 3 in bloom. Grows with money saved from the trash. */
const BENJI_SPROUT_AT = [10, 50, 100];
let benjiSproutMemo = { key: "", stage: 1 };
function benjiSprout() {
  if (typeof badgeStats !== "function" || typeof history === "undefined") return 1;
  const key = history.length + ":" + (history.length ? history[history.length - 1].date : "");
  if (benjiSproutMemo.key !== key) {
    let saved = 0;
    try { saved = badgeStats().saved || 0; } catch (e) {}
    benjiSproutMemo = { key, stage: BENJI_SPROUT_AT.filter(n => saved >= n).length };
  }
  return benjiSproutMemo.stage;
}

/* ---------- Benji's drawing ---------- */
const BENJI_S = "M118 50 C112 16 46 14 44 52 C42 88 116 82 116 122 C116 164 44 166 38 132";
/* Which arms go with each mood, unless a pose is asked for. */
const BENJI_POSE = { cheer: "cheer", proud: "cheer", worried: "rest", sleepy: "rest", hungry: "hold" };

/* opts: { pose: "wave" | "rest" | "point" | "cheer" | "hold", sprout: 0 to 3, hat: a hat id to show, outfit: false for no hat,
   wear: an outfit id to show (or false for none), golden: true or false to force the golden sprout } */
function palSVG(mood, size, opts) {
  const o = opts || {};
  const s = size || 64;
  const INK = "var(--pal-ink)";
  const pose = o.pose || BENJI_POSE[mood] || "wave";
  const outfit = o.outfit === false ? { art: "", lift: 0 } : palOutfit(o.hat);
  const wear = o.wear === false ? null : (typeof benjiOutfitNow === "function" ? benjiOutfitNow(o.wear) : null);
  const golden = o.golden != null ? o.golden : (typeof benjiGolden === "function" && benjiGolden());

  /* White cartoon gloves, drawn with the fingers up and the wrist at 0,0, then turned to follow the arm. */
  const glove = (x, y, deg, kind) => {
    const parts = kind === "point"
      ? { e: [[0, -10, 8, 7.5]], l: [[2, -14, 2, -27], [-7, -8, -11, -13]] }
      : kind === "fist"
        ? { e: [[0, -10, 8.5, 8]], l: [[-7, -9, -11, -13]] }
        : { e: [[0, -11, 8, 8]], l: [[-5, -14, -6.5, -23], [0, -15, 0, -25], [5, -14, 6.5, -22], [-7, -9, -13.5, -14]] };
    const shapes = (w, fill, sw) => parts.e.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${fill}" stroke-width="${sw}"/>`).join("")
      + parts.l.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`).join("");
    const lines = kind === "point" ? `<path d="M-4 -8 Q-1 -6 2 -8 M-5 -12 Q-2 -10 1 -12" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      : kind === "fist" ? `<path d="M-3 -16 V-10 M2 -16.5 V-10 M6.5 -15 V-10" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : "";
    return `<g transform="translate(${x} ${y}) rotate(${deg})">${shapes(12, INK, 6)}${shapes(6, "var(--pal-glove)", 0)}${lines}`
      + `<rect x="-9.5" y="-4" width="19" height="9" rx="4.5" fill="var(--pal-glove)" stroke="${INK}" stroke-width="3"/></g>`;
  };
  const arm = (x0, y0, cx, cy, ex, ey, kind) => {
    const deg = (Math.atan2(ex - cx, -(ey - cy)) * 180 / Math.PI).toFixed(1);
    return `<path d="M${x0} ${y0} Q${cx} ${cy} ${ex} ${ey}" stroke="${INK}" stroke-width="5.5" fill="none" stroke-linecap="round"/>${glove(ex, ey, deg, kind)}`;
  };
  const back = {   // arms behind the body
    wave: `<g class="pal-wave">${arm(26, 60, 12, 54, 8, 38)}</g>`,
    rest: arm(28, 64, 14, 74, 14, 90),
    point: arm(28, 64, 14, 74, 14, 90),
    cheer: `<g class="pal-wave">${arm(26, 58, 10, 46, 10, 26)}</g>`,
    hold: ""
  }[pose] || "";
  const coin = `<circle cx="82" cy="134" r="17" fill="var(--lemon, #F4D27A)" stroke="${INK}" stroke-width="3.5"/><text x="82" y="141" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="20" fill="${INK}">¢</text>`;
  const front = {  // arms in front of the body
    wave: arm(134, 128, 150, 134, 152, 146),
    rest: arm(134, 128, 150, 134, 152, 146),
    point: arm(134, 126, 144, 118, 150, 118, "point"),
    cheer: arm(118, 50, 140, 36, 146, 18),
    hold: coin + arm(34, 110, 38, 132, 56, 136, "fist") + arm(134, 124, 128, 140, 108, 136, "fist")
  }[pose] || "";

  const st0 = o.sprout == null ? benjiSprout() : o.sprout;
  // A golden sprout from a tip is at least as big as the tip earned
  const st = golden && o.sprout == null && typeof benjiGoldStage === "function" ? Math.max(st0, benjiGoldStage()) : st0;
  const leaf = (d, k) => `<path class="pl${k || 1}" d="${d}" fill="${golden ? "#F4C542" : "var(--pal-leaf)"}" stroke="${INK}" stroke-width="3"/>`;
  const sprout = `<g transform="translate(0 ${-outfit.lift})"><g class="pal-sprout">` + (st <= 0
    ? `<circle cx="80" cy="2" r="5" fill="#C98F55" stroke="${INK}" stroke-width="3"/>`
    : `<path d="M80 ${outfit.lift ? 10 : 6} V${st >= 2 ? -14 : -6}" stroke="#2F7A3D" stroke-width="4" stroke-linecap="round"/>`
      + leaf("M80 -4 Q66 -16 58 -6 Q68 2 80 -4Z", "1 pll") + leaf("M80 -6 Q94 -18 104 -8 Q92 2 80 -6Z", "1 plr")
      + (st >= 2 ? leaf("M80 -14 Q70 -26 62 -20 Q70 -12 80 -14Z", "2 pll") + leaf("M80 -14 Q90 -28 100 -22 Q92 -12 80 -14Z", "2 plr") : "")
      + (st >= 3 ? (golden
        ? `<g class="pfl"><path d="M80 -34 L83 -26 L91 -25 L85 -20 L87 -12 L80 -16 L73 -12 L75 -20 L69 -25 L77 -26 Z" fill="#FFE27A" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="80" cy="-21" r="2.5" fill="#FFFDF6"/></g>`
        : `<g class="pfl"><circle cx="80" cy="-22" r="7" fill="#F4D27A" stroke="${INK}" stroke-width="3"/><circle cx="80" cy="-22" r="2.5" fill="#E5482F"/></g>`) : "")) + `</g></g>`;

  const dot = (x, y) => `<ellipse class="pe" cx="${x}" cy="${y}" rx="5.5" ry="6.5" fill="${INK}"/><circle cx="${x + 2}" cy="${y - 2}" r="1.9" fill="#fff"/>`;
  const arc = (x, y) => `<path d="M${x - 6} ${y + 2} Q${x} ${y - 7} ${x + 6} ${y + 2}" stroke="${INK}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`;
  const shut = (x, y) => `<path d="M${x - 6} ${y - 1} Q${x} ${y + 6} ${x + 6} ${y - 1}" stroke="${INK}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  const big = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle class="pe" cx="${x}" cy="${y + 1}" r="4.5" fill="${INK}"/>`;
  const smile = `<path d="M74 97 Q82 104 90 96" stroke="${INK}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`;
  const grin = `<path d="M72 95 Q82 110 92 94 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M77 101 Q82 105 87 100 Q82 99 77 101" fill="#F28B9C"/>`;
  const cheeks = `<ellipse cx="62" cy="97" rx="5" ry="3" fill="#F28B9C" opacity=".85"/><ellipse cx="102" cy="93" rx="5" ry="3" fill="#F28B9C" opacity=".85"/>`;
  const spark = (x, y, r) => `<path d="M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y} L${x + r * .3} ${y + r * .3} L${x} ${y + r} L${x - r * .3} ${y + r * .3} L${x - r} ${y} L${x - r * .3} ${y - r * .3}Z" fill="#F4D27A" stroke="${INK}" stroke-width="2"/>`;
  const z = (x, y, f) => `<text x="${x}" y="${y}" font-family="Kalam, Nunito, sans-serif" font-weight="700" font-size="${f}" fill="${INK}">z</text>`;
  /* Each face is [eyes, mouth, extras], kept apart so the eyes can look around and the mouth can talk. */
  const faces = {
    happy: [dot(70, 86) + dot(92, 84), smile, cheeks],
    wink: [dot(70, 86) + arc(92, 85), smile, cheeks],
    proud: [arc(70, 87) + arc(92, 85), grin, cheeks + spark(140, 70, 9) + spark(22, 120, 7)],
    cheer: [arc(70, 87) + arc(92, 85), grin, cheeks + spark(30, 4, 8) + spark(132, -2, 8)],
    worried: [dot(70, 88) + dot(92, 86) + `<path d="M62 76 L75 80 M100 74 L87 79" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
      `<path d="M73 100 Q77 96 81 100 Q85 104 90 99" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
      `<path d="M126 66 Q131 74 126 78 Q121 74 126 66z" fill="#7CC6F2" stroke="${INK}" stroke-width="2"/>`],
    hungry: [dot(70, 85) + dot(92, 83), `<ellipse cx="82" cy="99" rx="6" ry="6.5" fill="${INK}"/>`, cheeks],
    sleepy: [shut(70, 87) + shut(92, 85), `<path d="M78 99 Q82 101 86 99" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`, cheeks + `<g class="pal-z">${z(140, 56, 20) + z(154, 38, 14)}</g>`],
    surprised: [big(72, 85) + big(95, 83) + `<path d="M64 70 Q70 66 76 69 M92 67 Q98 64 104 68" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`, `<ellipse cx="84" cy="102" rx="4.5" ry="5.5" fill="${INK}"/>`, ""]
  };
  const f = faces[mood] || faces.happy;
  // An open mouth for talking and yawning, hidden until it is needed
  const talk = `<g class="pal-talk"><ellipse cx="82" cy="100" rx="6" ry="6.5" fill="${INK}"/><ellipse cx="82" cy="104" rx="3.6" ry="2.2" fill="#F28B9C"/></g>`;


  return `<svg class="pal pal-${mood}" width="${s}" height="${Math.round(s * 1.34)}" viewBox="-16 -66 200 268" aria-hidden="true">
    <ellipse cx="80" cy="196" rx="42" ry="5" fill="var(--pal-shadow)"/>
    <path d="M70 168 L64 188 M90 168 L96 188" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/><ellipse cx="60" cy="189" rx="10" ry="5" fill="${INK}"/><ellipse cx="100" cy="189" rx="10" ry="5" fill="${INK}"/>
    <line x1="80" y1="6" x2="80" y2="176" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
    <line x1="80" y1="6" x2="80" y2="176" stroke="var(--pal-shade)" stroke-width="13" stroke-linecap="round"/>
    ${outfit.lift || outfit.noSprout ? "" : sprout}${back}
    <path d="${BENJI_S}" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round"/>
    <path d="${BENJI_S}" fill="none" stroke="var(--pal-body)" stroke-width="31" stroke-linecap="round"/>
    <path d="M56 36 C64 28 84 26 98 32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <g class="pal-hat">${outfit.art}${outfit.lift && !outfit.noSprout ? sprout : ""}</g>
    ${wear && wear.layer !== "face" ? wear.art() : ""}
    <g class="pal-front">${front}</g>
    <g class="pal-eyes">${f[0]}</g><g class="pal-mouth">${f[1]}</g>${talk}${f[2]}
    ${wear && wear.layer === "face" ? wear.art() : ""}
  </svg>`;
}
function palBubble(mood, msg, actions, cls) {
  return `<div class="pal-row ${cls || ""}"><button type="button" class="pal-tap" aria-label="${esc(t("Say hi to Benji"))}">${palSVG(mood, 72)}</button><div class="bubble">${"speechSynthesis" in window ? `<button type="button" class="read-aloud" aria-label="${esc(t("Read this to me"))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/speaker.svg#i"/></svg></button>` : ""}<p>${esc(msg)}</p>${actions && actions.length
    ? `<div class="bubble-actions">${actions.map(a => `<button ${a.attrs}>${esc(a.label)}</button>`).join("")}</div>` : ""}</div></div>`;
}
