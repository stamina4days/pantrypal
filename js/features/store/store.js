"use strict";
/* Benji's shop: extras you can buy, like hat packs. Everything that saves food and money stays free.
   How buying works: each phone gets its own shop ID (settings.shopId). The buyer copies it into the Square
   checkout, and the unlock code they get back is signed for that shop ID, so it only works on their phone.
   The app checks the code's signature with the public key below, right on the phone, so a code can't be made
   up or moved to another phone. Owned items, their codes, and the shop ID are saved in settings, so they're in
   every backup: restoring a backup on a new phone brings the purchases with it. */
const STORE_KEY = { kty: "EC", crv: "P-256", x: "5z8CcvyxM9MEFoptnk7mZz33DZzmIp-1ermfgHGN8P8", y: "mkWjxpCTM4Yf1AtFNA56VgENiLJ8kzWUtnUhY0my9Xk" };

/* Anything a code can unlock: the shop items, plus each tip jar amount. */
const storeItem = id => STORE_ITEMS.find(x => x.id === id)
  || STORE_ITEMS.filter(x => x.tiers).flatMap(x => x.tiers.map(tr => ({ ...tr, kind: "tip", name: x.name }))).find(x => x.id === id);
/* What the Everything bundle unlocks: every item except the bundle itself and tips. */
const BUNDLE_HAS = () => STORE_ITEMS.filter(x => x.kind !== "bundle" && x.kind !== "tip").map(x => x.id);
const ownsItem = id => {
  const o = settings.owned || [];
  return o.includes(id) || (o.includes("bundle") && BUNDLE_HAS().includes(id));
};
/* Anyone who left a tip gets the Supporter badge and a golden sprout (unless they turn it off). */
const isSupporter = () => (settings.owned || []).some(id => /^tip-/.test(id));
const benjiGolden = () => isSupporter() && settings.goldenSprout !== false;
/* Bigger tips grow a bigger golden sprout: $1 a sprout, $3 a leafy one, $5 in full bloom. */
const benjiGoldStage = () => !benjiGolden() ? 0 : ownsItem("tip-5") ? 3 : ownsItem("tip-3") ? 2 : 1;
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
    toast(t("That code was made for a different phone ({other}). This phone's shop ID is {mine}. Email this ID to signaftersix@gmail.com and we'll make you a code for it.", { other: shopIdText(res.other), mine: shopIdText() }));
    sfx("tick"); return false;
  }
  const it = res.item;
  if ((settings.storeCodes || []).includes(res.code) || (it.kind !== "tip" && ownsItem(it.id))) { toast(t("You already have the {item}.", { item: t(it.name) })); return true; }
  const wasSupporter = isSupporter(), wasStage = benjiGoldStage();
  if (!(settings.owned || []).includes(it.id)) settings.owned = [...(settings.owned || []), it.id];
  settings.storeCodes = [...(settings.storeCodes || []), res.code];
  // The thank-you below already mentions the Supporter badge, so don't celebrate it twice
  if (it.kind === "tip" && Array.isArray(settings.badges) && !settings.badges.includes("supporter")) settings.badges = [...settings.badges, "supporter"];
  saveSettings();
  toast(it.kind === "tip" ? (!wasSupporter ? t("Thank you for the tip! Benji's sprout turned gold, and you earned the Supporter badge.")
      : benjiGoldStage() > wasStage ? t("Thank you! Benji's golden sprout just grew.") : t("Thank you for another tip! You're the best."))
    : it.kind === "bundle" ? t("Unlocked everything in Benji's shop! Thank you for supporting Pantry Pal.")
    : t("Unlocked the {item}! Thank you for supporting Pantry Pal.", { item: t(it.name) }));
  if (typeof applyKitchenTheme === "function") applyKitchenTheme();
  if (typeof Radio !== "undefined") Radio.render();
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
  const cell = (art, name) => `<span class="store-hat">${art}<span class="small">${esc(t(name))}</span></span>`;
  const preview = it => {
    if (it.kind === "hats") return (it.hats || []).map(id => cell(palSVG("happy", 64, { hat: id, pose: "rest", sprout: 1, wear: false }), (benjiHat(id) || {}).name || "")).join("");
    if (it.kind === "outfits") return BENJI_OUTFITS.map(o => cell(palSVG("happy", 64, { pose: "rest", sprout: 1, outfit: false, wear: o.id }), o.name)).join("");
    if (it.kind === "themes") return KITCHEN_THEMES.filter(x => x.shop).map(th => cell(`<span class="theme-swatch" style="--a:${th.swatch[0]};--b:${th.swatch[1]};--c:${th.swatch[2]}"></span>`, th.name)).join("");
    if (it.kind === "radio") return RADIO_STATIONS.filter(x => x.shop).map(st => cell(`<span class="radio-dot" aria-hidden="true">${st.icon}</span>`, st.name)).join("");
    return "";
  };
  const buy = (url, label) => url
    ? `<a class="button primary wide store-buy" href="${esc(url)}" target="_blank" rel="noopener" data-store-buy>${esc(label)}</a>`
    : `<button type="button" class="wide" disabled>${esc(t("Coming soon"))}</button>`;
  const owned = it => `<p class="store-owned"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg> ${esc(t(
    it.kind === "themes" ? "Yours! Pick one in Settings." : it.kind === "radio" ? "Yours! Find them on the kitchen radio."
    : it.kind === "outfits" ? "Yours! Dress Benji on the hats page." : it.kind === "bundle" ? "Yours! Everything in the shop is unlocked." : "Yours! Find them in Benji's hats."))}</p>`;
  box.innerHTML = STORE_ITEMS.map(it => {
    if (it.kind === "tip") {
      const tiers = it.tiers.map(tr => tr.buyUrl ? `<a class="button store-buy store-tip" href="${esc(tr.buyUrl)}" target="_blank" rel="noopener" data-store-buy>${esc(tr.price)}</a>`
        : `<button type="button" class="store-tip" disabled>${esc(tr.price)}</button>`).join("");
      return `<li class="card store-item">
        <div class="store-head"><h3>${esc(t(it.name))}</h3><span class="store-price">${esc(t(it.price))}</span></div>
        <p>${esc(t(it.desc))}</p>
        <div class="store-tips">${tiers}</div>
        ${it.tiers.every(tr => !tr.buyUrl) ? `<p class="muted small">${esc(t("Coming soon"))}</p>` : ""}
        <div class="store-tip-reward">${[1, 2, 3].map(n => `<span class="store-tip-stage">${palSVG("cheer", 56, { pose: "cheer", sprout: n, outfit: false, wear: false, golden: true })}<span class="small">${["$1", "$3", "$5"][n - 1]}</span></span>`).join("")}</div>
        ${isSupporter() ? `<p class="store-owned"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg> ${esc(t("Thank you! Your golden sprout and Supporter badge are unlocked."))}</p>` : ""}
      </li>`;
    }
    const own = ownsItem(it.id);
    const pv = preview(it);
    return `<li class="card store-item ${it.kind === "bundle" ? "store-bundle" : ""}">
      <div class="store-head"><h3>${esc(t(it.name))}</h3><span class="store-price">${esc(own ? t("Owned") : it.price)}</span></div>
      <p>${esc(t(it.desc))}</p>
      ${it.kind === "bundle" && !own ? `<p class="small store-was"><s>${esc(it.was)}</s> <b>${esc(it.price)}</b>. ${esc(t("Already own a pack? Email us your shop ID and we'll take its price off."))}</p>` : ""}
      ${pv ? `<div class="store-hats">${pv}</div>` : ""}
      ${own ? owned(it) : buy(it.buyUrl, t("Buy for {price}", { price: it.price }))}
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
  const todayShop = $("#todayShopBtn");   // the shop flyer on the fridge on Today
  if (todayShop) todayShop.addEventListener("click", () => openShop());
  renderShop();
}
