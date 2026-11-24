"use strict";
/* Little helper: steps in cook mode that a kid can safely do get a hand mark.
   Finish a recipe that had any, and the kids earn a sticker. */
/* A step counts when it has a kid-friendly action and nothing sharp or hot, so "stir the dressing" does
   but "stir the sauce over low heat" doesn't. */
const HELPER_YES = /\b(wash|rinse|stir|mix|whisk|measure|pour|sprinkle|toss|mash|spread|tear|arrange|layer|scoop|shake|pat dry|line|grease|combine|beat|crack|top with|garnish|squeeze)\b/i;
const HELPER_NO = /\b(knife|chop|slice|dice|cut|mince|grate|fry|saut|boil|simmer|bake|oven|broil|grill|heat|hot|melt|steam|toast|warm|skillet|pan|pot|drain|blender|sear|roast|microwave|stove|oil)\b/i;
function isHelperStep(r, idx) {
  const s = (r.steps || [])[idx] || "";
  return HELPER_YES.test(s) && !HELPER_NO.test(s);
}
function helperHtml(r, idx) {
  if (!isHelperStep(r, idx)) return "";
  return `<div class="helper-mark"><img src="img/badges/little-helper.svg" width="44" height="44" alt=""><span><strong>${esc(t("Little helper step"))}</strong> ${esc(t("Kids can do this one!"))}</span></div>`;
}
function recipeHasHelperStep(r) {
  return (r.steps || []).some((s, i) => isHelperStep(r, i));
}
function helperFinished(r) {
  if (!recipeHasHelperStep(r)) return;
  bump("helper");
  toast(t("Thanks, little helper! You earned a sticker."));
  confetti(); sfx("cheer");
}
