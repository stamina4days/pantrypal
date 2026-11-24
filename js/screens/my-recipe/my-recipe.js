"use strict";
/* Adding, editing, and deleting your own recipes, and emailing one in as a suggestion. */
const AMT_RE = /^((?:\d+\s+)?\d+(?:[\/.]\d+)?\s*(?:cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|cloves?|cans?|slices?|pinch(?:es)?|handfuls?|bunch(?:es)?|stalks?|heads?|sticks?|packages?|large|medium|small)?\.?)\s+(.+)$/i;
function toIngString(line) {
  let opt = false;
  line = line.replace(/\s*\(optional\)\s*$/i, () => { opt = true; return ""; }).trim();
  let amt = "", name = line;
  if (line.includes("|")) { [amt, name] = line.split("|").map(s => s.trim()); }
  else { const m = line.match(AMT_RE); if (m) { amt = m[1].trim(); name = m[2].trim(); } }
  return `${amt}|${name}${opt ? "|o" : ""}`;
}
let editingMine = null, formMode = "mine";
function openRecipeForm(mode, recipe) {
  formMode = mode;
  editingMine = recipe || null;
  $("#rfTitle").textContent = mode === "suggest" ? t("Suggest a recipe") : recipe ? t("Edit recipe") : t("Add a recipe");
  $("#rfIntro").textContent = mode === "suggest"
    ? t("This opens your email app with your recipe filled in. Good suggestions get reviewed and may be added for everyone.")
    : t("Your recipes are saved on this device and show up in Saved, For You, and Browse.");
  $("#sType").innerHTML = MEAL_TYPES.map(m => `<option value="${m}">${esc(t(m))}</option>`).join("");
  const r = recipe || {};
  $("#sName").value = r.name || "";
  $("#sType").value = r.type || "Dinner";
  $("#sTime").value = r.time || "";
  $("#sServes").value = r.serves || "";
  $("#sIng").value = r.ing ? r.ing.map(s => { const [a, n, o] = s.split("|"); return [a, n].filter(Boolean).join(" ") + (o ? " (" + t("optional") + ")" : ""); }).join("\n") : "";
  $("#sSteps").value = r.steps ? r.steps.join("\n") : "";
  $("#sBy").value = ""; $("#sNotes").value = "";
  $("#suggestExtra").classList.toggle("hidden", mode !== "suggest");
  $("#saveRecipe").classList.toggle("hidden", mode === "suggest");
  $("#emailRecipe").classList.toggle("hidden", !SUGGEST_EMAIL);
  $("#emailRecipe").classList.toggle("primary", mode === "suggest");
  $("#suggestError").textContent = "";
  $("#recipeFormDialog").showModal();
}
function readRecipeForm() {
  const lines = id => $(id).value.split("\n").map(s => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
  const name = $("#sName").value.trim(), ing = lines("#sIng"), steps = lines("#sSteps");
  if (!name || ing.length < 2 || !steps.length) { $("#suggestError").textContent = t("Please add a name, at least 2 ingredients, and at least 1 step."); return null; }
  $("#suggestError").textContent = "";
  return { name, type: $("#sType").value, time: Number($("#sTime").value) || 30, serves: Number($("#sServes").value) || 4,
    ing: ing.map(toIngString), steps, rawIng: ing };
}
function saveMyRecipe(e) {
  e.preventDefault();
  const d = readRecipeForm(); if (!d) return;
  let name = d.name;
  const clash = RECIPES.find(r => r.name === name && (!editingMine || r.name !== editingMine.name));
  if (clash) name = name + " " + t("(mine)");
  const data = { id: editingMine ? editingMine.id : uid(), name, type: d.type, time: d.time, serves: d.serves, ing: d.ing, steps: d.steps };
  if (editingMine) {
    const old = editingMine.name;
    myRecipes = myRecipes.map(m => m.id === data.id ? data : m);
    const idx = RECIPES.findIndex(r => r.mine && r.id === data.id);
    if (idx >= 0) RECIPES.splice(idx, 1);
    if (old !== name) {
      settings.favorites = settings.favorites.map(f => f === old ? name : f);
      plan.forEach(m => { if (m.recipe === old) m.recipe = name; });
      cookedLog.forEach(c => { if (c.name === old) c.name = name; });
      saveSettings(); savePlan(); saveCooked();
    }
  } else myRecipes.push(data);
  saveMine();
  const r = addMineToRecipes(data);
  $("#recipeFormDialog").close();
  if ($("#recipeDialog").open) $("#recipeDialog").close();
  toast(t("Saved {name} to your recipes.", { name }));
  recipeMode = "saved"; setPressed("#recipeMode", $('#recipeMode [data-mode="saved"]'));
  showTab("recipes");
  return r;
}
async function deleteMine() {
  const r = openResult.recipe;
  if (!r.mine || !await Ask.confirm({ title: t("Delete this recipe?"), text: t("Delete {name} from your recipes?", { name: r.name }), yes: t("Delete"), danger: true })) return;
  const snap = snapshot(), mine0 = myRecipes.slice(), favs0 = settings.favorites.slice();
  myRecipes = myRecipes.filter(m => m.id !== r.id);
  const idx = RECIPES.indexOf(r); if (idx >= 0) RECIPES.splice(idx, 1);
  plan = plan.filter(m => m.recipe !== r.name);
  settings.favorites = settings.favorites.filter(f => f !== r.name);
  saveMine(); savePlan(); saveSettings();
  $("#recipeDialog").close();
  renderAll();
  toast(t("Deleted {name}.", { name: r.name }), () => {
    myRecipes = mine0; if (idx >= 0) RECIPES.splice(idx, 0, r); settings.favorites = favs0;
    saveMine(); saveSettings(); restore(snap);
  });
}
function emailSuggestion() {
  if (!SUGGEST_EMAIL) return;
  const d = readRecipeForm(); if (!d) return;
  const by = $("#sBy").value.trim(), notes = $("#sNotes").value.trim();
  const snippet = JSON.stringify({ id: recipeSlug(d.name), name: d.name, type: d.type, time: d.time, serves: d.serves, ing: d.ing, steps: d.steps }, null, 2);
  const body = [
    "Recipe suggestion for Pantry Pal", "",
    `Name: ${d.name}`, `Meal: ${d.type}`, `Time: about ${d.time} minutes`, `Serves: ${d.serves}`, by ? `Suggested by: ${by}` : "", "",
    "Ingredients:", ...d.rawIng.map(l => "- " + l), "",
    "Steps:", ...d.steps.map((s, i) => `${i + 1}. ${s}`), "",
    notes ? `Notes: ${notes}` : "", "",
    "-----", "To add it: save this as a new file in the right folder inside data/recipes (like data/recipes/breakfast) and list it in data/recipes/index.json as 'breakfast/file-name.json' (after review):", snippet
  ].join("\n");
  $("#recipeFormDialog").close();
  window.location.href = `mailto:${SUGGEST_EMAIL}?subject=${encodeURIComponent("Recipe suggestion: " + d.name)}&body=${encodeURIComponent(body)}`;
  toast(t("Opening your email app..."));
}
