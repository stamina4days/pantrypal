"use strict";
/* Benji's shop: extras you can buy, like hat packs. Everything that saves food and money stays free.
   How buying works: the Buy button opens the item's Square checkout. After paying, the buyer gets an unlock
   code (or a link with it). The app checks the code's signature with the public key below, right on the phone,
   so a code can't be made up. Owned items and their codes are saved in settings, so they're in every backup. */
const STORE_KEY = { kty: "EC", crv: "P-256", x: "5z8CcvyxM9MEFoptnk7mZz33DZzmIp-1ermfgHGN8P8", y: "mkWjxpCTM4Yf1AtFNA56VgENiLJ8kzWUtnUhY0my9Xk" };

const storeItem = id => STORE_ITEMS.find(x => x.id === id);
const ownsItem = id => (settings.owned || []).includes(id);
const hatFromShop = h => !!(h && h.shop);

function b64urlBytes(s) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}

/* Returns the item a code unlocks, or null if the code isn't real. */
async function checkCode(raw) {
  const code = String(raw || "").trim().replace(/\s+/g, "");
  const m = code.match(/^(P1\.([a-z0-9-]+)\.([A-Z0-9]{4,12}))\.([A-Za-z0-9_-]{80,90})$/);
  if (!m || !storeItem(m[2])) return null;
  try {
    const key = await crypto.subtle.importKey("jwk", STORE_KEY, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64urlBytes(m[4]), new TextEncoder().encode(m[1]));
    return ok ? { item: storeItem(m[2]), code } : null;
  } catch (e) { return null; }
}

async function redeemCode(raw) {
  const res = await checkCode(raw);
  if (!res) { toast(t("That code didn't work. Check that it's copied exactly, or tap the link from your receipt email.")); sfx("tick"); return false; }
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
  const box = $("#storeItems"); if (!box) return;
  box.innerHTML = STORE_ITEMS.map(it => {
    const own = ownsItem(it.id);
    const hats = (it.hats || []).map(id => `<span class="store-hat">${palSVG("happy", 64, { hat: id, pose: "rest", sprout: 1 })}<span class="small">${esc(t((benjiHat(id) || {}).name || ""))}</span></span>`).join("");
    const action = own ? `<p class="store-owned"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg> ${esc(t("Yours! Find them in Benji's hats."))}</p>`
      : it.buyUrl ? `<a class="button primary wide store-buy" href="${esc(it.buyUrl)}" target="_blank" rel="noopener">${esc(t("Buy for {price}", { price: it.price }))}</a>`
      : `<button type="button" class="wide" disabled>${esc(t("Coming soon"))}</button>`;
    return `<li class="card store-item">
      <div class="store-head"><h3>${esc(t(it.name))}</h3><span class="store-price">${esc(own ? t("Owned") : it.price)}</span></div>
      <p>${esc(t(it.desc))}</p>
      ${hats ? `<div class="store-hats">${hats}</div>` : ""}
      ${action}
    </li>`;
  }).join("");
}

function storeInit() {
  $("#shopPage").addEventListener("submit", e => {
    if (!e.target.closest("#storeRedeem")) return;
    e.preventDefault();
    const inp = $("#storeCode");
    redeemCode(inp.value).then(ok => { if (ok) inp.value = ""; });
  });
  $("#storeBtn").addEventListener("click", () => { $("#settingsDialog").close(); openShop(); });
  renderShop();
}
