"use strict";
/* Which store section a food lives in. */
function aisleOf(name) {
  if (/\bfrozen\b|\bcongelad/i.test(name)) return "frozen";
  const keys = chain(canon(name)).map(k => k.trim());
  for (const [id, , list] of AISLES) if (keys.some(k => list.map(x => norm(x).trim()).includes(k))) return id;
  return "other";
}
