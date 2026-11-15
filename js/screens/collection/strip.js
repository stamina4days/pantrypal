"use strict";
/* The row of collection cards on the Recipes tab. */
function renderCollectionStrip() {
  const box = $("#collectionStrip");
  if (!box) return;
  const list = COLLECTIONS.filter(c => !c.needsFood || items.length);
  box.innerHTML = list.map(c => `<a role="listitem" class="collection-card c-${c.color}" href="#/collection/${c.id}">
      <img class="cc-art" src="img/${c.art}.svg" alt="" width="44" height="44"><span class="cc-name">${esc(t(c.name))}</span></a>`).join("");
}
