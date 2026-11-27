"use strict";
/* The photo booth: put Benji in any hat he owns, pick a pose and a frame, add a caption, then save or share the picture. */
const BOOTH_POSES = [
  { id: "wave", mood: "happy", pose: "wave", name: "Wave" },
  { id: "cheer", mood: "proud", pose: "cheer", name: "Cheer" },
  { id: "wink", mood: "wink", pose: "point", name: "Wink" },
  { id: "chill", mood: "happy", pose: "rest", name: "Chill" }
];
const BOOTH_FRAMES = [
  { id: "snap", name: "Snapshot" },
  { id: "kitchen", name: "Kitchen" },
  { id: "stars", name: "Starry" }
];
const BOOTH_W = 900, BOOTH_H = 1120;
let booth = null, boothDrawN = 0;

function openBooth() {
  const id = wornHatId();
  booth = booth || { pose: "wave", frame: "snap", caption: "" };
  booth.hat = booth.hat && benjiHat(booth.hat) && hatUnlocked(benjiHat(booth.hat)) ? booth.hat : id || "none";
  renderBooth();
  if (!$("#boothPage").open) $("#boothPage").showModal();
}

function renderBooth() {
  const hats = ["none", ...BENJI_HATS.filter(h => h.season || hatUnlocked(h)).map(h => h.id)];
  $("#boothHats").innerHTML = hats.map(id => {
    const h = benjiHat(id), on = booth.hat === id;
    return `<button type="button" class="booth-hat ${on ? "on" : ""}" data-booth-hat="${id}" aria-pressed="${on}" aria-label="${esc(h ? t(h.name) : t("No hat"))}">
      ${h ? hatOnlySVG(id, 46) : `<span class="booth-nohat" aria-hidden="true">${esc(t("None"))}</span>`}</button>`;
  }).join("");
  fitHatSVGs($("#boothHats"));
  const sel = $("#boothHats .on");
  if (sel && sel.scrollIntoView) $("#boothHats").scrollLeft = Math.max(0, sel.offsetLeft - 80);
  const chips = (list, key) => list.map(x => `<button type="button" class="chip ${booth[key] === x.id ? "on" : ""}" data-booth-${key}="${x.id}" aria-pressed="${booth[key] === x.id}">${esc(t(x.name))}</button>`).join("");
  $("#boothPoses").innerHTML = chips(BOOTH_POSES, "pose");
  $("#boothFrames").innerHTML = chips(BOOTH_FRAMES, "frame");
  const cap = $("#boothCaption");
  if (cap.value !== booth.caption) cap.value = booth.caption;
  cap.placeholder = t("Benji's new look");
  $("#boothShare").classList.toggle("hidden", !(navigator.share && navigator.canShare));
  drawBooth();
}

/* Benji as a picture: CSS colors swapped for real ones so the canvas can draw him */
function boothBenjiImage(size) {
  const p = BOOTH_POSES.find(x => x.id === booth.pose) || BOOTH_POSES[0];
  let svg = palSVG(p.mood, size, { pose: p.pose, sprout: 1, hat: booth.hat === "none" ? undefined : booth.hat, outfit: booth.hat === "none" ? false : undefined });
  const cs = getComputedStyle(document.documentElement);
  svg = svg.replace(/var\(--([\w-]+)\)/g, (m, n) => cs.getPropertyValue("--" + n).trim() || "#3B2F2A")
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

function boothRound(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function boothStar(c, x, y, r, fill) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * .45 : r; c.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
  c.closePath(); c.fillStyle = fill; c.fill();
}
/* Fit a caption on one or two lines */
function boothCaption(c, text, x, y, maxW, size, font) {
  let s = size;
  c.font = `700 ${s}px ${font}`;
  while (c.measureText(text).width > maxW * 1.9 && s > 34) { s -= 4; c.font = `700 ${s}px ${font}`; }
  const words = text.split(/\s+/), lines = [""];
  words.forEach(w => { const tryL = (lines[lines.length - 1] + " " + w).trim(); if (c.measureText(tryL).width > maxW && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryL; });
  const lh = s * 1.15, top = y - (lines.length - 1) * lh / 2;
  lines.slice(0, 2).forEach((l, i) => { if (c.lineWidth > 1) c.strokeText(l, x, top + i * lh); c.fillText(l, x, top + i * lh); });
}

async function drawBooth() {
  const cv = $("#boothCanvas"); if (!cv) return;
  const n = ++boothDrawN;
  if (document.fonts && document.fonts.ready) try { await document.fonts.ready; } catch (e) {}
  const img = await boothBenjiImage(560);
  if (n !== boothDrawN) return;   // a newer draw started
  const c = cv.getContext("2d"), W = BOOTH_W, H = BOOTH_H;
  const cs = getComputedStyle(document.documentElement);
  const hand = cs.getPropertyValue("--hand").trim() || "cursive";
  const caption = (booth.caption || "").trim() || t("Benji's new look");
  c.save(); c.clearRect(0, 0, W, H); c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 1;
  const bx = (W - 560) / 2;
  if (booth.frame === "snap") {
    c.fillStyle = "#FFFDF6"; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 60, 0, 860); g.addColorStop(0, "#BFE3F4"); g.addColorStop(1, "#EAF6FB");
    c.fillStyle = g; c.fillRect(60, 60, W - 120, 800);
    c.fillStyle = "#FFFFFF"; [[200, 180, 60], [250, 170, 50], [640, 230, 54], [690, 220, 44]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
    c.fillStyle = "#C98B4F"; c.fillRect(60, 760, W - 120, 26); c.fillStyle = "#E9D3B2"; c.fillRect(60, 786, W - 120, 74);
    if (img) c.drawImage(img, bx, 790 - 750 + 20, 560, 750);
    c.fillStyle = "#233A31"; boothCaption(c, caption, W / 2, 985, W - 160, 72, hand);
  } else if (booth.frame === "kitchen") {
    for (let y = 0; y < H; y += 40) for (let x = 0; x < W; x += 40) { c.fillStyle = ((x + y) / 40) % 2 ? "#FFFDF6" : "#E5574A"; c.fillRect(x, y, 40, 40); }
    c.fillStyle = "#F6EBD9"; boothRound(c, 50, 50, W - 100, H - 100, 26); c.fill();
    c.save(); boothRound(c, 50, 50, W - 100, H - 100, 26); c.clip();
    c.strokeStyle = "#E8D9C0"; c.lineWidth = 3;
    for (let y = 110; y < 780; y += 70) { c.beginPath(); c.moveTo(50, y); c.lineTo(W - 50, y); c.stroke(); }
    for (let x = 120; x < W - 50; x += 70) { c.beginPath(); c.moveTo(x, 50); c.lineTo(x, 780); c.stroke(); }
    c.fillStyle = "#C98B4F"; c.fillRect(50, 760, W - 100, 28); c.fillStyle = "#E3C9A2"; c.fillRect(50, 788, W - 100, H);
    c.restore(); c.lineWidth = 1;
    if (img) c.drawImage(img, bx, 40, 560, 750);
    c.fillStyle = "#6B4426"; boothRound(c, 110, 860, W - 220, 190, 22); c.fill();
    c.fillStyle = "#2F4A3A"; boothRound(c, 126, 876, W - 252, 158, 14); c.fill();
    c.fillStyle = "#FFFDF6"; boothCaption(c, caption, W / 2, 955, W - 300, 66, hand);
  } else {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2B2A5C"); g.addColorStop(1, "#6B4BA8");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 40; i++) { c.fillStyle = "rgba(255,255,255," + (.3 + rnd() * .6).toFixed(2) + ")"; c.beginPath(); c.arc(rnd() * W, rnd() * H, 2 + rnd() * 4, 0, 7); c.fill(); }
    [[120, 140, 34], [780, 200, 26], [150, 640, 22], [770, 600, 38], [450, 90, 20]].forEach(([x, y, r]) => boothStar(c, x, y, r, "#FFD55E"));
    const sp = c.createRadialGradient(W / 2, 760, 20, W / 2, 760, 330); sp.addColorStop(0, "rgba(255,240,180,.55)"); sp.addColorStop(1, "rgba(255,240,180,0)");
    c.fillStyle = sp; c.fillRect(0, 300, W, 700);
    c.fillStyle = "rgba(255,240,180,.35)"; c.beginPath(); c.ellipse(W / 2, 800, 240, 40, 0, 0, 7); c.fill();
    if (img) c.drawImage(img, bx, 60, 560, 750);
    c.fillStyle = "#FFFFFF"; c.strokeStyle = "#2B2A5C"; c.lineWidth = 12; c.lineJoin = "round";
    boothCaption(c, caption, W / 2, 960, W - 160, 76, hand);
    c.lineWidth = 1;
  }
  c.font = `800 26px ${cs.getPropertyValue("--body").trim() || "sans-serif"}`;
  c.textAlign = "right"; c.fillStyle = booth.frame === "stars" ? "rgba(255,255,255,.75)" : "rgba(35,58,49,.6)";
  if (booth.frame === "kitchen") c.fillStyle = "rgba(255,253,246,.7)";
  c.fillText("Benji's Kitchen", W - (booth.frame === "kitchen" ? 140 : 80), H - (booth.frame === "kitchen" ? 100 : 60));
  c.restore();
  cv.setAttribute("aria-label", t("Benji's photo: {caption}", { caption }));
}

function boothBlob() {
  return new Promise(res => $("#boothCanvas").toBlob(b => res(b), "image/png"));
}
/* iPhones and iPads can't download files from a home screen app, so Save opens the share sheet (it has Save Image) */
const boothIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
async function boothSave() {
  await drawBooth();
  const b = await boothBlob(); if (!b) { toast(t("This phone couldn't make the picture.")); return; }
  if (boothIOS()) {
    const f = new File([b], "benji-photo.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      toast(t("Tap Save Image to keep it in your photos."));
      try { await navigator.share({ files: [f] }); } catch (e) {}
      return;
    }
    // No share sheet: show the picture on its own page, where press and hold saves it
    const url = URL.createObjectURL(b);
    const w = window.open(url, "_blank");
    if (w) { toast(t("Press and hold the picture, then tap Save to Photos.")); setTimeout(() => URL.revokeObjectURL(url), 60000); return; }
    URL.revokeObjectURL(url);
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "benji-photo.png";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  sfx("pop"); buzz(8);
  toast(t("Saved! Look for benji-photo.png in your downloads."));
}
async function boothShare() {
  await drawBooth();
  const b = await boothBlob(); if (!b) return;
  const f = new File([b], "benji-photo.png", { type: "image/png" });
  if (!(navigator.canShare && navigator.canShare({ files: [f] }))) { boothSave(); return; }
  try { await navigator.share({ files: [f], title: t("Benji's photo") }); } catch (e) {}
}

function boothInit() {
  const page = $("#boothPage"); if (!page) return;
  page.addEventListener("click", e => {
    const h = e.target.closest("[data-booth-hat]"), p = e.target.closest("[data-booth-pose]"), f = e.target.closest("[data-booth-frame]");
    if (h) { booth.hat = h.dataset.boothHat; if (booth.hat !== "none") { noteHatWorn(booth.hat); saveSettings(); if (typeof checkNewBadges === "function") checkNewBadges(); } }
    if (p) booth.pose = p.dataset.boothPose;
    if (f) booth.frame = f.dataset.boothFrame;
    if (h || p || f) { sfx("pop"); buzz(6); renderBooth(); }
    if (e.target.closest("#boothSave")) boothSave();
    if (e.target.closest("#boothShare")) boothShare();
  });
  $("#boothCaption").addEventListener("input", e => { booth.caption = e.target.value.slice(0, 40); drawBooth(); });
  const pb = $("#plyBoothBtn"); if (pb) pb.addEventListener("click", () => { $("#playPage").close(); openBooth(); });
}
