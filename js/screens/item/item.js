"use strict";
/* Adding and editing food. */
let expTouched = false, locTouched = false, nameTimer = null;
const COMMON_PICKS = ["Milk", "Eggs", "Bread", "Bananas", "Chicken breast", "Spinach", "Apples", "Cheese", "Yogurt", "Rice"];

function openItem(id, prefill) {
  editingId = id || null;
  const it = id ? items.find(i => i.id === id) : null;
  const src = it || prefill || {};
  $("#itemDialogTitle").textContent = it ? t("Edit food") : t("Add food");
  $("#fName").value = src.name || "";
  $("#fAmount").value = hasAmount(src) ? src.amount : "";
  $("#fUnit").value = src.unit || "";
  $("#fLoc").value = locLabel(src.location || settings.lastLoc || "Fridge");
  $("#fBought").value = it ? it.bought || "" : todayStr();
  $("#fExpires").value = src.expires || "";
  $("#fNotes").value = src.notes || "";
  $("#fBarcode").value = src.barcode || "";
  $("#fStaple").checked = it ? !!it.staple : isStaple(src.name || "");
  $("#suggestNote").textContent = "";
  $("#scanNote").textContent = "";
  $("#usageNote").textContent = it ? usageText(it) : "";
  $("#remixBox").innerHTML = it && it.leftover ? remixHtml(it) : "";
  $("#deleteItem").classList.toggle("hidden", !it);
  $("#addAnother").classList.toggle("hidden", !!it);
  $("#addWays").classList.toggle("hidden", !!it);
  $("#itemExtras").classList.toggle("hidden", !it);
  $("#itemMore").open = false;
  expTouched = !!src.expires; locTouched = !!(it || (prefill && prefill.location));
  if (it) {
    const frozen = locIndex(it.location) === 2;
    $("#freezeBtn").innerHTML = frozen ? `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/sun.svg#i"/></svg> ${esc(t("Thaw"))}` : `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/snow.svg#i"/></svg> ${esc(t("Freeze it"))}`;
    $("#itemReminder").classList.toggle("hidden", !(it.expires && daysLeft(it.expires) >= 1));
    $("#useThisBtn").classList.toggle("hidden", !!it.leftover || !canon(it.name));
  }
  fillDatalists();
  renderQuickPicks();
  itemFormChanged();
  if (!$("#itemDialog").open) $("#itemDialog").showModal();
  if (!it && !src.name) setTimeout(() => { try { $("#fName").focus(); } catch (e) {} }, 350);
}

/* Foods you buy a lot (or common ones), minus what's already in your kitchen. */
function renderQuickPicks() {
  const box = $("#quickPicks");
  if (editingId) { box.innerHTML = ""; box.classList.add("hidden"); return; }
  const have = new Set(items.map(i => norm(i.name)));
  const counts = new Map();
  history.slice(-60).forEach(h => { const k = h.name.trim(); counts.set(k, (counts.get(k) || 0) + 1); });
  const fromHistory = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const names = [];
  [...fromHistory, ...COMMON_PICKS.map(n => t(n))].forEach(n => { if (names.length < 4 && !have.has(norm(n)) && !names.some(x => norm(x) === norm(n))) names.push(n); });
  box.classList.toggle("hidden", !names.length);
  box.innerHTML = names.map(n => `<button type="button" class="pick-chip" data-pick="${esc(n)}">${foodArt(n, null, "pick-art")}<span>${esc(n)}</span></button>`).join("");
}

/* Benji's guess for how long it keeps, from the name and the place. */
function palGuess() {
  const name = $("#fName").value.trim();
  if (!name) return null;
  const est = estimateShelf(name, locFromInput($("#fLoc").value));
  return est ? { date: addDaysFrom($("#fBought").value || todayStr(), est.days), note: est.note || "" } : null;
}
function whenLabel(dateStr) {
  const d = daysLeft(dateStr);
  if (d === 0) return t("today");
  if (d === 1) return t("tomorrow");
  if (d > 1 && d <= 6) return weekdayOf(dateStr);
  return prettyDate(dateStr);
}

/* Keep the chips, the place buttons, the picture, and the Save button in step with the form. */
function itemFormChanged() {
  const name = $("#fName").value.trim();
  $("#fNameArt").innerHTML = name ? foodArt(name, null, "name-art-img") : "";
  const loc = locFromInput($("#fLoc").value);
  $$("#locSeg button").forEach(b => { const on = b.dataset.loc === loc; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });

  const guess = palGuess();
  if (!expTouched) $("#fExpires").value = guess ? guess.date : "";
  const cur = $("#fExpires").value;
  const opts = [];
  if (guess) opts.push({ date: guess.date, label: t("Benji's guess: {when}", { when: whenLabel(guess.date) }), pal: true });
  [[3, t("3 days")], [7, t("A week")], [14, t("2 weeks")], [30, t("A month")]].forEach(([n, label]) => {
    const date = addDaysFrom(todayStr(), n);
    if (!guess || date !== guess.date) opts.push({ date, label });
  });
  let matched = false;
  const chip = o => {
    const on = !!cur && o.date === cur && !matched;
    if (on) matched = true;
    return `<button type="button" class="exp-chip ${on ? "on" : ""} ${o.pal ? "pal-guess" : ""}" aria-pressed="${on}" data-exp="${o.date}">${o.pal ? `<img src="img/pal/happy.svg" width="18" height="24" alt="">` : ""}${esc(o.label)}</button>`;
  };
  const html = opts.map(chip).join("");
  const custom = !!cur && !matched;
  $("#expChips").innerHTML = html + `<button type="button" class="exp-chip ${custom ? "on" : ""}" aria-pressed="${custom}" data-exp="pick">${esc(custom ? whenLabel(cur) : t("Pick a date"))}</button>`
    + (cur ? `<button type="button" class="exp-chip quiet" data-exp="none">${esc(t("No date"))}</button>` : "");
  $("#expPickRow").classList.toggle("hidden", !custom);
  $("#suggestNote").textContent = guess && guess.note && cur === guess.date ? guess.note : "";
  $("#saveItemBtn").textContent = editingId ? t("Save") : name ? t("Add {name}", { name: name.length > 18 ? t("it") : name.toLowerCase() }) : t("Add");
}

function itemFormInit() {
  $("#fName").addEventListener("input", () => {
    clearTimeout(nameTimer);
    nameTimer = setTimeout(() => {
      const name = $("#fName").value.trim();
      if (!locTouched && !editingId && name) $("#fLoc").value = locLabel(guessLoc(name));
      itemFormChanged();
    }, 250);
  });
  $("#fLoc").addEventListener("input", () => { locTouched = true; itemFormChanged(); });
  $("#fBought").addEventListener("change", itemFormChanged);
  $("#fExpires").addEventListener("change", () => { expTouched = true; itemFormChanged(); });
  $("#locSeg").addEventListener("click", e => {
    const b = e.target.closest("[data-loc]"); if (!b) return;
    locTouched = true; $("#fLoc").value = locLabel(b.dataset.loc); itemFormChanged();
  });
  $("#expChips").addEventListener("click", e => {
    const b = e.target.closest("[data-exp]"); if (!b) return;
    expTouched = true;
    if (b.dataset.exp === "pick") {
      $("#expPickRow").classList.remove("hidden");
      if (!$("#fExpires").value) $("#fExpires").value = addDaysFrom(todayStr(), 7);
      itemFormChanged();
      const inp = $("#fExpires"); try { inp.showPicker ? inp.showPicker() : inp.focus(); } catch (err) { inp.focus(); }
      return;
    }
    $("#fExpires").value = b.dataset.exp === "none" ? "" : b.dataset.exp;
    itemFormChanged();
  });
  $("#quickPicks").addEventListener("click", e => {
    const b = e.target.closest("[data-pick]"); if (!b) return;
    $("#fName").value = b.dataset.pick;
    if (!locTouched) $("#fLoc").value = locLabel(guessLoc(b.dataset.pick));
    $("#fStaple").checked = isStaple(b.dataset.pick);
    itemFormChanged();
  });
  const step = n => { const v = Math.max(0, (Number($("#fAmount").value) || 0) + n); $("#fAmount").value = v ? String(v) : ""; };
  $("#amtMinus").addEventListener("click", () => step(-1));
  $("#amtPlus").addEventListener("click", () => step(1));
  $("#addAnother").addEventListener("click", () => saveItem(null, true));
  $("#addWayList").addEventListener("click", () => { $("#itemDialog").close(); $("#quickAddBtn").click(); });
  $("#addWayReceipt").addEventListener("click", () => { $("#itemDialog").close(); $("#receiptFile").click(); });
  $("#addWayOrder").addEventListener("click", () => { $("#itemDialog").close(); openOrder(); });
}

function suggestExpiry(quiet) {
  const name = $("#fName").value.trim();
  const note = $("#suggestNote");
  if (!name) { if (!quiet) note.textContent = t("Type a name first."); return; }
  const est = estimateShelf(name, locFromInput($("#fLoc").value));
  if (!est) { if (!quiet) note.textContent = t("No estimate for that one. Check the package date."); return; }
  $("#fExpires").value = addDaysFrom($("#fBought").value, est.days);
  expTouched = true; itemFormChanged();
  note.textContent = t("About {n} days.", { n: est.days }) + (est.note ? " " + est.note : "") + " " + t("This is only an estimate, so trust the package date and your senses.");
}

function saveItem(e, keepOpen) {
  if (e) e.preventDefault();
  const name = $("#fName").value.trim();
  if (!name) { $("#fName").focus(); toast(t("Type what you got first.")); return; }
  const amtRaw = $("#fAmount").value;
  const data = {
    name,
    amount: amtRaw === "" ? null : Math.max(0, Number(amtRaw)),
    unit: $("#fUnit").value.trim(),
    location: locFromInput($("#fLoc").value),
    bought: $("#fBought").value,
    expires: $("#fExpires").value,
    notes: $("#fNotes").value.trim(),
    barcode: $("#fBarcode").value,
    staple: $("#fStaple").checked
  };
  const wasNew = !editingId;
  // A date left on Benji's guess stays marked as a guess; a date you picked or changed doesn't
  const guess = palGuess();
  if (wasNew) data.dateGuess = !!(data.expires && guess && guess.date === data.expires);
  else { const old = items.find(i => i.id === editingId); if (old && old.expires !== data.expires) data.dateGuess = false; }
  if (editingId) Object.assign(items.find(i => i.id === editingId), data);
  else { items.push(Object.assign({ id: uid(), added: todayStr() }, data)); sfx("pop"); buzz(8); toast(palPick("added", { name })); }
  const key = norm(name);
  settings.staples = settings.staples.filter(s => s !== key);
  if (data.staple) settings.staples.push(key);
  if (data.barcode) { barcodes[data.barcode] = { name, unit: data.unit, location: data.location }; saveBarcodes(); }
  settings.lastLoc = data.location;
  saveItems(); saveSettings();
  if (keepOpen) { renderAll(); openItem(null); return; }
  $("#itemDialog").close();
  renderAll();
  if (wasNew && typeof Motion !== "undefined") Motion.unpack([name]);
}

function freezeOrThaw() {
  const it = items.find(i => i.id === editingId);
  if (!it) return;
  const snap = snapshot();
  if (locIndex(it.location) === 2) {
    it.location = "Fridge";
    it.expires = addDaysFrom(todayStr(), 2);
    toast(t("Moved {name} to the fridge. Thawed food keeps about 1 to 2 days, so use it soon.", { name: it.name }), snap);
  } else {
    const est = estimateShelf(it.name, "Freezer");
    const days = est ? est.days : 90;
    it.location = "Freezer";
    bump("frozen");
    it.expires = addDaysFrom(todayStr(), days);
    toast(t("Froze {name}. Good for about {n} more days.", { name: it.name, n: days }), snap);
  }
  saveItems();
  $("#itemDialog").close();
  renderAll();
}
