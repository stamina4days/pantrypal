"use strict";
/* Starts Pantry Pal: loads every page and every recipe file, then hands off to the app. */

/* If a style file failed to load (a network hiccup, or the site was mid-update), the page falls apart:
   the tabs turn into plain wrapped buttons, for one. Spot any style file that came back empty and load it again. */
function healStyles(tries = 0) {
  const bad = [...document.querySelectorAll('link[rel="stylesheet"]')].filter(l => {
    if (!(l.getAttribute("href") || "").startsWith("css/") || !l.sheet || l.dataset.healing) return false;
    try { return l.sheet.cssRules.length === 0; } catch (e) { return false; }
  });
  bad.forEach(l => {
    const n = l.cloneNode();
    n.href = l.getAttribute("href").split("?")[0] + "?r=" + Date.now();
    l.dataset.healing = "1";
    n.addEventListener("load", () => { try { if (n.sheet && n.sheet.cssRules.length) l.remove(); } catch (e) { l.remove(); } delete l.dataset.healing; });
    n.addEventListener("error", () => { n.remove(); delete l.dataset.healing; });
    l.after(n);
  });
  if (tries < 4) setTimeout(() => healStyles(tries + 1), tries ? 4000 : 1500);
}
healStyles();

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(res.status + " " + (res.statusText || "error") + " for " + path);
  return res.text();
}
async function fetchJSON(path) { return JSON.parse(await fetchText(path)); }

/* Run up to `limit` jobs at a time so older phones don't choke on hundreds of requests. */
async function pool(list, limit, job) {
  const out = new Array(list.length);
  let next = 0;
  async function worker() {
    while (next < list.length) { const i = next++; out[i] = await job(list[i], i); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

async function loadPages() {
  const all = [...PP_TABS, ...PP_PAGES];
  let done = 0;
  const html = await pool(all, 8, async p => {
    let h;
    try { h = await fetchText(p); } catch (e) { h = await fetchText(p).catch(() => { throw new Error("missing:" + p); }); }
    Splash.progress(++done, all.length, "pages");
    return h;
  });
  const main = document.getElementById("main");
  const pages = document.getElementById("screens");
  html.forEach((h, i) => {
    const target = i < PP_TABS.length ? main : pages;
    target.insertAdjacentHTML("beforeend", h);
  });
}

/* Recipes. Each recipe is its own file in a category folder (data/recipes/breakfast/...),
   and data/recipes/index.json lists them all. To open fast, the app reads data/recipes.json,
   one file holding every recipe, and only downloads the separate files it doesn't find there.
   Once a day, after the app is open, it quietly checks the separate files for edits. */
let missingRecipes = [];
const loadProblems = new Map();   // file -> what went wrong, shown on the phone check page
let recipeFiles = [], bundleRaw = new Map();
const recipeIdOf = f => f.split("/").pop().replace(/\.json$/, "");

async function fetchRecipeFile(f) {
  for (let tries = 0; tries < 2; tries++) {
    try { const r = await fetchJSON("data/recipes/" + f); loadProblems.delete(f); return r; }
    catch (e) { loadProblems.set(f, String(e.message || e)); }
  }
  return null;
}

async function loadRecipes() {
  const [files, bundle] = await Promise.all([
    fetchJSON("data/recipes/index.json"),
    fetchJSON("data/recipes.json").catch(() => [])
  ]);
  recipeFiles = files;
  const byId = new Map(bundle.map(r => [r.id, r]));
  bundleRaw = new Map(bundle.map(r => [r.id, JSON.stringify(r)]));
  const need = files.filter(f => !byId.has(recipeIdOf(f)));
  let done = files.length - need.length;
  Splash.progress(done, files.length, "recipes");
  const got = new Map();
  await pool(need, 12, async f => {
    got.set(f, await fetchRecipeFile(f));
    Splash.progress(++done, files.length, "recipes");
  });
  const list = files.map(f => byId.get(recipeIdOf(f)) || got.get(f) || null);
  missingRecipes = files.filter((f, i) => !list[i]);
  if (missingRecipes.length) console.warn("Recipe files that didn't load:", missingRecipes);
  list.forEach(r => { if (r) RECIPES.push(fillRecipeDefaults(r)); });
  if (!RECIPES.length) throw new Error("No recipes loaded");
}

/* Pick up edits made to individual recipe files since data/recipes.json was last rebuilt. */
async function checkRecipeEdits() {
  if (!bundleRaw.size || settings.lastRecipeCheck === todayStr()) return;
  settings.lastRecipeCheck = todayStr(); saveSettings();
  const inBundle = recipeFiles.filter(f => bundleRaw.has(recipeIdOf(f)));
  let changed = 0;
  await pool(inBundle, 3, async f => {
    const r = await fetchRecipeFile(f);
    if (!r || JSON.stringify(r) === bundleRaw.get(recipeIdOf(f))) return;
    const i = RECIPES.findIndex(x => !x.mine && x.id === r.id);
    if (i < 0) return;
    r.ing.forEach(s => addPhrase((s.split("|")[1] || "").trim()));
    const fresh = fillRecipeDefaults(r);
    prepareRecipe(fresh);
    RECIPES[i] = fresh;
    changed++;
  });
  if (changed) renderAll();
}

/* If something goes wrong while starting, clear the offline copy and try once more. */
function healAndReload() {
  try { if (sessionStorage.getItem("pantrypal.healed")) return false; sessionStorage.setItem("pantrypal.healed", "1"); } catch (e) { return false; }
  const jobs = [];
  if (window.caches) jobs.push(caches.keys().then(ks => Promise.all(ks.filter(k => k !== "pantrypal-data").map(k => caches.delete(k)))));
  if (navigator.serviceWorker) jobs.push(navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister()))));
  Promise.all(jobs).finally(() => location.reload());
  return true;
}

async function boot() {
  if (window.PP_UPDATING) return;   // the page is about to reload with fresh files
  settings.lang = "en";   // English only for now
  document.documentElement.lang = LANG;
  Splash.start();
  try {
    await loadPages();
    await loadRecipes();
  } catch (e) {
    if (!healAndReload()) Splash.fail(e);
    return;
  }
  try {
    Router.prepare();
    init();
  } catch (e) {
    console.error(e);
    if (!healAndReload()) Splash.fail(e);
    return;
  }
  try { sessionStorage.removeItem("pantrypal.healed"); } catch (e) {}
  const landing = location.hash;   // a shared link or bookmark skips the tour
  const choice = await Splash.menu();
  await Splash.finish();
  try { Router.start(); } catch (e) { console.error(e); }
  if (typeof afterSplash === "function") afterSplash(choice, landing);
  setTimeout(() => checkRecipeEdits().catch(() => {}), 4000);
  if (missingRecipes.length) toast(t("{n} recipes didn't load. Some files may not have uploaded to GitHub.", { n: missingRecipes.length }));
}

if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("DOMContentLoaded", boot);
