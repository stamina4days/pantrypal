"use strict";
/* Your own notes on a recipe, written on a sticky note, and whose favorite it is.
   Saved in settings.recipeNotes as { "Recipe name": { note, by } }. */
function recipeNoteFor(r) {
  return (settings.recipeNotes || {})[r.name] || null;
}
function renderRecipeNote() {
  const r = openResult && openResult.recipe;
  if (!r) return;
  const n = recipeNoteFor(r) || {};
  $("#recipeNoteText").value = n.note || "";
  $("#recipeFavBy").value = n.by || "";
  $("#recipeNote").classList.toggle("has-note", !!(n.note || n.by));
}
let noteTimer = null;
function saveRecipeNote() {
  const r = openResult && openResult.recipe;
  if (!r) return;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    settings.recipeNotes = settings.recipeNotes || {};
    const note = $("#recipeNoteText").value.trim(), by = $("#recipeFavBy").value.trim();
    if (note || by) settings.recipeNotes[r.name] = { note, by }; else delete settings.recipeNotes[r.name];
    saveSettings();
    $("#recipeNote").classList.toggle("has-note", !!(note || by));
  }, 400);
}
/* A little heart tag on recipe cards, like "Grandma's favorite" */
function familyTagHtml(r) {
  const n = recipeNoteFor(r);
  return n && n.by ? `<span class="tag family-tag">${esc(n.by)}</span>` : "";
}
