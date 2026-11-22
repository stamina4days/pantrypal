"use strict";
/* Pick a shopping list. */
function openListPicker(entries, title) {
  pickEntries = entries;
  $("#listPickTitle").textContent = title || t("Add to a shopping list");
  $("#shopPick").innerHTML = entries.map((e, i) =>
    `<label class="cooked-row"><input type="checkbox" data-pi="${i}" ${e.checked ? "checked" : ""}>
      ${esc([e.amt, e.name].filter(Boolean).join(" "))}${e.note ? ` <span class="muted small">(${esc(e.note)})</span>` : ""}</label>`).join("")
    || `<p class="muted small">${esc(t("Nothing to add."))}</p>`;
  const sel = $("#shopListPick");
  sel.innerHTML = shopping.map(l => `<option value="${l.id}" ${l.id === settings.activeList ? "selected" : ""}>${esc(l.name)}</option>`).join("")
    + `<option value="__new" ${shopping.length ? "" : "selected"}>${esc(t("New list..."))}</option>`;
  $("#shopNewName").classList.toggle("hidden", sel.value !== "__new");
  $("#listPickDialog").showModal();
}
function confirmPick() {
  const picks = $$("#shopPick input:checked").map(c => pickEntries[Number(c.dataset.pi)]);
  if (!picks.length) { toast(t("Pick at least one item.")); return; }
  let list;
  if ($("#shopListPick").value === "__new") {
    list = { id: uid(), name: $("#shopNewName").value.trim() || t("Shopping list"), items: [] };
    shopping.push(list);
  } else list = shopping.find(l => l.id === $("#shopListPick").value);
  let added = 0;
  picks.forEach(e => {
    const froms = e.from.length ? e.from : [""];
    if (addToList(list, e.name, e.amt, froms[0])) added++;
    froms.slice(1).forEach(fr => addToList(list, e.name, e.amt, fr));
  });
  settings.activeList = list.id;
  saveShopping(); saveSettings();
  $("#listPickDialog").close();
  toast(added ? tn(added, "Added 1 item to {list}.", "Added {n} items to {list}.", { list: list.name }) : t("Those are already on {list}.", { list: list.name }));
  renderAll();
}
function shopFromRecipe() {
  const x = openResult, r = x.recipe, diets = settings.diets, f = curServings / r.serves;
  const haveMap = new Map(x.have.map(h => [h.g, h])), subSet = new Set(x.subbed.map(s => s.g));
  const shortMap = new Map(x.short.map(s => [s.g, s]));
  const entries = r.ingredients.filter(g => !(g.opt && diets.length && dietCheck(g, diets).blocked)).map(g => {
    const isMissing = x.missing.includes(g), sh = shortMap.get(g);
    let amt = amtDisplay(g.amt, f), note = "";
    if (sh) { const fr = sh.need ? (sh.need - sh.got) / sh.need : 1; amt = shortAmount(g.amt, f, fr); note = t("you have some, not enough"); }
    else if (!isMissing) note = haveMap.has(g) ? t("you have it") : subSet.has(g) ? t("substitute available") : g.basic ? t("basic") : t("optional");
    return { name: ingName(g, r), amt, checked: isMissing || !!sh, note, from: [rName(r)] };
  });
  openListPicker(entries);
}

/* Diet dialog */
