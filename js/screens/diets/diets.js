"use strict";
/* Diet and allergies. */
function openDiet() {
  $("#dietOptions").innerHTML = Object.entries(DIETS).map(([id, d]) =>
    `<label class="check"><input type="checkbox" value="${id}" ${settings.diets.includes(id) ? "checked" : ""}> ${esc(t(d.label))}</label>`).join("");
  $("#dietDialog").showModal();
}
