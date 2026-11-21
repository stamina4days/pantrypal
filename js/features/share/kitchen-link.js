"use strict";
/* Share your kitchen as a link. Everything is packed into the link itself
   (squeezed small with the browser's own compression), so no server is involved. */
async function packKitchen(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === "undefined") return "j" + b64url(bytes);
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return "z" + b64url(new Uint8Array(await new Response(stream).arrayBuffer()));
}
async function unpackKitchen(s) {
  const bytes = b64urlDecode(s.slice(1));
  if (s[0] === "j") return JSON.parse(new TextDecoder().decode(bytes));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return JSON.parse(await new Response(stream).text());
}
function b64url(bytes) {
  let bin = ""; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function openShareKitchen() {
  $("#skFoodLabel").textContent = t("My Food") + " (" + tn(items.length, "1 thing", "{n} things") + ")";
  $("#skListsLabel").textContent = t("Shopping lists") + " (" + shopping.length + ")";
  $("#skPlanLabel").textContent = t("Meal plan") + " (" + tn(plan.length, "1 meal", "{n} meals") + ")";
  $("#skMineLabel").textContent = t("My recipes and notes") + " (" + myRecipes.length + ")";
  $("#shareKitchenPage").showModal();
}

async function sendKitchen() {
  const pack = { v: 1, from: (settings.userName || "").trim() };
  if ($("#skFood").checked) pack.items = items;
  if ($("#skLists").checked) pack.shopping = shopping;
  if ($("#skPlan").checked) pack.plan = plan;
  if ($("#skMine").checked) { pack.mine = myRecipes; pack.notes = settings.recipeNotes || {}; }
  const url = location.href.split("#")[0] + "#kitchen=" + await packKitchen(pack);
  const text = pack.from ? t("{name} shared a kitchen with you on Pantry Pal.", { name: pack.from }) : t("Here's my kitchen on Pantry Pal.");
  try {
    if (navigator.share) { await navigator.share({ title: "Pantry Pal", text, url }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast(t("Link copied. Paste it in a text or email.")); }
  catch (e) { prompt(t("Copy this link and send it:"), url); }
}

/* Opening a kitchen link: add it to what's here, or swap everything for it. */
let bootHash = typeof location !== "undefined" ? location.hash : "";   // read before page addresses take over the #
async function importKitchenLink() {
  const h = bootHash.startsWith("#kitchen=") ? bootHash : location.hash;
  bootHash = "";
  if (!h.startsWith("#kitchen=")) return;
  try { window.history.replaceState(window.history.state, "", location.pathname + location.search + "#/food"); } catch (e) {}
  let pack;
  try { pack = await unpackKitchen(h.slice(9)); } catch (e) { toast(t("That kitchen link didn't come through whole. Ask for a new one.")); return; }
  const who = pack.from ? t("{name}'s kitchen", { name: pack.from }) : t("this kitchen");
  const n = (pack.items || []).length;
  if (!confirm(t("Copy {who} onto this phone? It has {n} foods. Press OK to add it to what's here.", { who, n }))) return;
  const snap = snapshot();
  const ids = new Set(items.map(i => i.id));
  (pack.items || []).forEach(i => { if (!ids.has(i.id)) items.push(i); });
  const listIds = new Set(shopping.map(l => l.id));
  (pack.shopping || []).forEach(l => { if (!listIds.has(l.id)) shopping.push(l); });
  const planIds = new Set(plan.map(m => m.id));
  (pack.plan || []).forEach(m => { if (!planIds.has(m.id)) plan.push(m); });
  const mineIds = new Set(myRecipes.map(r => r.id));
  (pack.mine || []).forEach(r => { if (!mineIds.has(r.id)) { myRecipes.push(r); addMineToRecipes(r); } });
  settings.recipeNotes = Object.assign({}, pack.notes || {}, settings.recipeNotes || {});
  saveItems(); saveShopping(); savePlan(); saveMine(); saveSettings();
  renderAll();
  toast(t("Copied {who} onto this phone.", { who }), snap);
}

function kitchenShareInit() {
  $("#shareKitchenBtn").addEventListener("click", () => { $("#settingsDialog").close(); openShareKitchen(); });
  $("#skSend").addEventListener("click", sendKitchen);
  window.addEventListener("hashchange", importKitchenLink);
}
