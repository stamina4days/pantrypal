"use strict";
/* Fun with Benji's hats: opening a pack, Benji reacting to what he wears, the rescue meter that unlocks new colors,
   the costume party badge, and the daily gift on Today. The photo booth lives in booth.js. */

/* The hat Benji has on right now, or null for none */
function wornHatId() {
  const c = benjiHatChoice();
  if (c === "none") return null;
  const id = c === "season" ? palSeason() : c, h = benjiHat(id);
  if (!h) return null;
  return h.season || hatUnlocked(h) ? id : palSeason();
}

/* ---------- Costume party: every anime hat worn at least once (any color counts) ---------- */
function noteHatWorn(id) {
  const b = hatBaseId(id);
  if (!ANIME_HATS.includes(b)) return;
  const w = settings.hatsWorn || [];
  if (!w.includes(b)) settings.hatsWorn = [...w, b];
}
const animeHatsWorn = () => (settings.hatsWorn || []).filter(id => ANIME_HATS.includes(id)).length;

/* A small hat on its own, for the unboxing and the photo booth chips */
function hatOnlySVG(id, size) {
  const h = benjiHat(id); if (!h) return "";
  const s = size || 64;
  return `<svg class="hat-only" width="${s}" height="${s}" viewBox="-6 -66 172 172" aria-hidden="true">${h.art()}</svg>`;
}

/* Trim each small hat's picture to the hat itself so it fills its spot */
function fitHatSVGs(root) {
  (root || document).querySelectorAll("svg.hat-only:not([data-fit])").forEach(svg => {
    try {
      const b = svg.getBBox(); if (!b.width) return;
      const m = 6, side = Math.max(b.width, b.height) + m * 2;
      svg.setAttribute("viewBox", `${(b.x + b.width / 2 - side / 2).toFixed(1)} ${(b.y + b.height / 2 - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`);
      svg.dataset.fit = "1";
    } catch (e) {}
  });
}

/* ---------- Opening a pack: the box shakes, the lid pops, the hats fly out, and Benji tries one on ---------- */
function unboxMoment(o) {
  if (o && o.kind) {   // a shop item
    const it = o;
    o = { hats: it.kind === "hats" ? it.hats : it.kind === "bundle" ? ["cowboy", "elf", "pizza", "cat-ears"] : [],
      wear: it.kind === "outfits" ? (BENJI_OUTFITS[0] || {}).id : undefined,
      say: it.kind === "hats" ? t("Ooh! Let me try one on.") : t("Is this for me? Thank you!") };
  }
  const hats = (o.hats || []).filter(id => benjiHat(id));
  const calm = reducedMotion();
  const n = hats.length;
  const flying = hats.map((id, i) => {
    // Spread the hats in an arc over the box
    const a = n === 1 ? -90 : n > 4 ? -172 + (164 / (n - 1)) * i : -150 + (120 / (n - 1)) * i;
    const r = n > 4 ? 142 : 124;
    const x = Math.round(Math.cos(a * Math.PI / 180) * r), y = Math.round(Math.sin(a * Math.PI / 180) * r * .92);
    return `<span class="ub-hat" style="--x:${x}px;--y:${y}px;--d:${(.85 + i * .07).toFixed(2)}s">${hatOnlySVG(id, n > 4 ? 52 : 66)}</span>`;
  }).join("");
  const sparkles = n ? "" : Array.from({ length: 6 }, (_, i) => `<span class="ub-spark" style="--x:${[-90, -50, 0, 50, 90, 0][i]}px;--y:${[-40, -100, -130, -100, -40, -70][i]}px;--d:${(.85 + i * .06).toFixed(2)}s"></span>`).join("");
  const benji = palSVG("proud", 116, { pose: "cheer", sprout: 1, hat: hats[0], wear: o.wear });
  const el = momentLayer();
  el.innerHTML = `<div class="moment-box unbox${calm ? " calm" : ""}${o.gold ? " gold" : ""}">
    <div class="ub-stage">
      <div class="ub-hats">${flying}${sparkles}</div>
      <div class="ub-benji">${benji}</div>
      <div class="ub-box"><span class="ub-body"></span><span class="ub-lid"></span><span class="ub-bow"></span></div>
    </div>
    ${o.say ? `<p class="moment-say ub-say">${esc(o.say)}</p>` : ""}
  </div>`;
  fitHatSVGs(el);
  sfx("pop"); buzz(8);
  setTimeout(() => { sfx("cheer"); buzz([10, 50, 10, 50, 20]); if (typeof confetti === "function") confetti(); }, calm ? 200 : 780);
  clearTimeout(momentTimer);
  const life = o.ms || 4200;
  momentTimer = setTimeout(() => {
    const b = el.querySelector(".unbox"); if (b) b.classList.add("ub-out");
    momentTimer = setTimeout(() => { el.innerHTML = ""; }, 450);
  }, life - 450);
}

/* ---------- Benji reacts to his anime hats ---------- */
const HAT_TAP_LINES = {
  "cat-ears": ["Nya! Feed me the food that's about to go off first.", "Nya nya. That means thank you in cat.", "My whiskers sense leftovers. Nya!"],
  "hero-hair": ["Rescue some food and watch my hair glow!", "Hero rule number one: eat the oldest food first.", "This hair took three hours. Worth it."],
  "twin-tails": ["Twirl! My tails bounce when I'm happy.", "Two tails, twice the cute.", "Swish swish! Let's cook something."],
  "headband": ["Training day! Check the fridge, then check it again.", "A true hero never wastes leftovers.", "Ten fridge checks a day keeps waste away. Hup!"],
  "fox-mask": ["Peekaboo!", "Who's behind the mask? It's me, Benji!", "Boo! Did I scare you? No? Okay."],
  "tiara": ["Crystal power, go! It does nothing, but it sparkles.", "Sparkly and thrifty. That's me.", "A royal decree: no food left behind!"],
  "ribbon": ["Does my bow look big in this?", "All tied up and ready to cook.", "A bow for me, and a bow for you. Thanks for saving food!"],
  "cowlick": ["I just woke up like this.", "Bed head, full fridge, good day.", "My hair has a mind of its own. So does my appetite."]
};
const HAT_TAP_MOVE = { "cat-ears": "hat-twitch", "hero-hair": "powerup", "twin-tails": "hat-swish", "fox-mask": "hat-peek", "tiara": "hat-shine", "ribbon": "hat-twitch", "headband": "hat-swish", "cowlick": "hat-twitch" };
let hatTapN = 0;
/* Called when Benji is tapped. Returns true when his hat did the talking. */
function palHatTap(btn) {
  const id = wornHatId(), base = id && hatBaseId(id);
  const lines = base && HAT_TAP_LINES[base];
  if (!lines) return false;
  const svg = btn.querySelector(".pal");
  const move = HAT_TAP_MOVE[base];
  if (svg && move && !reducedMotion()) { svg.classList.remove(move); void svg.getBoundingClientRect(); svg.classList.add(move); setTimeout(() => svg.classList.remove(move), 1700); }
  // The fox mask always peeks; the talking takes turns with his usual lines
  if (hatTapN++ % 2) return false;
  palSay(btn.closest(".pal-row"), palYou(t(lines[Math.floor(hatTapN / 2) % lines.length])));
  return true;
}
/* What Benji says when you rescue food in his hero hair */
function hatRescueLine() {
  const id = wornHatId();
  if (!id || hatBaseId(id) !== "hero-hair") return "";
  return t(["Power up! Food rescued!", "My hair is glowing! Another rescue!", "Hero mode: on. That food is saved!"][Math.floor(Math.random() * 3)]);
}

/* ---------- The rescue meter: each rescue fills it, and every RESCUE_STEP unlocks a new hat color ---------- */
function hatRescued() {
  const id = wornHatId();
  if (id && hatBaseId(id) === "hero-hair" && !reducedMotion()) {
    $$(".pal").forEach(p => { p.classList.remove("powerup"); void p.getBoundingClientRect(); p.classList.add("powerup"); });
    setTimeout(() => $$(".pal.powerup").forEach(p => p.classList.remove("powerup")), 1800);
  }
  if (!ownsItem("hats-anime")) return;
  settings.counts = settings.counts || {};
  settings.counts.rescueMeter = (settings.counts.rescueMeter || 0) + 1;
  saveSettings();
  const got = BENJI_HATS.find(h => h.rescue && h.rescue * RESCUE_STEP === settings.counts.rescueMeter);
  if (got) setTimeout(() => {
    toast(t("Rescue meter full! Benji unlocked the {hat}.", { hat: t(got.name).toLowerCase() }));
    unboxMoment({ hats: [got.id], say: t("A new color! Thanks for rescuing food."), ms: 3600 });
    renderAll();
  }, 2600);
}

/* ---------- The daily gift on Today. Missing a day never resets it: the next gift just waits for you. ---------- */
const GIFT_TIPS = [
  "Keep bananas away from other fruit. They give off a gas that makes their neighbors ripen faster.",
  "Don't wash berries until you're about to eat them. Extra water helps mold grow.",
  "Store mushrooms in a paper bag in the fridge. Plastic traps moisture and makes them slimy.",
  "Bread keeps longer in the freezer than in the fridge. Toast slices straight from frozen.",
  "Stand fresh herbs in a glass of water, like flowers. Basil likes the counter, most others like the fridge.",
  "Put the oldest food at the front of the fridge so it gets eaten first.",
  "Tomatoes taste best kept on the counter until they're ripe.",
  "Ripen avocados on the counter, then move them to the fridge to slow them down.",
  "Freeze leftover tomato paste in spoonfuls on a tray, then keep them in a bag.",
  "Brown sugar gone hard? Put a slice of bread in the container overnight to soften it.",
  "Keep potatoes somewhere cool and dark, and away from onions.",
  "Wrap cheese in wax or parchment paper so it can breathe.",
  "Peel overripe bananas and freeze them for smoothies and banana bread.",
  "Leftovers keep 3 to 4 days in the fridge. Freeze what you won't eat by then."
];
const GIFT_PUNS = [
  "Lettuce celebrate! You came back today.",
  "Orange you glad you opened this?",
  "You're one in a melon.",
  "Why did the tomato blush? It saw the salad dressing.",
  "I'm on a roll today. A dinner roll.",
  "What do you call a sad strawberry? A blueberry.",
  "This gift is nacho average present.",
  "I'm not a mushroom. I'm a fun guy.",
  "You've bean so good at saving food.",
  "Olive the food you saved makes me happy.",
  "Peas keep coming back. I'll be here tomorrow!",
  "You're the zest!"
];
const giftState = () => settings.gift || { day: 0, weeks: 0 };
const giftReady = () => giftState().last !== todayStr();

function renderGift() {
  const b = $("#todayGiftBtn"); if (!b) return;
  const ready = giftReady(), g = giftState();
  b.classList.toggle("hidden", !ready);
  b.classList.toggle("big", (g.day || 0) === 6);
  b.setAttribute("aria-label", (g.day || 0) === 6 ? t("Open today's gift. It's day 7, the big one!") : t("Open today's gift, day {n} of 7", { n: (g.day || 0) + 1 }));
}

function openGift() {
  const g = Object.assign({ day: 0, weeks: 0, tip: 0, pun: 0 }, giftState());
  if (g.last === todayStr()) { toast(t("You opened today's gift. Come back tomorrow for another!")); return; }
  g.day++; g.last = todayStr();
  const big = g.day >= 7;
  let hat = null, line = "";
  if (big) {
    g.day = 0; g.weeks++;
    hat = BENJI_HATS.find(h => h.golden === g.weeks) || null;
    if (!hat) line = t(GIFT_PUNS[g.pun++ % GIFT_PUNS.length]);
  } else if (g.day % 2) line = t(GIFT_TIPS[g.tip++ % GIFT_TIPS.length]);
  else line = t(GIFT_PUNS[g.pun++ % GIFT_PUNS.length]);
  settings.gift = g; saveSettings();
  renderGift();
  const day = big ? 7 : g.day;
  unboxMoment({ hats: hat ? [hat.id] : [], gold: big, say: big ? t("Day 7! The big one!") : t("Day {n} of 7", { n: day }), ms: big ? 3800 : 2400 });
  setTimeout(() => {
    if (hat) {
      Ask.confirm({ title: t("You got the {hat}!", { hat: t(hat.name).toLowerCase() }), text: t("Thanks for visiting all week. Want Benji to wear it now?"), yes: t("Put it on"), no: t("Later") })
        .then(yes => { if (!yes) return; settings.benjiHat = hat.id; noteHatWorn(hat.id); saveSettings(); renderAll(); if ($("#hatsPage").open) renderHats(); });
      return;
    }
    const left = 7 - (g.day || 0);
    Ask.notice({ title: big ? t("You have every golden hat!") : g.day % 2 ? t("Benji's tip of the day") : t("Benji's joke of the day"), mood: big ? "proud" : "wink",
      paras: [line, big ? t("Thanks for coming back. Gifts keep coming every day.") : tn(left, "1 more gift until the big day 7 surprise.", "{n} more gifts until the big day 7 surprise.")], ok: t("Thanks, Benji!") });
  }, big ? 3000 : 1700);
}

function hatFunInit() {
  const gb = $("#todayGiftBtn"); if (gb) gb.addEventListener("click", openGift);
  renderGift();
  // A new day while the app stays open
  document.addEventListener("visibilitychange", () => { if (!document.hidden) renderGift(); });
}
