"use strict";
/* Backups. */
/* ---------- backup ---------- */
function exportBackup() {
  download(`pantry-backup-${todayStr()}.json`, JSON.stringify({
    app: "pantrypal", version: 3, exported: new Date().toISOString(),
    items, history, shopping, barcodes, plan, cookedLog, myRecipes, settings
  }, null, 2), "application/json");
}
function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(incoming)) throw new Error("bad file");
      if (!confirm(t("Replace everything here with this backup ({n} food items)?", { n: incoming.length }))) return;
      items = incoming.filter(i => i && typeof i.name === "string").map(i => Object.assign({ id: uid() }, i));
      if (Array.isArray(data.history)) history = data.history;
      if (Array.isArray(data.shopping)) shopping = data.shopping;
      if (data.barcodes && typeof data.barcodes === "object") barcodes = data.barcodes;
      if (Array.isArray(data.plan)) plan = data.plan;
      if (Array.isArray(data.cookedLog)) cookedLog = data.cookedLog;
      if (Array.isArray(data.myRecipes)) {
        RECIPES.filter(r => r.mine).forEach(r => RECIPES.splice(RECIPES.indexOf(r), 1));
        myRecipes = data.myRecipes.filter(m => m && m.name && Array.isArray(m.ing) && Array.isArray(m.steps));
        myRecipes.forEach(addMineToRecipes);
      }
      if (data.settings) {
        ["favorites", "staples", "diets", "missingBasics"].forEach(k => { if (Array.isArray(data.settings[k])) settings[k] = data.settings[k]; });
        ["household", "ratings", "usage"].forEach(k => { if (data.settings[k] && typeof data.settings[k] === "object") settings[k] = data.settings[k]; });
        settings.onboarded = true;
      }
      saveItems(); saveHistory(); saveShopping(); saveBarcodes(); savePlan(); saveCooked(); saveMine(); saveSettings();
      renderDietSummary(); renderAll();
      alert(t("Backup restored."));
    } catch (e) { alert(t("That file doesn't look like a Pantry Pal backup.")); }
  };
  reader.readAsText(file);
}
