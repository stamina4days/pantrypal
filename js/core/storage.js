"use strict";
/* Saving and loading everything in this browser. */
/* ---------- storage ---------- */
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
function store(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { try { toast(t("Couldn't save. Your browser storage may be full or blocked.")); } catch (e2) {} return false; }
}
let items = load(KEYS.items, []);
let history = load(KEYS.history, []);
let shopping = load(KEYS.shopping, []);
let barcodes = load(KEYS.barcodes, {});
let plan = load(KEYS.plan, []);
let cookedLog = load(KEYS.cooked, []);
let myRecipes = load(KEYS.mine, []);
let settings = Object.assign({
  assumeBasics: true, useSubs: true, lastLoc: "Fridge", diets: [], reminders: false, activeList: null,
  favorites: [], staples: [], lang: (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "en",
  largeText: false, highContrast: false, onboarded: false, household: null, ratings: {}, usage: {},
  missingBasics: [], groupAisles: true, checkins: true, lastCheckin: null, prepProgress: {}, readAloud: false,
  prices: {}, hints: {}, kidFilter: false
}, load(KEYS.settings, {}));

/* Older versions stored amount as free text in "qty". */
items.forEach(i => {
  if (i.amount === undefined) {
    const m = String(i.qty || "").match(/^\s*(\d+(?:\.\d+)?)\s*(.*)$/);
    i.amount = m ? Number(m[1]) : null;
    i.unit = m ? m[2] : (i.qty || "");
    delete i.qty;
  }
});

function saveItems() { store(KEYS.items, items); syncForReminders(); }
const saveHistory = () => store(KEYS.history, history);
const saveShopping = () => store(KEYS.shopping, shopping);
const saveBarcodes = () => store(KEYS.barcodes, barcodes);
const saveSettings = () => store(KEYS.settings, settings);
const savePlan = () => store(KEYS.plan, plan);
const saveCooked = () => store(KEYS.cooked, cookedLog);
const saveMine = () => store(KEYS.mine, myRecipes);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
