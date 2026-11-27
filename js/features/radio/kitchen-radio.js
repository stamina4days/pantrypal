"use strict";
/* Kitchen music: real songs from the audio folder. Music starts when you tap Start on the start screen
   (phones only allow sound after a tap). The music button in the header opens the music menu: what's playing,
   the volume, and every song, with the locked ones and how to get them.
   What plays: the song you picked, or your kitchen theme's song, or the Pantry Pal song.
   Samples play 10 seconds from partway into a song, past the intro. */

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
/* Each kitchen theme has its own song, and the classic kitchen plays the Pantry Pal song */
const MUSIC_MAIN = { id: "main", name: "Pantry Pal song", short: "Pantry Pal", desc: "The classic kitchen's song", src: "audio/main.mp3" };
const THEME_SONGS = {
  diner: { id: "theme:diner", name: "Bubblegum Love", short: "Diner", desc: "The diner's song", src: "audio/diner.mp3", shop: "themes" },
  cabin: { id: "theme:cabin", name: "Log cabin song", short: "Cabin", desc: "The log cabin's song", src: "audio/cabin.mp3", shop: "themes" },
  beach: { id: "theme:beach", name: "Beach shack song", short: "Beach", desc: "The beach shack's song", src: "audio/beach.mp3", shop: "themes" },
  space: { id: "theme:space", name: "Space station song", short: "Space", desc: "The space station's song", src: "audio/space.mp3", shop: "themes" }
};
/* The music menu's sections. A locked section says which shop item unlocks it. */
const MUSIC_GROUPS = [
  { id: "free", name: "Free songs", tracks: () => [MUSIC_MAIN, ...RADIO_STATIONS.filter(s => !s.shop)] },
  { id: "themes", name: "Kitchen theme songs", shop: "themes", tracks: () => Object.values(THEME_SONGS) },
  { id: "radio", name: "Kitchen radio pack", shop: "radio", tracks: () => RADIO_STATIONS.filter(s => s.shop) }
];
const trackOpen = tr => !!tr && (!tr.shop || (typeof ownsItem === "function" && ownsItem(tr.shop)));
/* Where a sample starts, as a share of the song, so it skips the intro */
const SAMPLE_AT = 0.4;

const Radio = (() => {
  let el = null, station = null, previewing = null, previewTimer = null, fadeTimer = null, wasPlaying = false, wasHidden = false;
  const vol = () => (settings.radioVol == null ? 50 : settings.radioVol) / 100;
  const musicOn = () => settings.music !== false;
  /* The first time, the start screen asks "Play music while you cook?" Music only starts on its own after a yes */
  const asked = () => settings.musicAsked === true;
  function answer(yes) {
    settings.musicAsked = true; settings.music = !!yes; saveSettings();
    if (yes) autoStart(); else stop();
  }
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
    const p = a.play();
    if (p && p.catch) p.catch(() => { station = null; previewing = null; render(); });
    fadeTo(vol(), at ? 400 : 1200);
    return true;
  }
  /* The song to play when none is picked: the theme's song, or the Pantry Pal song */
  function defaultId() {
    const th = settings.kitchenTheme || "";
    const open = typeof KITCHEN_THEMES !== "undefined" && typeof themeOpen === "function" && KITCHEN_THEMES.some(x => x.id === th && themeOpen(x));
    return th && open && THEME_SONGS[th] ? THEME_SONGS[th].id : "main";
  }
  const picked = () => { const tr = track(settings.radioStation); return trackOpen(tr) ? tr.id : null; };
  const currentPick = () => picked() || defaultId();
  /* Play a song you own, and keep it as your pick */
  function play(id) {
    const tr = track(id);
    if (!trackOpen(tr)) return;
    clearTimeout(previewTimer); previewing = null; wasPlaying = false;
    settings.radioStation = id; settings.music = true; settings.musicAsked = true; saveSettings();
    station = id; startTrack(tr);
    render();
  }
  /* Go back to your kitchen's own song */
  function useKitchenSong() {
    settings.radioStation = null; settings.music = true; settings.musicAsked = true; saveSettings();
    clearTimeout(previewTimer); previewing = null; wasPlaying = false;
    const id = defaultId(); station = id; startTrack(track(id)); render();
  }
  /* Start the music (the start screen calls this, right inside a tap) */
  function autoStart() {
    if (!asked() || !musicOn() || (station && !previewing)) return;
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
    else stop();
  }
  function stop() {
    clearTimeout(previewTimer);
    previewing = null; station = null;
    if (el) fadeTo(0, 400, () => { if (!station) try { el.pause(); } catch (e) {} });
    render();
  }
  /* Music on or off */
  function toggle() {
    if (station && !previewing) { settings.music = false; saveSettings(); stop(); }
    else { settings.music = true; settings.musicAsked = true; saveSettings(); clearTimeout(previewTimer); previewing = null; wasPlaying = false; station = null; autoStart(); }
  }
  /* A new kitchen theme brings its own song, unless you picked one */
  function themeChanged() {
    if (!station || previewing || picked()) return;
    const id = defaultId(); if (id === station) return;
    station = id; startTrack(track(id)); render();
  }
  function setVolume(v) {
    settings.radioVol = v; saveSettings();
    if (el && station) { clearInterval(fadeTimer); try { el.volume = vol(); } catch (e) {} }
  }

  /* ---------- The music menu ---------- */
  const ic = name => `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/${name}.svg#i"/></svg>`;
  const eq = `<span class="mu-eq" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const priceOf = id => { const it = typeof STORE_ITEMS !== "undefined" && STORE_ITEMS.find(x => x.id === id); return it ? it.price : ""; };
  function renderMenu() {
    const now = document.getElementById("musicNow");
    if (now) {
      const tr = track(station), on = !!station && !previewing;
      now.innerHTML = `<span class="mu-disc ${station ? "spin" : ""}" aria-hidden="true">${station ? eq : ic("music")}</span>
        <span class="mu-now-text"><span class="mu-now-label">${esc(previewing ? t("Playing a sample") : on ? t("Now playing") : t("Music is off"))}</span>
        <strong>${esc(tr ? t(tr.name) : t("Pick a song below, or tap Play"))}</strong></span>
        <button type="button" class="mu-play ${on ? "on" : ""}" id="musicToggle" aria-label="${esc(previewing ? t("Stop the sample") : on ? t("Turn music off") : t("Turn music on"))}">${on || previewing ? '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>' : '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>'}<span>${esc(previewing ? t("Stop") : on ? t("Off") : t("Play"))}</span></button>`;
    }
    const list = document.getElementById("musicList");
    if (!list) return;
    const auto = !picked();
    const kitchen = track(defaultId());
    const row = tr => {
      const open = trackOpen(tr), playing = station === tr.id && !previewing, sampling = previewing === tr.id;
      const state = playing ? t("Playing") : sampling ? t("Sample playing. Tap to stop.") : open ? t(tr.desc || "") : t("Locked. Tap for a 10 second sample.");
      return `<button type="button" class="mu-track ${playing ? "on" : ""} ${sampling ? "sampling" : ""} ${open ? "" : "locked"}" data-track="${tr.id}" aria-pressed="${playing}">
        <span class="mu-tdisc" aria-hidden="true">${playing || sampling ? eq : tr.icon || ic("music")}</span>
        <span class="mu-tname"><strong>${esc(t(tr.name))}</strong><span>${esc(state)}</span></span>
        <span class="mu-tend" aria-hidden="true">${open ? (playing ? ic("check") : "") : ic(sampling ? "speaker" : "lock")}</span></button>`;
    };
    list.innerHTML = `<button type="button" class="mu-track mu-auto ${auto && station && !previewing ? "on" : ""}" data-track="auto" aria-pressed="${auto}">
        <span class="mu-tdisc" aria-hidden="true">${ic("house")}</span>
        <span class="mu-tname"><strong>${esc(t("Your kitchen's song"))}</strong><span>${esc(t("Changes with your kitchen theme. Now: {name}", { name: t(kitchen.name) }))}</span></span>
        <span class="mu-tend" aria-hidden="true">${auto ? ic("check") : ""}</span></button>` +
      MUSIC_GROUPS.map(g => {
        const tracks = g.tracks(), open = !g.shop || (typeof ownsItem === "function" && ownsItem(g.shop));
        if (!open && typeof isPlayApp !== "undefined" && isPlayApp) return "";   // no paid extras in the Google Play app
        const item = g.shop && typeof STORE_ITEMS !== "undefined" ? STORE_ITEMS.find(x => x.id === g.shop) : null;
        const head = `<h3 class="mu-group-title">${esc(t(g.name))}<span class="mu-badge ${open ? "own" : ""}">${open ? ic("unlock") : ic("lock")} ${esc(open ? (g.shop ? t("Unlocked") : t("Free")) : t("Locked"))}</span></h3>`;
        const how = open || !item ? "" : `<div class="mu-how"><p>${esc(t("Get all four with the {item} for {price}, or everything in the shop with the Everything bundle for {bundle}.", { item: t(item.name), price: item.price, bundle: priceOf("bundle") }))}</p>
          <button type="button" class="mu-shop" data-mu-shop>${ic("basket")}<span>${esc(t("See it in Benji's shop"))}</span></button></div>`;
        return `<section class="mu-group ${open ? "" : "is-locked"}">${head}<div class="mu-tracks">${tracks.map(row).join("")}</div>${how}</section>`;
      }).join("");
  }
  function render() {
    renderMenu();
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
      const tr = track(station);
      btn.setAttribute("aria-label", on && tr ? t("Music menu. Playing {name}.", { name: t(tr.name) }) : t("Music menu. Music is off."));
    }
    const pm = document.getElementById("plyMusicNow");
    if (pm) { const tr = track(station); pm.textContent = on && tr ? t("Now playing: {name}", { name: t(tr.name) }) : t("Music is off"); }
    document.body.classList.toggle("radio-on", on);
  }
  function open() {
    const d = document.getElementById("musicDialog"); if (!d) return;
    const v = document.getElementById("musicVol"); if (v) v.value = settings.radioVol == null ? 50 : settings.radioVol;
    render();
    if (!d.open) d.showModal();
  }
  function init() {
    const d = document.getElementById("musicDialog");
    if (d) {
      d.addEventListener("click", e => {
        if (e.target.closest("#musicClose")) { d.close(); return; }
        if (e.target.closest("#musicToggle")) { if (previewing) endPreview(); else toggle(); return; }
        if (e.target.closest("[data-mu-shop]")) { endPreview(); d.close(); openShop(); return; }
        const b = e.target.closest("[data-track]"); if (!b) return;
        const id = b.dataset.track;
        if (id === "auto") return useKitchenSong();
        const tr = track(id);
        if (!trackOpen(tr)) { if (previewing === id) endPreview(); else if (!preview(id)) toast(t("This phone can't play music.")); return; }
        if (station === id && !previewing) return;   // already playing
        play(id);
      });
      d.addEventListener("close", () => { if (previewing) endPreview(); });
      const v = document.getElementById("musicVol");
      if (v) { v.value = settings.radioVol == null ? 50 : settings.radioVol; v.addEventListener("input", () => setVolume(Number(v.value))); }
      const ios = document.getElementById("musicIos");
      if (ios && /iPhone|iPad|iPod/.test(navigator.userAgent)) ios.classList.remove("hidden");
    }
    const mb = document.getElementById("musicBtn");
    if (mb) mb.addEventListener("click", open);
    const pb = document.getElementById("plyMusicBtn");
    if (pb) pb.addEventListener("click", () => { $("#playPage").close(); open(); });
    document.addEventListener("visibilitychange", () => {
      if (!el) return;
      if (document.hidden) { if (station && !el.paused) { wasHidden = true; el.pause(); } }
      else if (wasHidden) { wasHidden = false; if (station) el.play().catch(() => {}); }
    });
    render();
  }
  return { init, open, play, stop, preview, endPreview, autoStart, answer, asked, toggle, themeChanged, render, playing: () => station, previewing: () => previewing };
})();
const openMusic = () => Radio.open();
