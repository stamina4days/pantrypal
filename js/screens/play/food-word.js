"use strict";
/* Daily food word: guess the day's 5-letter food in 6 tries. Solving it (or not) unlocks a recipe that uses it. */
const WORD_TRIES = 6, WORD_LEN = 5;
let wordInput = "";

function wordDayNumber(dateStr) { const d = parseDay(dateStr); return Math.floor((d - new Date(2026, 0, 1)) / 86400000); }
function todaysWord() {
  const n = wordDayNumber(todayStr());
  return FOOD_WORDS[((n * 7 + 3) % FOOD_WORDS.length + FOOD_WORDS.length) % FOOD_WORDS.length];
}
function wordState() {
  const st = playStats(), today = todayStr();
  if (!st.word || st.word.date !== today) st.word = { date: today, guesses: [], done: false, won: false };
  return st.word;
}
/* Marks for one guess: "y" right spot, "m" in the word, "n" not in it. */
function wordMarks(guess, answer) {
  const marks = Array(WORD_LEN).fill("n"), left = {};
  for (let i = 0; i < WORD_LEN; i++) { if (guess[i] === answer[i]) marks[i] = "y"; else left[answer[i]] = (left[answer[i]] || 0) + 1; }
  for (let i = 0; i < WORD_LEN; i++) if (marks[i] === "n" && left[guess[i]]) { marks[i] = "m"; left[guess[i]]--; }
  return marks;
}
const WORD_MARK_LABEL = { y: "right spot", m: "in the word, wrong spot", n: "not in the word" };

function openWord() {
  wordInput = "";
  renderWord();
  if (!$("#wordPage").open) $("#wordPage").showModal();
}

function renderWord() {
  const s = wordState(), [answer] = todaysWord();
  const rows = [];
  for (let r = 0; r < WORD_TRIES; r++) {
    const g = s.guesses[r], live = !s.done && r === s.guesses.length;
    const marks = g ? wordMarks(g, answer) : null;
    const letters = g || (live ? wordInput.padEnd(WORD_LEN) : "     ");
    rows.push(`<div class="word-row ${live ? "live" : ""}" role="row">${[...letters].map((ch, i) => {
      const m = marks ? marks[i] : "";
      const label = ch.trim() ? (m ? t("{letter}, " + WORD_MARK_LABEL[m], { letter: ch }) : ch) : t("empty");
      return `<span class="word-tile ${m ? "m-" + m : ""} ${ch.trim() ? "filled" : ""}" role="gridcell" aria-label="${esc(label)}">${esc(ch.trim())}</span>`;
    }).join("")}</div>`);
  }
  $("#wordGrid").innerHTML = rows.join("");
  // Keyboard colors: best mark seen for each letter
  const best = {};
  s.guesses.forEach(g => wordMarks(g, answer).forEach((m, i) => { const c = g[i], rank = { y: 3, m: 2, n: 1 }; if (!best[c] || rank[m] > rank[best[c]]) best[c] = m; }));
  const keyRows = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"];
  $("#wordKeys").innerHTML = s.done ? "" : keyRows.map(row => `<div class="key-row">${[...row].map(k =>
    k === "+" ? `<button type="button" class="key wide" data-key="enter">${esc(t("Enter"))}</button>`
    : k === "-" ? `<button type="button" class="key wide" data-key="del" aria-label="${esc(t("Delete"))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/back.svg#i"/></svg></button>`
    : `<button type="button" class="key ${best[k] ? "m-" + best[k] : ""}" data-key="${k}">${k}</button>`).join("")}</div>`).join("");
  $("#wordEnd").innerHTML = s.done ? wordEndHtml(s, answer) : "";
}

function wordRecipe() {
  const [, key] = todaysWord();
  const k = norm(key).trim();
  return RECIPES.find(r => norm(rName(r)).includes(" " + k)) || RECIPES.find(r => r.search.includes(k)) || null;
}

function wordEndHtml(s, answer) {
  const st = playStats(), r = wordRecipe();
  const nice = answer.charAt(0) + answer.slice(1).toLowerCase();
  return `<div class="word-end">
    ${palBubble(s.won ? "proud" : "wink", s.won ? tn(s.guesses.length, "Wow, first try! It was {word}.", "You got it in {n}! It was {word}.", { word: nice })
      : t("So close! Today's word was {word}. A new one comes tomorrow.", { word: nice }), [])}
    ${s.won && st.wordStreak > 1 ? `<p class="word-streak">${esc(tn(st.wordStreak, "1 day in a row", "{n} days in a row"))}</p>` : ""}
    ${r ? `<a class="recipe-mini word-recipe" href="#/recipe/${esc(recipeId(r))}">${recipeArt(r, "r-emoji")}
      <span class="grow"><strong>${esc(rName(r))}</strong><span class="muted small">${esc(t("Cook with today's word, {n} min", { n: r.time }))}</span></span>
      <span class="go"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/next.svg#i"/></svg></span></a>` : ""}
    <button type="button" class="wide" data-word-share><svg class="ic" aria-hidden="true"><use href="img/icons/ui/share.svg#i"/></svg> ${esc(t("Share my result"))}</button>
  </div>`;
}

function wordKey(k) {
  const s = wordState(); if (s.done) return;
  const [answer] = todaysWord();
  $("#wordMsg").textContent = "";
  if (k === "del") { wordInput = wordInput.slice(0, -1); }
  else if (k === "enter") {
    if (wordInput.length < WORD_LEN) { $("#wordMsg").textContent = t("Type all 5 letters first."); sfx("tick"); return; }
    s.guesses.push(wordInput); wordInput = "";
    const won = s.guesses[s.guesses.length - 1] === answer;
    if (won || s.guesses.length >= WORD_TRIES) {
      s.done = true; s.won = won;
      const st = playStats();
      if (won) {
        st.wordStreak = st.wordLast === addDaysFrom(todayStr(), -1) ? (st.wordStreak || 0) + 1 : 1;
        st.wordLast = todayStr(); st.wordWins = (st.wordWins || 0) + 1;
        sfx("cheer"); buzz([10, 40, 10]);
        if (typeof confetti === "function") try { confetti(); } catch (e) {}
      } else { st.wordStreak = 0; sfx("ding"); }
      renderPlay();
    } else sfx("pop");
    saveSettings();
  } else if (/^[A-Z]$/.test(k) && wordInput.length < WORD_LEN) { wordInput += k; sfx("tick"); }
  renderWord();
}

async function shareWord() {
  const s = wordState(), [answer] = todaysWord();
  const grid = s.guesses.map(g => wordMarks(g, answer).map(m => (m === "y" ? "\u{1F7E9}" : m === "m" ? "\u{1F7E8}" : "⬜")).join("")).join("\n");
  const text = t("Pantry Pal food word {n}: {score}", { n: wordDayNumber(todayStr()), score: s.won ? s.guesses.length + "/6" : "X/6" }) + "\n" + grid;
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text); toast(t("Copied. Paste it into a text."));
  } catch (e) { if (!e || e.name !== "AbortError") Ask.copy({ title: t("Copy your result:"), value: text }); }
}

function wordInit() {
  $("#wordKeys").addEventListener("click", e => { const b = e.target.closest("[data-key]"); if (b) wordKey(b.dataset.key); });
  $("#wordEnd").addEventListener("click", e => { if (e.target.closest("[data-word-share]")) shareWord(); });
  document.addEventListener("keydown", e => {
    if (!$("#wordPage").open || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter") { if (e.target.closest && e.target.closest("button, a")) return; e.preventDefault(); wordKey("enter"); }
    else if (e.key === "Backspace") { e.preventDefault(); wordKey("del"); }
    else if (/^[a-z]$/i.test(e.key)) wordKey(e.key.toUpperCase());
  });
}
