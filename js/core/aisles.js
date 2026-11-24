"use strict";
/* Which store section a food belongs in. Anything with "frozen" in its name goes to Frozen first; the rest are
   looked up in data/food/aisles.js, trying the food and then its more general names. */
function aisleOf(name) {
  if (/\bfrozen\b|\bcongelad/i.test(name)) return "frozen";
  const keys = chain(canon(name)).map(k => k.trim());
  for (const [id, , list] of AISLES) if (keys.some(k => list.map(x => norm(x).trim()).includes(k))) return id;
  return "other";
}
