"use strict";
/* Starts Pantry Pal: loads every page and every recipe file, then hands off to the app. */

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

/* Load every recipe file. Recipes live in category folders (data/recipes/breakfast/, dinner-asian/...)
   and data/recipes/index.json lists them all as "folder/file.json".
   A file that won't load is skipped instead of stopping the app, and data/recipes.json
   (every recipe in one file) fills in anything that's missing. */
let missingRecipes = [];
const loadProblems = new Map();   // file -> what went wrong, shown on the phone check page
async function loadRecipes() {
  const files = await fetchJSON("data/recipes/index.json");
  let done = 0;
  const list = await pool(files, 12, async f => {
    let r = null;
    for (let tries = 0; tries < 2 && !r; tries++) {
      try { r = await fetchJSON("data/recipes/" + f); } catch (e) { loadProblems.set(f, String(e.message || e)); }
    }
    if (r) loadProblems.delete(f);
    Splash.progress(++done, files.length, "recipes");
    return r;
  });
  let missing = files.filter((f, i) => !list[i]);
  if (missing.length) {
    try {
      const all = await fetchJSON("data/recipes.json");
      const byId = new Map(all.map(r => [r.id, r]));
      const idOf = f => f.split("/").pop().replace(/\.json$/, "");
      files.forEach((f, i) => { if (!list[i] && byId.has(idOf(f))) list[i] = byId.get(idOf(f)); });
      missing = files.filter((f, i) => !list[i]);
    } catch (e) {}
  }
  missingRecipes = missing;
  if (missing.length) console.warn("Recipe files that didn't load:", missing);
  list.forEach(r => { if (r) RECIPES.push(fillRecipeDefaults(r)); });
  if (!RECIPES.length) throw new Error("No recipes loaded");
}

async function boot() {
  LANG = settings.lang === "es" ? "es" : "en";
  document.documentElement.lang = LANG;
  Splash.start();
  try {
    await loadPages();
    await loadRecipes();
  } catch (e) {
    Splash.fail(e);
    return;
  }
  Router.prepare();
  init();
  Router.start();
  await Splash.finish();
  if (typeof afterSplash === "function") afterSplash();
  if (missingRecipes.length) toast(t("{n} recipes didn't load. Some files may not have uploaded to GitHub.", { n: missingRecipes.length }));
}

if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("DOMContentLoaded", boot);
