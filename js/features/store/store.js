"use strict";
/* Benji's shop: extras you can buy, like hat packs. Everything that saves food and money stays free.
   How buying works: each phone gets its own shop ID (settings.shopId). The buyer copies it into the Square
   checkout, and the unlock code they get back is signed for that shop ID, so it only works on their phone.
   The app checks the code's signature with the public key below, right on the phone, so a code can't be made
   up or moved to another phone. Owned items, their codes, and the shop ID are saved in settings, so they're in
   every backup: restoring a backup on a new phone brings the purchases with it. */
const STORE_KEY = { kty: "EC", crv: "P-256", x: "5z8CcvyxM9MEFoptnk7mZz33DZzmIp-1ermfgHGN8P8", y: "mkWjxpCTM4Yf1AtFNA56VgENiLJ8kzWUtnUhY0my9Xk" };

const storeItem = id => STORE_ITEMS.find(x => x.id === id);
const ownsItem = id => (settings.owned || []).includes(id);
const hatFromShop = h => !!(h && h.shop);

function b64urlBytes(s) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}

/* This phone's shop ID, made once: "PP-" and eight letters and numbers that are hard to mix up. */
const SHOP_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function shopId() {
  if (!/^[A-Z2-9]{8}$/.test(settings.shopId || "")) {
    const r = crypto.getRandomValues(new Uint8Array(8));
    settings.shopId = Array.from(r, n => SHOP_ID_CHARS[n % 32]).join("");
    saveSettings();
  }
  return settings.shopId;
}
const shopIdText = (id = shopId()) => "PP-" + id.slice(0, 4) + "-" + id.slice(4);

/* Checks a code. Returns { item, code } when it's real and made for this phone, { other: id } when it's real
   but made for a different phone, or null when it isn't a real code. */
async function checkCode(raw) {
  const code = String(raw || "").trim().replace(/\s+/g, "");
  // P2 codes are tied to one phone's shop ID. The older P1 codes still count when restored from a backup.
  const m = code.match(/^(P2\.([a-z0-9-]+)\.([A-Z2-9]{8})\.([A-Z0-9]{4,12}))\.([A-Za-z0-9_-]{80,90})$/)
    || code.match(/^(P1\.([a-z0-9-]+)\.()([A-Z0-9]{4,12}))\.([A-Za-z0-9_-]{80,90})$/);
  if (!m || !storeItem(m[2])) return null;
  if (code.startsWith("P1.") && !(settings.storeCodes || []).includes(code)) return null;
  try {
    const key = await crypto.subtle.importKey("jwk", STORE_KEY, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64urlBytes(m[5]), new TextEncoder().encode(m[1]));
    if (!ok) return null;
    if (m[3] && m[3] !== shopId()) return { other: m[3] };
    return { item: storeItem(m[2]), code };
  } catch (e) { return null; }
}

async function redeemCode(raw) {
  const res = await checkCode(raw);
  if (!res) { toast(t("That code didn't work. Check that it's copied exactly, or tap the link from your receipt email.")); sfx("tick"); return false; }
  if (res.other) {
    toast(t("That code was made for a different phone ({other}). This phone's shop ID is {mine}. Send us this ID and we'll make you a code for it.", { other: shopIdText(res.other), mine: shopIdText() }));
    sfx("tick"); return false;
  }
  const it = res.item;
  if (ownsItem(it.id)) { toast(t("You already have the {item}.", { item: t(it.name) })); return true; }
  settings.owned = [...(settings.owned || []), it.id];
  settings.storeCodes = [...(settings.storeCodes || []), res.code];
  saveSettings();
  toast(t("Unlocked the {item}! Thank you for supporting Pantry Pal.", { item: t(it.name) }));
  if (typeof confetti === "function") confetti();
  sfx("cheer"); buzz([10, 50, 10, 50, 20]);
  renderShop();
  if ($("#hatsPage") && $("#hatsPage").open) renderHats();
  renderAll();
  return true;
}

function openShop() {
  renderShop();
  if (!$("#shopPage").open) $("#shopPage").showModal();
}

function renderShop() {
  renderShopId();
  const box = $("#storeItems"); if (!box) return;
  box.innerHTML = STORE_ITEMS.map(it => {
    const own = ownsItem(it.id);
    const hats = (it.hats || []).map(id => `<span class="store-hat">${palSVG("happy", 64, { hat: id, pose: "rest", sprout: 1 })}<span class="small">${esc(t((benjiHat(id) || {}).name || ""))}</span></span>`).join("");
    const action = own ? `<p class="store-owned"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg> ${esc(t("Yours! Find them in Benji's hats."))}</p>`
      : it.buyUrl ? `<a class="button primary wide store-buy" href="${esc(it.buyUrl)}" target="_blank" rel="noopener" data-store-buy>${esc(t("Buy for {price}", { price: it.price }))}</a>`
      : `<button type="button" class="wide" disabled>${esc(t("Coming soon"))}</button>`;
    return `<li class="card store-item">
      <div class="store-head"><h3>${esc(t(it.name))}</h3><span class="store-price">${esc(own ? t("Owned") : it.price)}</span></div>
      <p>${esc(t(it.desc))}</p>
      ${hats ? `<div class="store-hats">${hats}</div>` : ""}
      ${action}
    </li>`;
  }).join("");
}

/* Copy the shop ID so it can be pasted into the Square checkout. */
async function copyShopId(quiet) {
  const id = shopIdText();
  try { await navigator.clipboard.writeText(id); if (!quiet) toast(t("Copied {id}. Paste it into the shop ID box at checkout.", { id })); return true; }
  catch (e) { if (!quiet) Ask.copy({ title: t("Your shop ID"), value: id }); return false; }
}
function renderShopId() {
  const el = $("#storeId"); if (el) el.textContent = shopIdText();
}

function storeInit() {
  // Buy: copy the shop ID on the way to checkout
  $("#shopPage").addEventListener("click", e => {
    if (e.target.closest("[data-store-buy]")) { copyShopId(true); toast(t("Your shop ID {id} is copied. Paste it into the shop ID box at checkout.", { id: shopIdText() })); }
    if (e.target.closest("#storeIdCopy")) copyShopId(false);
  });
  $("#shopPage").addEventListener("submit", e => {
    if (!e.target.closest("#storeRedeem")) return;
    e.preventDefault();
    const inp = $("#storeCode");
    redeemCode(inp.value).then(ok => { if (ok) inp.value = ""; });
  });
  $("#storeBtn").addEventListener("click", () => { $("#settingsDialog").close(); openShop(); });
  renderShop();
}
