"use strict";
/* Starts Pantry Pal: loads every page and every recipe file, then hands off to the app. */

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(path + " " + res.status);
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
    const h = await fetchText(p);
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

async function loadRecipes() {
  const files = await fetchJSON("data/recipes/index.json");
  let done = 0;
  const list = await pool(files, 24, async f => {
    const r = await fetchJSON("data/recipes/" + f);
    Splash.progress(++done, files.length, "recipes");
    return r;
  });
  list.forEach(r => RECIPES.push(fillRecipeDefaults(r)));
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
}

if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("DOMContentLoaded", boot);
