"use strict";
/* Pal, your fridge buddy: faces, moods, what Pal says, and the little food emoji
   that make lists feel alive. Loaded after extras.js. */

/* ---------- Pal's face ---------- */
function palSVG(mood, size) {
  const s = size || 64;
  const eye = (x) => `<circle cx="${x}" cy="80" r="5.5" fill="var(--ink)"/>`;
  const happyEye = (x) => `<path d="M${x - 7} 82 Q${x} 72 ${x + 7} 82" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const faces = {
    happy: eye(46) + eye(74) + `<path d="M48 94 Q60 106 72 94" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    wink: eye(46) + happyEye(74) + `<path d="M48 94 Q60 106 72 94" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    proud: happyEye(46) + happyEye(74) + `<path d="M46 92 Q60 112 74 92 Z" fill="var(--ink)"/><path d="M53 100 Q60 106 67 100 Q60 98 53 100" fill="#F28B9C"/>`
      + `<path d="M100 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="var(--lemon)"/><path d="M16 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="var(--lemon)"/>`,
    worried: eye(46) + eye(74) + `<path d="M37 68 L52 72 M83 68 L68 72" stroke="var(--ink)" stroke-width="3.5" stroke-linecap="round"/>`
      + `<path d="M49 100 Q54 95 59 100 Q64 105 70 100" stroke="var(--ink)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      + `<path d="M93 60 Q98 68 93 72 Q88 68 93 60z" fill="#7CC6F2"/>`,
    hungry: eye(46) + eye(74) + `<ellipse cx="60" cy="99" rx="7" ry="7.5" fill="var(--ink)"/>`
  };
  return `<svg class="pal pal-${mood}" width="${s}" height="${Math.round(s * 1.17)}" viewBox="0 0 120 140" aria-hidden="true">
    <rect x="14" y="128" width="16" height="8" rx="4" fill="var(--ink)"/><rect x="90" y="128" width="16" height="8" rx="4" fill="var(--ink)"/>
    <rect x="10" y="6" width="100" height="126" rx="24" fill="var(--paper)" stroke="var(--ink)" stroke-width="4"/>
    <path d="M12 48 H108" stroke="var(--ink)" stroke-width="4"/>
    <rect x="88" y="18" width="7" height="20" rx="3.5" fill="var(--ink)"/><rect x="88" y="58" width="7" height="18" rx="3.5" fill="var(--ink)"/>
    <circle cx="32" cy="28" r="9" fill="var(--tomato)"/><path d="M32 19 Q36 13 41 15" stroke="var(--leaf)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="94" rx="7" ry="4.5" fill="#F7A8B8" opacity=".75"/><ellipse cx="86" cy="94" rx="7" ry="4.5" fill="#F7A8B8" opacity=".75"/>
    ${faces[mood] || faces.happy}
  </svg>`;
}
function palBubble(mood, msg, actions, cls) {
  return `<div class="pal-row ${cls || ""}">${palSVG(mood, 58)}<div class="bubble"><p>${esc(msg)}</p>${actions && actions.length
    ? `<div class="bubble-actions">${actions.map(a => `<button ${a.attrs}>${esc(a.label)}</button>`).join("")}</div>` : ""}</div></div>`;
}

/* ---------- what Pal says on My Food ---------- */
function palFoodHtml() {
  const live = items.filter(i => !i.leftover);
  const dl = i => daysLeft(i.expires);
  const expired = items.filter(i => { const d = dl(i); return d !== null && d < 0; });
  const urgent = items.filter(i => { const d = dl(i); return d !== null && d >= 0 && d <= 1; }).sort((a, b) => dl(a) - dl(b));
  const soon = items.filter(i => { const d = dl(i); return d !== null && d >= 0 && d <= 3; });
  const savedWeek = history.filter(h => h.outcome === "used" && h.date >= addDaysFrom(todayStr(), -7)).length;
  if (!items.length) return palBubble("hungry", t("I'm empty and kind of hungry. Tap + to add food, or show me what's in your kitchen!"),
    [{ attrs: 'data-pal="audit" class="primary"', label: t("Show Pal my kitchen") }]);
  if (expired.length) return palBubble("worried", tn(expired.length, "Uh oh, 1 thing is past its date. Want to clear it out?", "Uh oh, {n} things are past their date. Want to clear them out?"),
    [{ attrs: 'data-toss="1" class="primary"', label: t("Clear them out") }].concat(urgent.length ? [{ attrs: `data-pal="use" data-id="${urgent[0].id}"`, label: t("Save the {name}", { name: urgent[0].name }) }] : []));
  if (urgent.length) {
    const it = urgent[0], d = dl(it);
    return palBubble("worried", d === 0 ? t("Heads up! Your {name} needs to be eaten today. Want a recipe for it?", { name: it.name })
      : t("Heads up! Your {name} has 1 day left. Want a recipe for it?", { name: it.name }),
      [{ attrs: `data-pal="use" data-id="${it.id}" class="primary"`, label: t("Find a recipe") }, { attrs: `data-pal="freeze" data-id="${it.id}"`, label: t("Freeze it") }]);
  }
  if (settings.lastWin && Date.now() - settings.lastWin < 3 * 3600 * 1000 && savedWeek)
    return palBubble("proud", tn(savedWeek, "Look at you go! That's 1 thing saved from the trash this week.", "Look at you go! That's {n} things saved from the trash this week."), []);
  if (soon.length) return palBubble("happy", tn(soon.length, "1 thing wants to be eaten in the next few days. I've got ideas!", "{n} things want to be eaten in the next few days. I've got ideas!"),
    [{ attrs: 'data-go="recipes" class="primary"', label: t("Show me") }]);
  const day = Math.floor(Date.now() / 86400000);
  const picks = [
    () => palBubble("happy", t("Everything in here is fresh and happy. Want me to plan your week?"), [{ attrs: 'data-pal="plan" class="primary"', label: t("Plan my week") }]),
    () => palBubble("wink", t("Hungry? I've got recipes you can make with what's here right now."), [{ attrs: 'data-pal="quick" class="primary"', label: t("What can I make?") }]),
    () => palBubble("happy", tn(live.length, "I'm keeping an eye on 1 thing for you. I'll speak up if it needs eating.", "I'm keeping an eye on {n} things for you. I'll speak up if anything needs eating."), [])
  ];
  return picks[day % picks.length]();
}
function palStatsHtml(pct, total) {
  if (!total) return palBubble("hungry", t("No score yet! Cook something or finish up some food and I'll start keeping track."), []);
  if (pct >= 80) return palBubble("proud", t("You're a food-saving pro. Seriously, nice work!"), []);
  if (pct >= 50) return palBubble("happy", t("Not bad at all! Let's get that number even higher."), []);
  return palBubble("worried", t("A lot got tossed lately. I'll give you a heads up sooner, promise."), []);
}

/* ---------- food emoji ---------- */
const FOOD_EMOJI = {
  egg: "🥚", milk: "🥛", cheese: "🧀", butter: "🧈", yogurt: "🥛", cream: "🥛", chicken: "🍗", "ground beef": "🥩", beef: "🥩", steak: "🥩",
  "stew meat": "🥩", pork: "🥩", bacon: "🥓", ham: "🍖", sausage: "🌭", fish: "🐟", salmon: "🐟", tuna: "🐟", shrimp: "🍤", tofu: "🥡",
  bread: "🍞", tortilla: "🌮", rice: "🍚", pasta: "🍝", "egg noodle": "🍜", oat: "🥣", granola: "🥣", potato: "🥔", "sweet potato": "🍠",
  carrot: "🥕", onion: "🧅", garlic: "🧄", tomato: "🍅", "canned tomato": "🥫", "tomato sauce": "🥫", "tomato paste": "🥫", "bell pepper": "🫑",
  broccoli: "🥦", spinach: "🥬", lettuce: "🥬", kale: "🥬", cabbage: "🥬", cucumber: "🥒", zucchini: "🥒", mushroom: "🍄", corn: "🌽",
  pea: "🟢", "green bean": "🫛", avocado: "🥑", lemon: "🍋", lime: "🍋", banana: "🍌", apple: "🍎", berry: "🍓", strawberry: "🍓",
  blueberry: "🫐", mango: "🥭", peach: "🍑", pineapple: "🍍", grape: "🍇", orange: "🍊", cilantro: "🌿", parsley: "🌿", basil: "🌿",
  scallion: "🌿", jalapeno: "🌶️", "black bean": "🫘", "kidney bean": "🫘", chickpea: "🫘", lentil: "🫘", broth: "🍲", "coconut milk": "🥥",
  honey: "🍯", "peanut butter": "🥜", salsa: "🍅", mayonnaise: "🫙", oil: "🫒", "olive oil": "🫒", flour: "🌾", sugar: "🍬", salt: "🧂", ginger: "🫚"
};
const AISLE_EMOJI = { produce: "🥬", meat: "🥩", dairy: "🥛", bakery: "🍞", pantry: "🥫", frozen: "🧊", baking: "🧂", other: "🛒" };
function foodEmoji(name, item) {
  if (item && item.leftover) return "🍱";
  const v = byKey("emoji", FOOD_EMOJI, canon(name));
  return v || AISLE_EMOJI[aisleOf(name)] || "🛒";
}
const FAMILY_EMOJI = {
  "stir-fry": "🥢", "fried-rice": "🍚", omelette: "🍳", pasta: "🍝", "blended-soup": "🍲", quesadilla: "🧀", smoothie: "🥤", "sheet-pan": "🥘",
  curry: "🍛", tacos: "🌮", "egg-muffin": "🧁", oats: "🥣", "burrito-bowl": "🌯", "soy-bowl": "🍜", "med-bowl": "🥗", burrito: "🌯",
  "pasta-bake": "🍝", "slow-cooker": "🍲", "chicken-soup": "🍲", chili: "🌶️", stew: "🍲"
};
const NAME_EMOJI = {
  "Fluffy Pancakes": "🥞", "French Toast": "🍞", "Banana Bread": "🍌", "Overnight Oats": "🥣", "Scrambled Eggs on Toast": "🍳", "Shakshuka": "🍳",
  "Grilled Cheese": "🧀", "Classic Meatballs": "🍝", "Lemon Garlic Baked Salmon": "🐟", "Greek Salad": "🥗", "Caprese Salad": "🍅",
  "Chicken Caesar Salad": "🥗", "BLT Sandwich": "🥪", "Tuna Salad Sandwich": "🥪", "Egg Salad": "🥚", "Potato Salad": "🥔", "Creamy Coleslaw": "🥬",
  "Guacamole": "🥑", "Hummus": "🫘", "Mashed Potatoes": "🥔", "Apple Crisp": "🍎", "Loaded Baked Potatoes": "🥔", "Cucumber Salad": "🥒",
  "Fresh Salsa": "🍅", "Tomato Bruschetta": "🍅", "Rice Pudding": "🍮", "Yogurt Parfait": "🍨", "Stuffed Bell Peppers": "🫑", "Shepherd's Pie": "🥧",
  "Chicken Fajitas": "🌮", "Stovetop Mac and Cheese": "🧀", "Slow Cooker Pulled Pork": "🍖"
};
const TYPE_EMOJI = { Breakfast: "🍳", Lunch: "🥪", Dinner: "🍽️", Side: "🥗", Snack: "🥨", Dessert: "🍰", Drink: "🥤" };
const recipeEmoji = r => NAME_EMOJI[r.name] || FAMILY_EMOJI[r.family] || TYPE_EMOJI[r.type] || "🍽️";

/* ---------- nutrition as little market tags ---------- */
function nutritionHtml(r) {
  const n = nutritionOf(r);
  const box = (v, l) => `<span class="nbox"><strong>${esc(v)}</strong><span>${esc(l)}</span></span>`;
  return `<div class="nboxes">${box(Math.round(n.cal), t("calories"))}${box(Math.round(n.protein) + " g", t("protein"))}${box(Math.round(n.carbs) + " g", t("carbs"))}${box(Math.round(n.fat) + " g", t("fat"))}${box(fmtMoney(costOf(r)), t("per serving"))}</div>`
    + `<p class="muted small">${esc(n.coverage < 0.7 ? t("Rough estimate per serving.") : t("Estimate per serving."))}</p>`;
}

/* ---------- page title in the header ---------- */
const TAB_TITLES = { pantry: "My Food", recipes: "Recipes", plan: "Plan", shopping: "Shopping", stats: "Waste Less" };
function setPageTitle(name) {
  document.body.dataset.tab = name;
  $("#pageTitle").textContent = t(TAB_TITLES[name] || "My Food");
}

function buddyInit() {
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-pal]");
    if (!b) return;
    const a = b.dataset.pal;
    if (a === "audit") openAudit();
    if (a === "plan") { showTab("plan"); openPlanner(); }
    if (a === "quick") { showTab("recipes"); $("#quickBtn").click(); }
    if (a === "use") { focusItemId = b.dataset.id; recipeMode = "foryou"; setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]')); showTab("recipes"); }
    if (a === "freeze") { editingId = b.dataset.id; freezeOrThaw(); }
  });
  setPageTitle("pantry");
}
