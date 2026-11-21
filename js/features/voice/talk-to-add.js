"use strict";
/* Talk to add: "milk, a dozen eggs, and two pounds of chicken" becomes three foods.
   Uses the speech recognition built into the phone's browser (best in Chrome on Android).
   What Pal heard goes into the Quick add box, so you can check it before adding. */
const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
let talkRec = null;

const NUMBER_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, "a couple of": 2, "a couple": 2, couple: 2, "a few": 3, few: 3, half: "1/2", "a half": "1/2" };
const UNIT_WORDS = "pounds?|lbs?|ounces?|oz|bags?|boxes|box|cans?|bottles?|cartons?|jars?|packs?|packages?|bunch(?:es)?|heads?|loaf|loaves|gallons?|dozen|cups?|pieces?|slices?";

/* Turn what someone said into Quick add lines. */
function spokenToLines(text) {
  let s = " " + text.toLowerCase().replace(/[.!?]/g, " ") + " ";
  s = s.replace(/\band also\b|\bplus\b|\bthen\b/g, ",");
  // "half a gallon of milk" -> "1/2 gallon milk"
  s = s.replace(/\bhalf an? (\w+)/g, "1/2 $1");
  s = s.replace(/\ba dozen\b/g, "12").replace(/\b(\d+) dozen\b/g, (m, n) => String(n * 12));
  for (const [w, n] of Object.entries(NUMBER_WORDS).sort((a, b) => b[0].length - a[0].length)) {
    s = s.replace(new RegExp("\\b" + w + "\\b(?=\\s+(?:\\d|" + UNIT_WORDS + "|[a-z]))", "g"), String(n));
  }
  s = s.replace(new RegExp("\\b(" + UNIT_WORDS + ") of\\b", "g"), "$1");
  // Split on commas and on "and" that starts a new item (followed by a number or a/an/some)
  return s.split(/,|\band\b(?=\s+(?:\d|some\b))|\s+and\s+(?=\d)/)
    .map(x => x.replace(/^\s*(?:and|some|i got|i bought|we got|add)\s+/g, "").replace(/^1 (?=[a-z]+\s*$)/, "").trim())
    .filter(x => x && x.length > 1)
    .join("\n");
}

function talkSupported() { return !!SpeechRec; }

function startTalking() {
  if (!SpeechRec) return;
  if (!$("#quickDialog").open) { $("#quickText").value = ""; renderQuickPreview(); $("#quickDialog").showModal(); }
  if (talkRec) { try { talkRec.stop(); } catch (e) {} return; }
  const rec = new SpeechRec();
  rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
  talkRec = rec;
  $("#sayItBtn").classList.add("listening");
  $("#sayItLabel").textContent = t("Listening... tap when you're done");
  $("#sayItHeard").classList.remove("hidden");
  $("#sayItHeard").textContent = t("Go ahead, I'm listening.");
  sfx("pop");
  let finalText = "";
  rec.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
      else interim += e.results[i][0].transcript;
    }
    $("#sayItHeard").textContent = (finalText + interim).trim();
  };
  rec.onerror = e => {
    $("#sayItHeard").textContent = e.error === "not-allowed"
      ? t("I need permission to use the microphone. You can type instead.")
      : t("I didn't catch that. Try again, or type it.");
  };
  rec.onend = () => {
    talkRec = null;
    $("#sayItBtn").classList.remove("listening");
    $("#sayItLabel").textContent = t("Say it instead");
    const lines = spokenToLines(finalText);
    if (lines) {
      const box = $("#quickText");
      box.value = (box.value.trim() ? box.value.trim() + "\n" : "") + lines;
      renderQuickPreview();
      $("#sayItHeard").textContent = t("Here's what I heard. Fix anything that's off, then tap Add.");
      sfx("ding");
    }
  };
  try { rec.start(); } catch (e) { talkRec = null; }
}

function talkInit() {
  if (!talkSupported()) return;
  $("#talkAddBtn").classList.remove("hidden");
  $("#sayItBtn").classList.remove("hidden");
  $("#talkAddBtn").addEventListener("click", startTalking);
  $("#sayItBtn").addEventListener("click", startTalking);
  $("#quickDialog").addEventListener("close", () => { if (talkRec) try { talkRec.abort(); } catch (e) {} });
}
