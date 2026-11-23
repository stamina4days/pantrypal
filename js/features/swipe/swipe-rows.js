"use strict";
/* Swipe a food on My Food: left shows "Used it" and "Tossed", right shows "Freeze".
   Tapping a row still opens its page. Works with a finger or a mouse. */
const SWIPE_LEFT = 176, SWIPE_RIGHT = 96;
let swipeOpen = null, swipeJustMoved = false;

function closeSwipe(except) {
  if (swipeOpen && swipeOpen !== except) {
    swipeOpen.classList.remove("open-left", "open-right");
    const f = swipeOpen.querySelector(".row-face"); if (f) f.style.transform = "";
    swipeOpen = null;
  }
}

function swipeAction(kind, id) {
  const it = items.find(i => i.id === id);
  if (!it) return;
  closeSwipe();
  const snap = snapshot();
  if (kind === "freeze") { editingId = id; freezeOrThaw(); return; }
  removeItem(it, kind === "tossed" ? "wasted" : "used");
  buzz(kind === "tossed" ? [6, 30, 6] : 10);
  toast((kind === "tossed" ? t("Logged {name} as tossed.", { name: it.name }) : t("Nice! {name} counts as used.", { name: it.name })) + stapleSuffix(), snap);
  renderAll();
}

function swipeInit() {
  const list = $("#itemList");
  let row = null, face = null, x0 = 0, y0 = 0, dx = 0, mode = null, base = 0;

  list.addEventListener("pointerdown", e => {
    const f = e.target.closest(".row-face");
    if (!f || e.button > 0) return;
    row = f.closest(".swipe-row"); face = f; x0 = e.clientX; y0 = e.clientY; dx = 0; mode = null;
    base = row.classList.contains("open-left") ? -SWIPE_LEFT : row.classList.contains("open-right") ? SWIPE_RIGHT : 0;
    closeSwipe(row);
  });
  list.addEventListener("pointermove", e => {
    if (!row) return;
    const z = typeof ppZoom === "function" ? ppZoom() : 1;
    const mx = (e.clientX - x0) / z, my = (e.clientY - y0) / z;
    if (!mode) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      mode = Math.abs(mx) > Math.abs(my) * 1.2 ? "x" : "y";
      if (mode === "x") { row.classList.add("dragging"); try { face.setPointerCapture(e.pointerId); } catch (err) {} }
    }
    if (mode !== "x") return;
    e.preventDefault();
    dx = Math.max(-SWIPE_LEFT - 30, Math.min(SWIPE_RIGHT + 30, base + mx));
    face.style.transform = `translateX(${dx}px)`;
    row.classList.toggle("show-left", dx > 0);
  });
  const end = () => {
    if (!row) return;
    if (mode === "x") {
      swipeJustMoved = true; setTimeout(() => { swipeJustMoved = false; }, 60);
      row.classList.remove("dragging", "open-left", "open-right");
      if (Math.abs(dx) > 40 && !settings.swipeLearned) { settings.swipeLearned = true; saveSettings(); }
      if (dx < -SWIPE_LEFT / 2) { row.classList.add("open-left"); face.style.transform = `translateX(${-SWIPE_LEFT}px)`; swipeOpen = row; buzz(6); }
      else if (dx > SWIPE_RIGHT / 2) { row.classList.add("open-right"); face.style.transform = `translateX(${SWIPE_RIGHT}px)`; swipeOpen = row; buzz(6); }
      else face.style.transform = "";
    }
    row = null; face = null; mode = null;
  };
  list.addEventListener("pointerup", end);
  list.addEventListener("pointercancel", end);
  // Stop a swipe from also counting as a tap that opens the food.
  list.addEventListener("click", e => {
    const a = e.target.closest("[data-swipe]");
    if (a) { e.stopPropagation(); swipeAction(a.dataset.swipe, a.dataset.id); return; }
    if (swipeJustMoved || (swipeOpen && e.target.closest(".row-face"))) { e.stopPropagation(); if (!swipeJustMoved) closeSwipe(); }
  }, true);
  document.addEventListener("pointerdown", e => { if (swipeOpen && !swipeOpen.contains(e.target)) closeSwipe(); });
}
