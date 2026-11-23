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
  $("#skQr").classList.add("hidden"); $("#skQr").innerHTML = "";
  $("#shareKitchenPage").showModal();
}

/* Leave out empty details so the link (and the code) stays small. unslimItem puts them back. */
function slimItem(i) {
  const o = {};
  Object.keys(i).forEach(k => {
    const v = i[k];
    if (v === "" || v === null || v === undefined || v === false) return;
    if ((k === "added" || k === "verified") && v === i.bought) return;
    o[k] = v;
  });
  return o;
}
function unslimItem(i) {
  const o = Object.assign({ amount: null, unit: "", notes: "", barcode: "", staple: false, expires: "", location: "Fridge" }, i);
  if (o.bought) { if (!o.added) o.added = o.bought; if (!("verified" in i)) o.verified = o.bought; }
  if (!o.added) o.added = todayStr();
  return o;
}
async function kitchenUrl() {
  const pack = { v: 2, from: (settings.userName || "").trim() };
  if ($("#skFood").checked) pack.items = items.map(slimItem);
  if ($("#skLists").checked) pack.shopping = shopping;
  if ($("#skPlan").checked) pack.plan = plan;
  if ($("#skMine").checked) { pack.mine = myRecipes; pack.notes = settings.recipeNotes || {}; }
  return { pack, url: location.href.split("#")[0] + "#kitchen=" + await packKitchen(pack) };
}
/* The code to scan. Very big kitchens make a code too fine for a camera, so those get the link instead. */
async function showKitchenQr() {
  const box = $("#skQr");
  const { url } = await kitchenUrl();
  const q = QR.make(url);
  box.classList.remove("hidden");
  if (!q || q.version > 32) {
    box.innerHTML = `<p class="qr-note">${esc(t("That's too much for one code. Untick something above, or send a link instead."))}</p>`;
    return;
  }
  box.innerHTML = QR.svg(url, t("Code to copy your kitchen")) + `<p class="qr-note">${esc(t("On the other phone or tablet, open the camera and point it at this code. Tap the link that pops up and your kitchen copies over."))}</p>`;
  box.scrollIntoView({ block: "center", behavior: "smooth" });
}

async function sendKitchen() {
  const { pack, url } = await kitchenUrl();
  const text = pack.from ? t("{name} shared a kitchen with you on Pantry Pal.", { name: pack.from }) : t("Here's my kitchen on Pantry Pal.");
  try {
    if (navigator.share) { await navigator.share({ title: "Pantry Pal", text, url }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast(t("Link copied. Paste it in a text or email.")); }
  catch (e) { Ask.copy({ title: t("Copy this link and send it:"), value: url }); }
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
  if (!await Ask.confirm({ title: t("Someone shared a kitchen"), text: t("Copy {who} onto this phone? It has {n} foods. It gets added to what's here.", { who, n }), yes: t("Add it") })) return;
  const snap = snapshot();
  const ids = new Set(items.map(i => i.id));
  (pack.items || []).forEach(i => { if (!ids.has(i.id)) items.push(unslimItem(i)); });
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
  $("#skQrBtn").addEventListener("click", showKitchenQr);
  // A new choice of what to send makes a new code
  ["#skFood", "#skLists", "#skPlan", "#skMine"].forEach(id => $(id).addEventListener("change", () => { if (!$("#skQr").classList.contains("hidden")) showKitchenQr(); }));
  window.addEventListener("hashchange", importKitchenLink);
}
