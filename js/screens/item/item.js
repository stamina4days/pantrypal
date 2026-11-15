"use strict";
/* Adding and editing food. */
function openItem(id, prefill) {
  editingId = id || null;
  const it = id ? items.find(i => i.id === id) : null;
  const src = it || prefill || {};
  $("#itemDialogTitle").textContent = it ? t("Edit item") : t("Add item");
  $("#fName").value = src.name || "";
  $("#fAmount").value = hasAmount(src) ? src.amount : "";
  $("#fUnit").value = src.unit || "";
  $("#fLoc").value = locLabel(src.location || settings.lastLoc);
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
  $("#itemExtras").classList.toggle("hidden", !it);
  if (it) {
    const frozen = locIndex(it.location) === 2;
    $("#freezeBtn").innerHTML = frozen ? `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/sun.svg#i"/></svg> ${esc(t("Thaw"))}` : `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/snow.svg#i"/></svg> ${esc(t("Freeze it"))}`;
    $("#itemReminder").classList.toggle("hidden", !(it.expires && daysLeft(it.expires) >= 1));
    $("#useThisBtn").classList.toggle("hidden", !!it.leftover || !canon(it.name));
  }
  fillDatalists();
  if (!$("#itemDialog").open) $("#itemDialog").showModal();
}

function suggestExpiry(quiet) {
  const name = $("#fName").value.trim();
  const note = $("#suggestNote");
  if (!name) { if (!quiet) note.textContent = t("Type a name first."); return; }
  const est = estimateShelf(name, locFromInput($("#fLoc").value));
  if (!est) { if (!quiet) note.textContent = t("No estimate for that one. Check the package date."); return; }
  $("#fExpires").value = addDaysFrom($("#fBought").value, est.days);
  note.textContent = t("About {n} days.", { n: est.days }) + (est.note ? " " + est.note : "") + " " + t("This is only an estimate, so trust the package date and your senses.");
}

function saveItem(e) {
  e.preventDefault();
  const name = $("#fName").value.trim();
  if (!name) return;
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
  if (editingId) Object.assign(items.find(i => i.id === editingId), data);
  else { items.push(Object.assign({ id: uid(), added: todayStr() }, data)); sfx("pop"); buzz(8); toast(palPick("added", { name })); }
  const key = norm(name);
  settings.staples = settings.staples.filter(s => s !== key);
  if (data.staple) settings.staples.push(key);
  if (data.barcode) { barcodes[data.barcode] = { name, unit: data.unit, location: data.location }; saveBarcodes(); }
  settings.lastLoc = data.location;
  saveItems(); saveSettings();
  $("#itemDialog").close();
  renderAll();
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
