"use strict";
/* Kitchen music: real songs from the audio folder. Music starts when you tap Start on the start screen
   (phones only allow sound after a tap), and the music button in the header turns it on and off.
   What plays: the radio station you picked, or your kitchen theme's song, or the Pantry Pal song.
   Samples in Benji's shop play 10 seconds from partway into a song, past the intro. */

const RADIO_STATIONS = [
  { id: "lofi", name: "Lo-fi kitchen", short: "Lo-fi", desc: "Chill lo-fi beats", src: "audio/lofi.mp3" },
  { id: "simmer", name: "Simmering pot", short: "Simmering", desc: "Warm dinner jazz", src: "audio/simmer.mp3" },
  { id: "rain", name: "Rain on the window", short: "Rain", desc: "Rainy day piano", src: "audio/rain.mp3" },
  // From the radio pack in Benji's shop
  { id: "coffee", name: "Coffee shop", short: "Coffee", desc: "All I Move Is Caffeine", src: "audio/coffee.mp3", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4"/></svg>' },
  { id: "campfire", name: "Campfire", short: "Campfire", desc: "Acoustic guitar by the fire", src: "audio/campfire.mp3", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 1 2 2 3 0-3 0-5 1-7z"/><path d="M4 21l16-3M4 18l16 3"/></svg>' },
  { id: "ocean", name: "Ocean waves", short: "Ocean", desc: "Island ukulele", src: "audio/ocean.mp3", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/><path d="M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/></svg>' },
  { id: "holiday", name: "Holiday tunes", short: "Holiday", desc: "Cozy holiday tunes", src: "audio/holiday.mp3", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/><path d="M12 3v2"/></svg>' }
];
const stationOpen = s => !s.shop || (typeof ownsItem === "function" && ownsItem(s.shop));
/* Each kitchen theme has its own song, and the classic kitchen plays the Pantry Pal song */
const MUSIC_MAIN = { id: "main", name: "Pantry Pal", short: "Pantry Pal", src: "audio/main.mp3" };
const THEME_SONGS = {
  diner: { id: "theme:diner", name: "Bubblegum Love", short: "Diner", src: "audio/diner.mp3" },
  cabin: { id: "theme:cabin", name: "Log cabin song", short: "Cabin", src: "audio/cabin.mp3" },
  beach: { id: "theme:beach", name: "Beach shack song", short: "Beach", src: "audio/beach.mp3" },
  space: { id: "theme:space", name: "Space station song", short: "Space", src: "audio/space.mp3" }
};
/* Where a sample starts, as a share of the song, so it skips the intro */
const SAMPLE_AT = 0.4;

const Radio = (() => {
  let el = null, station = null, previewing = null, previewTimer = null, fadeTimer = null, wasPlaying = false;
  const vol = () => (settings.radioVol == null ? 50 : settings.radioVol) / 100;
  const musicOn = () => settings.music !== false;
  function track(id) {
    if (!id) return null;
    if (id === "main") return MUSIC_MAIN;
    if (id.startsWith("theme:")) return THEME_SONGS[id.slice(6)] || null;
    return RADIO_STATIONS.find(s => s.id === id) || null;
  }
  function audio() {
    if (!el) {
      try { el = new Audio(); } catch (e) { return null; }
      el.preload = "none"; el.loop = true;
    }
    return el;
  }
  function fadeTo(target, ms, then) {
    clearInterval(fadeTimer);
    const a = el; if (!a) return;
    const start = a.volume, steps = Math.max(1, Math.round(ms / 50)); let i = 0;
    fadeTimer = setInterval(() => {
      i++; try { a.volume = Math.max(0, Math.min(1, start + (target - start) * i / steps)); } catch (e) {}
      if (i >= steps) { clearInterval(fadeTimer); if (then) then(); }
    }, 50);
  }
  function startTrack(t, at) {
    const a = audio(); if (!a || !t) return false;
    const url = new URL(t.src, location.href).href;
    if (a.src !== url) { a.src = t.src; }
    try { a.volume = 0; } catch (e) {}
    const seek = () => { if (at && isFinite(a.duration) && a.duration > 20) { try { a.currentTime = a.duration * at; } catch (e) {} } };
    if (at) { if (a.readyState >= 1) seek(); else a.addEventListener("loadedmetadata", seek, { once: true }); }
    else if (a.src === url && station === t.id) { /* keep its place */ }
    const p = a.play();
    if (p && p.catch) p.catch(() => { station = null; previewing = null; render(); });
    fadeTo(vol(), at ? 400 : 1200);
    return true;
  }
  /* The song to play when no station is picked: the theme's song, or the Pantry Pal song */
  function defaultId() {
    const th = settings.kitchenTheme || "";
    const open = typeof KITCHEN_THEMES !== "undefined" && typeof themeOpen === "function" && KITCHEN_THEMES.some(x => x.id === th && themeOpen(x));
    return th && open && THEME_SONGS[th] ? THEME_SONGS[th].id : "main";
  }
  function currentPick() {
    const st = RADIO_STATIONS.find(s => s.id === settings.radioStation);
    return st && stationOpen(st) ? st.id : defaultId();
  }
  /* Pick a station on the radio */
  function play(id) {
    const st = RADIO_STATIONS.find(s => s.id === id);
    if (!st || !stationOpen(st)) return;
    clearTimeout(previewTimer); previewing = null;
    settings.radioStation = id; settings.music = true; saveSettings();
    station = id; startTrack(st);
    render();
  }
  /* Start the music (the start screen and the music button call this, right inside a tap) */
  function autoStart() {
    if (!musicOn() || (station && !previewing)) return;
    const id = currentPick();
    station = id; startTrack(track(id));
    render();
  }
  /* A 10 second sample of any song, even one still in the shop, from partway in */
  function preview(id, ms = 10000) {
    const t = track(id); if (!t || !audio()) return false;
    clearTimeout(previewTimer);
    wasPlaying = wasPlaying || (!!station && !previewing);
    station = id; previewing = id;
    startTrack(t, SAMPLE_AT);
    render();
    previewTimer = setTimeout(() => { if (previewing === id) endPreview(); }, ms);
    return true;
  }
  function endPreview() {
    if (!previewing) return;
    clearTimeout(previewTimer);
    const resume = wasPlaying; wasPlaying = false; previewing = null;
    if (resume && musicOn()) { station = null; fadeTo(0, 300, () => { const id = currentPick(); station = id; startTrack(track(id)); render(); }); }
    else stop(true);
  }
  function stop(quiet) {
    clearTimeout(previewTimer);
    previewing = null; station = null;
    if (el) fadeTo(0, 400, () => { if (!station) try { el.pause(); } catch (e) {} });
    render();
  }
  /* The music button in the header */
  function toggle() {
    if (station && !previewing) { settings.music = false; saveSettings(); stop(); }
    else { settings.music = true; saveSettings(); clearTimeout(previewTimer); previewing = null; wasPlaying = false; station = null; autoStart(); }
  }
  /* A new kitchen theme brings its own song, unless a station is picked */
  function themeChanged() {
    if (!station || previewing) return;
    const st = RADIO_STATIONS.find(s => s.id === settings.radioStation);
    if (st && stationOpen(st)) return;
    const id = defaultId(); if (id === station) return;
    station = id; startTrack(track(id)); render();
  }
  function setVolume(v) {
    settings.radioVol = v; saveSettings();
    if (el && station) { clearInterval(fadeTimer); try { el.volume = vol(); } catch (e) {} }
  }
  function render() {
    const box = document.getElementById("radioStations");
    if (box) box.innerHTML = RADIO_STATIONS.map(s => {
      const open = stationOpen(s), on = station === s.id && !previewing;
      return `<button type="button" class="station ${on ? "on" : ""} ${open ? "" : "locked"}" ${open ? `aria-pressed="${on}"` : `aria-disabled="true"`} data-station="${s.id}">
      <strong>${open ? "" : `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/lock.svg#i"/></svg> `}${esc(t(s.name))}</strong><span>${esc(!open ? t("In Benji's shop") : on ? t("Playing. Tap for your kitchen song.") : t(s.desc))}</span></button>`;
    }).join("");
    // The sample buttons in Benji's shop show which song is playing
    document.querySelectorAll("[data-radio-sample]").forEach(b => {
      const on = previewing === b.dataset.radioSample;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      const l = b.querySelector(".sr-state"); if (l) l.textContent = on ? t("Playing. Tap to stop.") : t("Tap to hear a sample");
    });
    const on = !!station && !previewing;
    const btn = document.getElementById("musicBtn");
    if (btn) {
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", String(on));
      const tr = track(station);
      btn.setAttribute("aria-label", on && tr ? t("Music: {name} is playing. Tap to turn it off.", { name: t(tr.name) }) : t("Music is off. Tap to turn it on."));
    }
    document.body.classList.toggle("radio-on", on);
  }
  function init() {
    $("#radioStations").addEventListener("click", e => {
      const b = e.target.closest("[data-station]"); if (!b) return;
      const st = RADIO_STATIONS.find(s => s.id === b.dataset.station);
      if (!stationOpen(st)) { $("#playPage").close(); openShop(); return; }
      if (station === b.dataset.station && !previewing) {
        // Tapping the playing station goes back to the kitchen's own song
        settings.radioStation = null; saveSettings(); station = null; autoStart();
        if (!musicOn()) stop();
      } else play(b.dataset.station);
    });
    const v = $("#radioVol");
    v.value = settings.radioVol == null ? 50 : settings.radioVol;
    v.addEventListener("input", () => setVolume(Number(v.value)));
    const mb = document.getElementById("musicBtn");
    if (mb) mb.addEventListener("click", toggle);
    document.addEventListener("visibilitychange", () => {
      if (!el) return;
      if (document.hidden) { if (station && !el.paused) { wasHidden = true; el.pause(); } }
      else if (wasHidden) { wasHidden = false; if (station) el.play().catch(() => {}); }
    });
    render();
  }
  let wasHidden = false;
  return { init, play, stop, preview, endPreview, autoStart, toggle, themeChanged, render, playing: () => station, previewing: () => previewing };
})();
