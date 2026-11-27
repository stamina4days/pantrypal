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
/* What the Everything bundle unlocks: every item except the bundle itself, tips, and free items. */
const BUNDLE_HAS = () => STORE_ITEMS.filter(x => x.kind !== "bundle" && x.kind !== "tip" && !x.free).map(x => x.id);
const ownsItem = id => {
  const o = settings.owned || [];
  return o.includes(id) || (o.includes("bundle") && BUNDLE_HAS().includes(id));
};
/* Anyone who left a tip gets the Supporter badge and a golden sprout (unless they turn it off). */
const isSupporter = () => (settings.owned || []).some(id => /^tip-/.test(id));
const benjiGolden = () => isSupporter() && settings.goldenSprout !== false;
/* Bigger tips grow a bigger golden sprout: $1 a sprout, $3 a leafy one, $5 in full bloom. */
const benjiGoldStage = () => !benjiGolden() ? 0 : ownsItem("tip-5") ? 3 : ownsItem("tip-3") ? 2 : 1;

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
  if (typeof unboxMoment === "function" && it.kind !== "tip") unboxMoment(it);
  else { if (typeof confetti === "function") confetti(); sfx("cheer"); buzz([10, 50, 10, 50, 20]); }
  renderShop();
  if ($("#hatsPage") && $("#hatsPage").open) renderHats();
  renderAll();
  return true;
}

/* Free packs start locked. One tap in the shop claims it, then the box opens. */
function claimFreeItem(id) {
  const it = storeItem(id);
  if (!it || !it.free || ownsItem(id)) return;
  settings.owned = [...(settings.owned || []), id];
  if (it.id === "hats-anime") { settings.counts = settings.counts || {}; settings.counts.rescueMeter = settings.counts.rescueMeter || 0; }
  saveSettings();
  if (typeof unboxMoment === "function") unboxMoment(it);
  toast(t("The {item} is yours! Find it in Benji's hats.", { item: t(it.name) }));
  renderShop();
  if ($("#hatsPage") && $("#hatsPage").open) renderHats();
  renderAll();
}

function openShop() {
  renderShop();
  if (!$("#shopPage").open) $("#shopPage").showModal();
}

/* Each shop item is a little poster: an awning across the top, the price on a gold coin, and a show of what's inside. */
const TIP_TIERS = [
  { n: 1, title: "Thank you", gets: "Benji's sprout turns gold, and you earn the Supporter badge.", coins: 1 },
  { n: 2, title: "Big thanks", gets: "A leafier golden sprout for Benji, and the Supporter badge.", coins: 2 },
  { n: 3, title: "You're a star", gets: "Benji's golden sprout in full bloom, and the Supporter badge.", coins: 4 }
];
function renderShop() {
  renderShopId();
  const box = $("#storeItems"); if (!box) return;
  const snap = (art, name, cls = "") => `<figure class="sp-snap ${cls}">${art}<figcaption>${esc(t(name))}</figcaption></figure>`;
  const benjiIn = (opts, size = 76) => palSVG("happy", size, { pose: "wave", sprout: 1, ...opts });
  // A real mini kitchen in each theme, drawn with the theme's own colors and wall piece
  const themeImg = id => `<span class="tp-frame" aria-hidden="true"><span class="tp-mini theme-${id}"><span class="tp-fridge"></span><span class="tp-decor">${id === "diner" ? "EAT" : ""}</span>
    <span class="tp-benji">${palSVG("happy", 92, { pose: "wave", sprout: 1 })}</span><span class="tp-console"><i></i><b></b><span>${esc(t("Play"))}</span></span>
    <span class="tp-counter"></span><span class="tp-floor"></span></span></span>`;
  const radioBtn = st => `<button type="button" class="sp-station" data-radio-sample="${st.id}" aria-pressed="false">
      <span class="sp-disc" aria-hidden="true">${st.icon}<span class="sp-eq"><i></i><i></i><i></i><i></i></span></span>
      <span class="sp-st-name">${esc(t(st.name))}</span>
      <span class="sp-st-hint" aria-hidden="true"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/speaker.svg#i"/></svg> ${esc(t("Sample"))}</span>
      <span class="sr-only sr-state">${esc(t("Tap to hear a sample"))}</span></button>`;
  const shopThemes = KITCHEN_THEMES.filter(x => x.shop);
  const songBtn = id => `<button type="button" class="sp-song" data-radio-sample="${id}" aria-pressed="false"><span class="sp-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><svg class="ic" aria-hidden="true"><use href="img/icons/ui/music.svg#i"/></svg> <span>${esc(t("Hear its song"))}</span><span class="sr-only sr-state">${esc(t("Tap to hear a sample"))}</span></button>`;
  const show = it => {
    if (it.kind === "hats") return `<div class="sp-grid sp-4">${(it.hats || []).map((id, i) => snap(benjiIn({ hat: id, wear: false }), (benjiHat(id) || {}).name || "", "r" + i)).join("")}</div>`;
    if (it.kind === "outfits") return `<div class="sp-grid sp-4">${BENJI_OUTFITS.map((o, i) => snap(benjiIn({ outfit: false, wear: o.id }), o.name, "r" + i)).join("")}</div>`;
    if (it.kind === "themes") return `<div class="sp-grid sp-2">${shopThemes.map((th, i) => snap(themeImg(th.id) + songBtn("theme:" + th.id), th.name, "sp-photo r" + i)).join("")}</div>
      <p class="sp-note">${esc(t("Every theme has its own song. Tap Hear its song for a 10 second sample."))}</p>`;
    if (it.kind === "radio") return `<div class="sp-radio">${RADIO_STATIONS.filter(x => x.shop).map(radioBtn).join("")}</div>
      <p class="sp-note">${esc(t("Tap a station to hear a 10 second sample from the middle of its song."))}</p>`;
    if (it.kind === "bundle") return `<div class="sp-grid sp-2">
      ${snap(`<span class="sp-collage">${shopThemes.map(th => themeImg(th.id)).join("")}</span>`, "4 kitchen themes", "sp-photo r0")}
      ${snap(`<span class="sp-trio">${["cowboy", "elf", "pizza"].map(h => benjiIn({ hat: h, wear: false }, 52)).join("")}</span>`, "16 hats in 4 packs", "r1")}
      ${snap(`<span class="sp-trio">${["apron", "glasses"].map(w => benjiIn({ outfit: false, wear: w }, 56)).join("")}</span>`, "4 outfits", "r2")}
      ${snap(`<span class="sp-disc sp-disc-big" aria-hidden="true">${(RADIO_STATIONS.find(x => x.id === "campfire") || {}).icon || ""}</span>`, "4 radio stations", "r3")}
    </div>`;
    return "";
  };
  const coin = (price, cls = "") => `<span class="sp-coin ${cls}">${esc(price)}</span>`;
  const buy = (url, label) => url
    ? `<a class="button primary wide store-buy" href="${esc(url)}" target="_blank" rel="noopener" data-store-buy>${esc(label)}</a>`
    : `<button type="button" class="wide" disabled>${esc(t("Coming soon"))}</button>`;
  const owned = it => `<p class="store-owned"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg> ${esc(t(
    it.kind === "themes" ? "Yours! Pick one in Settings." : it.kind === "radio" ? "Yours! Find them in the music menu."
    : it.kind === "outfits" ? "Yours! Dress Benji on the hats page." : it.kind === "bundle" ? "Yours! Everything in the shop is unlocked."
    : "Yours! Find them in Benji's hats."))}</p>`;
  const claim = it => `<button type="button" class="primary wide store-claim" data-store-claim="${esc(it.id)}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/gift.svg#i"/></svg> <span>${esc(t("Get it free"))}</span></button>`;
  box.innerHTML = STORE_ITEMS.map(it => {
    if (it.kind === "tip") {
      const tiers = it.tiers.map((tr, i) => {
        const tt = TIP_TIERS[i] || TIP_TIERS[0];
        const coins = Array.from({ length: tt.coins }, (_, k) => `<i class="c${k}"></i>`).join("");
        const art = `<span class="sp-tier-art" aria-hidden="true"><span class="sp-coins">${coins}</span>${palSVG("cheer", 70 + i * 12, { pose: "cheer", sprout: tt.n, outfit: false, wear: false, golden: true })}</span>`;
        const inner = `${art}<span class="sp-tier-text"><strong>${esc(t(tt.title))}</strong><span>${esc(t(tt.gets))}</span></span>${coin(tr.price, "sp-coin-sm")}`;
        return tr.buyUrl ? `<a class="sp-tier sp-tier-${tt.n} store-tip" href="${esc(tr.buyUrl)}" target="_blank" rel="noopener" data-store-buy aria-label="${esc(t("Tip {price}: {title}", { price: tr.price, title: t(tt.title) }))}">${inner}</a>`
          : `<span class="sp-tier sp-tier-${tt.n} store-tip is-off">${inner}</span>`;
      }).join("");
      return `<li class="store-item sp-poster sp-tipjar">
        <span class="sp-awning" aria-hidden="true"></span>
        <div class="sp-head"><h3>${esc(t(it.name))}</h3>${coin(t("You pick"), "sp-coin-wide")}</div>
        <p class="sp-desc">${esc(t("Just want to say thanks? Any tip helps keep Pantry Pal free. The bigger the tip, the bigger Benji's golden sprout grows."))}</p>
        <div class="sp-tiers">${tiers}</div>
        ${isSupporter() ? `<p class="store-owned"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg> ${esc(t("Thank you! Your golden sprout and Supporter badge are unlocked."))}</p>` : ""}
      </li>`;
    }
    const own = ownsItem(it.id);
    return `<li class="store-item sp-poster ${it.kind === "bundle" ? "sp-bundle" : ""}">
      <span class="sp-awning" aria-hidden="true"></span>
      ${it.kind === "bundle" && !own ? `<span class="sp-ribbon">${esc(t("Best deal"))}</span>` : ""}
      <div class="sp-head"><h3>${esc(t(it.name))}</h3>${own ? coin(t("Owned"), "sp-coin-wide sp-owned") : it.free ? coin(t("Free"), "sp-coin-wide") : coin(it.price)}</div>
      <p class="sp-desc">${esc(t(it.desc))}</p>
      ${show(it)}
      ${it.kind === "bundle" && !own ? `<p class="sp-was"><s>${esc(it.was)}</s> <b>${esc(it.price)}</b>. ${esc(t("Already own a pack? Email us your shop ID and we'll take its price off."))}</p>` : ""}
      ${own ? owned(it) : it.free ? claim(it) : buy(it.buyUrl, t("Buy for {price}", { price: it.price }))}
    </li>`;
  }).join("");
  if (typeof Radio !== "undefined") Radio.render();
  fitMiniKitchens();
}
/* Scale each mini kitchen to fit its picture frame */
let miniObserver = null;
function fitMiniKitchens() {
  const fit = () => document.querySelectorAll("#storeItems .tp-frame").forEach(f => { if (f.clientWidth) f.style.setProperty("--tp-s", (f.clientWidth / 240).toFixed(4)); });
  fit();
  if (!miniObserver && typeof ResizeObserver === "function" && $("#storeItems")) { miniObserver = new ResizeObserver(fit); miniObserver.observe($("#storeItems")); }
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
    if (e.target.closest("[data-store-buy]")) { copyShopId(true); toast(t("Your shop ID {id} is copied. Paste it into the shop ID box at checkout. Your code arrives by email within 24 hours.", { id: shopIdText() })); }
    if (e.target.closest("#storeIdCopy")) copyShopId(false);
    const cl = e.target.closest("[data-store-claim]");
    if (cl) claimFreeItem(cl.dataset.storeClaim);
    const sample = e.target.closest("[data-radio-sample]");
    if (sample && typeof Radio !== "undefined") {
      if (Radio.previewing() === sample.dataset.radioSample) Radio.endPreview();
      else if (!Radio.preview(sample.dataset.radioSample, 10000)) toast(t("This phone can't play music."));
    }
  });
  // Leaving the shop stops a sample that's still playing
  $("#shopPage").addEventListener("close", () => { if (typeof Radio !== "undefined" && Radio.previewing()) Radio.endPreview(); });
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
