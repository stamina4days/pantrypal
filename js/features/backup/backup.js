"use strict";
/* Saving a copy of the kitchen to a file and bringing it back, plus Benji's occasional reminder to do it. */
function exportBackup() {
  settings.lastBackup = todayStr(); settings.backupNudgeAt = null; saveSettings();
  download(`pantry-backup-${todayStr()}.json`, JSON.stringify({
    app: "pantrypal", version: 3, exported: new Date().toISOString(),
    items, history, shopping, barcodes, plan, cookedLog, myRecipes, settings
  }, null, 2), "application/json");
  if (typeof renderPageExtras === "function") renderPageExtras();
}
/* Everything is saved only in this browser, so clearing it wipes the kitchen. Benji reminds people to save a backup file:
   the first time once they've added about 10 foods or used the app for a week, then about once a month.
   "Not now" waits two weeks. It shares a spot with the home screen nudge on My Food, one at a time. */
const daysAgo = d => d ? Math.round((Date.now() - new Date(d + "T12:00:00").getTime()) / 86400000) : 0;
function backupNudgeHtml() {
  if (!settings.firstSeen) { settings.firstSeen = todayStr(); saveSettings(); }
  const real = items.filter(i => !i.sample).length;   // a sample kitchen doesn't need saving
  if (!real) return "";
  if (settings.backupNudgeAt && daysAgo(settings.backupNudgeAt) < 0) return "";
  const due = settings.lastBackup ? daysAgo(settings.lastBackup) >= 30 : (real >= 10 || daysAgo(settings.firstSeen) >= 7);
  if (!oneNudge("backup", due)) return "";
  return palBubble("worried", settings.lastBackup
      ? t("It's been a while since you saved a copy of your kitchen. Save a fresh one so a cleared browser can't wipe it.")
      : t("Your kitchen is saved only on this phone. If your browser data gets cleared, it's gone. Save a copy to be safe."),
    [{ attrs: 'data-bk="save" class="primary"', label: t("Save a copy") }, { attrs: 'data-bk="later"', label: t("Not now") }], "backup-nudge");
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-bk]"); if (!b) return;
  if (b.dataset.bk === "save") { exportBackup(); toast(t("Saved a copy to your downloads. To bring it back, use Settings > Bring back a copy.")); }
  else {
    const d = new Date(); d.setDate(d.getDate() + 14);
    settings.backupNudgeAt = d.toISOString().slice(0, 10); saveSettings();
    if (typeof renderPageExtras === "function") renderPageExtras();
    toast(t("I'll ask again in two weeks. Save a copy is in Settings any time."));
  }
});
function importBackup(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(incoming)) throw new Error("bad file");
      if (!await Ask.confirm({ title: t("Bring back a copy?"), text: t("Replace everything here with this backup ({n} food items)?", { n: incoming.length }), yes: t("Replace"), danger: true })) return;
      const undo = wholeSnapshot();
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
      toast(t("Backup restored."), undo);
    } catch (e) { Ask.notice({ title: t("Hmm, that didn't work"), text: t("That file doesn't look like a Pantry Pal backup."), mood: "worried" }); }
  };
  reader.readAsText(file);
}
