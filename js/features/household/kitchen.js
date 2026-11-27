"use strict";
/* Your kitchen: Benji uses your name, and the header says whose kitchen this is. */
function renderKitchenName() {
  const n = (settings.userName || "").trim();
  const el = document.querySelector(".brand-name");
  if (el) el.textContent = n ? t("{name}'s Kitchen", { name: n }) : "Benji's Kitchen";
  const inp = document.getElementById("userNameInput");
  if (inp && document.activeElement !== inp) inp.value = n;
}
