"use strict";
/* Pal-styled sheets that slide up from the bottom, in place of the browser's gray
   OK/Cancel boxes. Each one returns a promise:
     await Ask.confirm({ title, text, yes, no, danger })      -> true or false
     await Ask.prompt({ title, label, value, chips, yes, no, extra }) -> the text, "" , null (cancel), or Ask.EXTRA
     await Ask.notice({ title, text, ok })                       -> after it's closed
     await Ask.copy({ title, text, value })                      -> after it's closed (offers a Copy button)
   The sheet isn't a page, so it never changes the address or the back button. */
const Ask = (() => {
  const EXTRA = { extra: true };
  let d = null, done = null;

  function el() {
    if (d) return d;
    d = document.createElement("dialog");
    d.className = "ask-sheet";
    d.setAttribute("aria-labelledby", "askTitle");
    d.addEventListener("cancel", e => { e.preventDefault(); finish(null); });
    d.addEventListener("click", e => { if (e.target === d) finish(null); });   // tap the dimmed area
    document.body.appendChild(d);
    return d;
  }
  function finish(v) {
    if (!d || !d.open) return;
    const cb = done; done = null;
    d.classList.add("closing");
    setTimeout(() => { d.classList.remove("closing"); if (d.open) d.close(); if (cb) cb(v); }, 180);
  }
  function show(html, onReady) {
    const box = el();
    if (box.open) { const cb = done; done = null; box.close(); if (cb) cb(null); }
    box.innerHTML = `<div class="ask-body"><div class="ask-grip" aria-hidden="true"></div>${html}</div>`;
    return new Promise(res => {
      done = res;
      box.showModal();
      if (typeof sfx === "function") try { sfx("pop"); } catch (e) {}
      if (onReady) onReady(box);
    });
  }
  const head = (title, mood) => `<div class="ask-head">${typeof palSVG === "function" ? palSVG(mood || "wink", 38) : ""}<h2 id="askTitle">${esc(title)}</h2></div>`;

  function confirm(o) {
    return show(`${head(o.title, o.danger ? "worried" : "wink")}${o.text ? `<p class="ask-text">${esc(o.text)}</p>` : ""}
      <div class="ask-actions"><button type="button" class="ask-no">${esc(o.no || t("Cancel"))}</button>
      <button type="button" class="ask-yes ${o.danger ? "danger-fill" : "primary"}">${esc(o.yes || t("OK"))}</button></div>`, box => {
      box.querySelector(".ask-no").onclick = () => finish(false);
      box.querySelector(".ask-yes").onclick = () => finish(true);
      box.querySelector(".ask-yes").focus();
    }).then(v => v === true);
  }

  function prompt(o) {
    const chips = (o.chips || []).map(c => `<button type="button" class="ask-chip">${esc(c)}</button>`).join("");
    return show(`${head(o.title)}<form class="ask-form" novalidate>
      <label class="ask-label"><span>${esc(o.label || "")}</span><input class="ask-input" value="${esc(o.value || "")}" autocomplete="off" maxlength="80"></label>
      ${chips ? `<div class="ask-chips">${chips}</div>` : ""}
      ${o.extra ? `<button type="button" class="ask-extra">${esc(o.extra)}</button>` : ""}
      <div class="ask-actions"><button type="button" class="ask-no">${esc(o.no || t("Cancel"))}</button>
      <button type="submit" class="ask-yes primary">${esc(o.yes || t("OK"))}</button></div></form>`, box => {
      const inp = box.querySelector(".ask-input");
      box.querySelector(".ask-form").onsubmit = e => { e.preventDefault(); finish(inp.value.trim()); };
      box.querySelector(".ask-no").onclick = () => finish(null);
      box.querySelectorAll(".ask-chip").forEach(b => b.onclick = () => { inp.value = b.textContent; inp.focus(); });
      const x = box.querySelector(".ask-extra"); if (x) x.onclick = () => finish(EXTRA);
      setTimeout(() => { inp.focus(); inp.select(); }, 60);
    });
  }

  function notice(o) {
    return show(`${head(o.title, o.mood || "happy")}${o.text ? `<p class="ask-text">${esc(o.text)}</p>` : ""}
      <div class="ask-actions"><button type="button" class="ask-yes primary">${esc(o.ok || t("Got it"))}</button></div>`, box => {
      box.querySelector(".ask-yes").onclick = () => finish(true);
    });
  }

  function copy(o) {
    return show(`${head(o.title)}${o.text ? `<p class="ask-text">${esc(o.text)}</p>` : ""}
      <textarea class="ask-copy" readonly rows="4">${esc(o.value)}</textarea>
      <div class="ask-actions"><button type="button" class="ask-no">${esc(t("Close"))}</button>
      <button type="button" class="ask-yes primary">${esc(t("Copy"))}</button></div>`, box => {
      const ta = box.querySelector(".ask-copy");
      box.querySelector(".ask-no").onclick = () => finish(true);
      box.querySelector(".ask-yes").onclick = async () => {
        ta.select();
        try { await navigator.clipboard.writeText(o.value); } catch (e) { try { document.execCommand("copy"); } catch (e2) {} }
        box.querySelector(".ask-yes").textContent = t("Copied!");
        setTimeout(() => finish(true), 700);
      };
    });
  }

  return { confirm, prompt, notice, copy, EXTRA };
})();
