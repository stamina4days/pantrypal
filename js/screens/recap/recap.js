"use strict";
/* Your week with Benji: the food you used in time, the money that stayed in your pocket, and what got tossed,
   counted from the last 7 days. It opens by itself once a week (from Sunday on) when there's something to show,
   and it turns into a picture you can share. */

function recapData() {
  const end = todayStr(), start = addDaysFrom(end, -6);
  const week = history.filter(e => e.date >= start && e.date <= end);
  const used = week.filter(e => e.outcome === "used" && (e.d === null || e.d >= 0));
  const tossed = week.filter(e => e.outcome === "wasted");
  const names = [];
  used.forEach(e => { if (!names.some(n => norm(n) === norm(e.name))) names.push(e.name); });
  return {
    start, end,
    used: used.length,
    saved: Math.round(used.reduce((s, e) => s + (e.v || 0), 0) * 100) / 100,
    tossed: tossed.length,
    lost: Math.round(tossed.reduce((s, e) => s + (e.v || 0), 0) * 100) / 100,
    cooked: cookedLog.filter(x => x.date >= start && x.date <= end).length,
    foods: names.slice(0, 6)
  };
}

/* The Sunday that starts this week's recap */
function recapWeekKey() {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  return addDaysFrom(todayStr(), -d.getDay());
}
function recapDue() {
  if (!settings.onboarded || settings.recapSeen === recapWeekKey()) return false;
  const first = history.reduce((m, e) => !m || e.date < m ? e.date : m, null);
  if (!first || first > addDaysFrom(todayStr(), -3)) return false;   // give a new kitchen a few days first
  const r = recapData();
  return r.used + r.tossed > 0;
}

function recapRangeText(r) {
  const f = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
  return t("{a} to {b}", { a: f(r.start), b: f(r.end) });
}
function recapLine(r) {
  if (!r.used && !r.tossed) return t("Nothing to count yet this week. When you mark food Used it or Tossed, I add it up here.");
  if (r.used && !r.tossed) return tn(r.used, "You used 1 food before it went bad, and nothing got tossed. Perfect week!", "You used {n} foods before they went bad, and nothing got tossed. Perfect week!");
  if (r.used >= r.tossed) return t("You saved more than you tossed this week. Keep it up!");
  return t("A few things got away this week. Check the fridge magnets each morning and we'll catch them next time.");
}

let recapCardUrl = "";
async function openRecap() {
  settings.recapSeen = recapWeekKey(); saveSettings();
  const r = recapData(), box = $("#rcBody");
  $("#rcRange").textContent = recapRangeText(r);
  const empty = !r.used && !r.tossed;
  box.innerHTML = palBubble(empty ? "wink" : r.used >= r.tossed ? "proud" : "worried", recapLine(r), [])
    + (empty ? "" : `<div class="recap-card"><img id="rcCard" alt="${esc(t("Your week with Benji, as a picture to share"))}"></div>
      <div class="stat-chips">
        <span class="stat-chip good"><strong>${r.used}</strong> ${esc(t("used in time"))}</span>
        ${r.saved >= 1 ? `<span class="stat-chip good"><strong>${esc(fmtMoney(r.saved))}</strong> ${esc(t("saved"))}</span>` : ""}
        <span class="stat-chip ${r.tossed ? "expired" : ""}"><strong>${r.tossed}</strong> ${esc(t("tossed"))}${r.lost >= 1 ? " (" + esc(fmtMoney(r.lost)) + ")" : ""}</span>
        ${r.cooked ? `<span class="stat-chip"><strong>${r.cooked}</strong> ${esc(tn(r.cooked, "meal cooked", "meals cooked"))}</span>` : ""}
      </div>
      <button type="button" id="rcShare" class="primary wide big-add"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/share.svg#i"/></svg> <span>${esc(t("Share my week"))}</span></button>
      <p class="muted small center">${esc(t("Counts the food you marked Used it or Tossed in the last 7 days. Prices are estimates."))}
        <button type="button" class="link-btn" data-explain="saved">${esc(t("How is this counted?"))}</button></p>`);
  if (!$("#recapPage").open) $("#recapPage").showModal();
  if (!empty) {
    try { const blob = await drawRecapCard(r); if (recapCardUrl) URL.revokeObjectURL(recapCardUrl); recapCardUrl = URL.createObjectURL(blob); const img = $("#rcCard"); if (img) img.src = recapCardUrl; }
    catch (e) { const c = $(".recap-card"); if (c) c.remove(); }
  }
}

/* ---------- the picture ---------- */
function loadImg(src) {
  return new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
async function drawRecapCard(r) {
  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  try { await Promise.all(["900 100px Nunito", "800 40px Nunito", "700 80px Kalam"].map(f => document.fonts.load(f))); } catch (e) {}
  const ink = "#3B2F2A", green = "#2A7F3F", red = "#E5482F", cream = "#FBF3E4";
  ctx.fillStyle = cream; ctx.fillRect(0, 0, W, H);
  // Grid like the kitchen wall
  ctx.strokeStyle = "rgba(201,143,90,.18)"; ctx.lineWidth = 3;
  for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // The striped awning
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? cream : red;
    ctx.fillRect(i * 90, 0, 90, 96);
    ctx.beginPath(); ctx.arc(i * 90 + 45, 96, 45, 0, Math.PI); ctx.fill();
  }
  ctx.textAlign = "center"; ctx.fillStyle = ink;
  ctx.font = "700 80px Kalam, cursive"; ctx.fillText(t("My week with Benji"), W / 2, 250);
  ctx.font = "800 38px Nunito, sans-serif"; ctx.fillStyle = "#7A6A5C"; ctx.fillText(recapRangeText(r), W / 2, 305);
  // The big number
  const money = r.saved >= 1;
  ctx.fillStyle = green; ctx.font = "900 210px Nunito, sans-serif";
  ctx.fillText(money ? fmtMoney(r.saved) : String(r.used), W / 2, 530);
  ctx.fillStyle = ink; ctx.font = "800 46px Nunito, sans-serif";
  ctx.fillText(money ? t("of groceries saved from the trash") : tn(r.used, "food used before it went bad", "foods used before they went bad"), W / 2, 605);
  // Two tags
  const tags = [tn(r.used, "1 food used in time", "{n} foods used in time"), r.cooked ? tn(r.cooked, "1 meal cooked", "{n} meals cooked") : tn(r.tossed, "1 thing tossed", "{n} things tossed")];
  if (!money) tags[0] = r.cooked ? tn(r.cooked, "1 meal cooked", "{n} meals cooked") : tn(r.tossed, "1 thing tossed", "{n} things tossed");
  ctx.font = "800 38px Nunito, sans-serif";
  const shown = money ? tags : [tags[0]];
  const widths = shown.map(s => ctx.measureText(s).width + 64), total = widths.reduce((a, b) => a + b, 0) + (shown.length - 1) * 24;
  let x = (W - total) / 2;
  shown.forEach((s, i) => {
    ctx.fillStyle = i ? "#FFF2B8" : "#D7F2DD"; roundRect(ctx, x, 650, widths[i], 76, 38); ctx.fill();
    ctx.strokeStyle = "#AD7D51"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = ink; ctx.fillText(s, x + widths[i] / 2, 702);
    x += widths[i] + 24;
  });
  // The foods saved, as stickers
  const pics = await Promise.all(r.foods.map(n => loadImg(`img/food/${foodStickerName(n)}.svg`).catch(() => null)));
  const got = pics.filter(Boolean), size = 130, gap = 26;
  let sx = (W - (got.length * size + (got.length - 1) * gap)) / 2;
  got.forEach((im, i) => { ctx.save(); ctx.translate(sx + size / 2, 850); ctx.rotate((i % 2 ? 6 : -6) * Math.PI / 180); ctx.drawImage(im, -size / 2, -size / 2, size, size); ctx.restore(); sx += size + gap; });
  // Benji and the sign-off
  try { const b = await loadImg("img/pal/proud.svg"); ctx.drawImage(b, 780, 990, 230, 309); } catch (e) {}
  ctx.textAlign = "left"; ctx.fillStyle = ink;
  ctx.font = "700 72px Kalam, cursive"; ctx.fillText("Benji's Kitchen", 90, 1110);
  ctx.font = "800 36px Nunito, sans-serif"; ctx.fillText(t("Cook what you have"), 90, 1166); ctx.fillText(t("before it goes to waste."), 90, 1210);
  ctx.fillStyle = green; ctx.font = "900 34px Nunito, sans-serif"; ctx.fillText("stamina4days.github.io/pantrypal", 90, 1268);
  return new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error("no picture")), "image/png"));
}

async function shareRecap() {
  const r = recapData();
  let blob;
  try { blob = await drawRecapCard(r); } catch (e) { toast(t("Couldn't make the picture on this phone.")); return; }
  const file = new File([blob], "my-week-with-benji.png", { type: "image/png" });
  const text = r.saved >= 1 ? t("I saved {money} of groceries from the trash this week with Benji's Kitchen.", { money: fmtMoney(r.saved) })
    : tn(r.used, "I used 1 food before it went bad this week with Benji's Kitchen.", "I used {n} foods before they went bad this week with Benji's Kitchen.");
  const url = "https://stamina4days.github.io/pantrypal/";
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: text + " " + url }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  // No sharing here: save the picture instead
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast(t("Saved the picture. Share it from your photos or downloads."));
}

function recapInit() {
  $("#recapPage").addEventListener("click", e => { if (e.target.closest("#rcShare")) shareRecap(); });
}
