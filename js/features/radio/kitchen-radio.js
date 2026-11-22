"use strict";
/* Kitchen radio: gentle background sound made right on the phone with Web Audio.
   Nothing to download and no music licenses. It only starts when you tap a station,
   pauses when you leave the app, and picks back up when you return. */

const RADIO_STATIONS = [
  { id: "lofi", name: "Lo-fi kitchen", short: "Lo-fi", desc: "Soft chords and a slow beat" },
  { id: "simmer", name: "Simmering pot", short: "Simmering", desc: "A pot bubbling on the stove" },
  { id: "rain", name: "Rain on the window", short: "Rain", desc: "A rainy afternoon indoors" },
  // From the radio pack in Benji's shop
  { id: "coffee", name: "Coffee shop", short: "Coffee", desc: "Quiet chatter and clinking cups", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4"/></svg>' },
  { id: "campfire", name: "Campfire", short: "Campfire", desc: "A crackling fire outdoors", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 1 2 2 3 0-3 0-5 1-7z"/><path d="M4 21l16-3M4 18l16 3"/></svg>' },
  { id: "ocean", name: "Ocean waves", short: "Ocean", desc: "Waves rolling onto the sand", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/><path d="M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/></svg>' },
  { id: "holiday", name: "Holiday tunes", short: "Holiday", desc: "Music box bells and sleigh bells", shop: "radio",
    icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/><path d="M12 3v2"/></svg>' }
];
const stationOpen = s => !s.shop || (typeof ownsItem === "function" && ownsItem(s.shop));

const Radio = (() => {
  let ctx = null, master = null, station = null, nodes = [], timers = [], wasPlaying = false;

  const vol = () => (settings.radioVol == null ? 50 : settings.radioVol) / 100 * 0.6;
  function audio() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  function noiseBuffer(kind, seconds) {
    const len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === "pink") { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.05) * 1.8; }
      else d[i] = w;
    }
    return buf;
  }
  function loop(kind, filters, gain) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(kind, 4); src.loop = true;
    let last = src;
    filters.forEach(([type, freq, q]) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q; last.connect(f); last = f; nodes.push(f); });
    const g = ctx.createGain(); g.gain.value = gain; last.connect(g); g.connect(master);
    src.start(); nodes.push(src, g);
  }
  function blip(f1, f2, dur, v, type, at) {
    const o = ctx.createOscillator(), g = ctx.createGain(), t0 = at || ctx.currentTime;
    o.type = type || "sine"; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function tick(freq, dur, v, at) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer("white", dur);
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2;
    const g = ctx.createGain(), t0 = at || ctx.currentTime;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }
  function every(minMs, maxMs, fn) {
    const go = () => { if (!station) return; try { fn(); } catch (e) {} timers.push(setTimeout(go, minMs + Math.random() * (maxMs - minMs))); };
    go();
  }

  /* Lo-fi: four soft chords, a gentle kick, a whisper of hi-hat, and vinyl crackle. */
  function lofi() {
    loop("pink", [["highpass", 1500], ["lowpass", 5000]], 0.012);
    every(60, 260, () => tick(3000 + Math.random() * 3000, 0.02, 0.02 + Math.random() * 0.03));
    const chords = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [293.7, 349.2, 440, 523.3], [196, 246.9, 293.7, 349.2]];
    const beat = 60 / 70, bar = beat * 4;
    let next = ctx.currentTime + 0.1, step = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100; lp.connect(master); nodes.push(lp);
    const schedule = () => {
      if (!station) return;
      while (next < ctx.currentTime + 1.2) {
        const chord = chords[Math.floor(step / 4) % chords.length], b = step % 4;
        if (b === 0) chord.forEach((f, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = i % 2 ? "triangle" : "sine"; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 12;
          g.gain.setValueAtTime(0.0001, next); g.gain.linearRampToValueAtTime(0.05, next + 0.4); g.gain.linearRampToValueAtTime(0.0001, next + bar * 0.98);
          o.connect(g); g.connect(lp); o.start(next); o.stop(next + bar);
        });
        if (b === 0 || b === 2) blip(110, 45, 0.28, 0.32, "sine", next);
        tick(7000, 0.04, 0.03, next + beat / 2);
        if (b === 1 || b === 3) tick(1800, 0.09, 0.05, next);
        if (b === 0 && Math.random() < 0.6) { const f = chord[Math.floor(Math.random() * 4)] * 2; blip(f, f * 0.995, 0.6, 0.035, "sine", next + beat * (1 + Math.floor(Math.random() * 2))); }
        next += beat; step++;
      }
      timers.push(setTimeout(schedule, 300));
    };
    schedule();
  }
  /* Simmering pot: a low rumble and little bubbles popping. */
  function simmer() {
    loop("brown", [["lowpass", 420]], 0.5);
    loop("pink", [["bandpass", 900, 0.6]], 0.03);
    every(70, 420, () => { const f = 180 + Math.random() * 380; blip(f, f * (1.6 + Math.random()), 0.05 + Math.random() * 0.05, 0.04 + Math.random() * 0.05); });
  }
  /* Rain: soft wash plus drops tapping the glass. */
  function rain() {
    loop("pink", [["highpass", 350], ["lowpass", 5200]], 0.32);
    loop("brown", [["lowpass", 250]], 0.18);
    every(25, 140, () => tick(2500 + Math.random() * 4000, 0.015 + Math.random() * 0.02, 0.03 + Math.random() * 0.06));
  }
  /* Coffee shop: a murmur of voices, the odd cup set down, and the espresso machine now and then. */
  function coffee() {
    loop("pink", [["bandpass", 520, 0.7], ["lowpass", 1800]], 0.22);
    loop("brown", [["lowpass", 300]], 0.08);
    every(900, 3200, () => { const f = 2200 + Math.random() * 1600; blip(f, f * 1.01, 0.18, 0.05, "sine"); blip(f * 1.5, f * 1.5, 0.12, 0.025, "sine", ctx.currentTime + 0.02); });
    every(12000, 26000, () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer("white", 2.5);
      const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 3000;
      const g = ctx.createGain(), t0 = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.05, t0 + 0.3); g.gain.linearRampToValueAtTime(0.0001, t0 + 2.4);
      src.connect(f); f.connect(g); g.connect(master); src.start(t0);
    });
  }
  /* Campfire: a low roar with crackles and the odd pop. */
  function campfire() {
    loop("brown", [["lowpass", 500]], 0.42);
    loop("pink", [["bandpass", 1200, 0.8]], 0.02);
    every(30, 220, () => tick(1500 + Math.random() * 5000, 0.01 + Math.random() * 0.02, 0.04 + Math.random() * 0.1));
    every(1500, 5000, () => tick(900, 0.06, 0.18));
  }
  /* Ocean: waves that swell and pull back about every eight seconds. */
  function ocean() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer("pink", 4); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    const g = ctx.createGain(); g.gain.value = 0.15;
    const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = 0.12; depth.gain.value = 0.13;
    const fl = ctx.createGain(); fl.gain.value = 600; lfo.connect(fl); fl.connect(f.frequency);
    lfo.connect(depth); depth.connect(g.gain); src.connect(f); f.connect(g); g.connect(master);
    src.start(); lfo.start(); nodes.push(src, f, g, lfo, depth, fl);
    loop("brown", [["lowpass", 160]], 0.15);
  }
  /* Holiday tunes: a music box playing a gentle waltz, with sleigh bells. */
  function holiday() {
    const notes = [659.3, 784, 880, 784, 659.3, 587.3, 523.3, 587.3, 659.3, 659.3, 587.3, 523.3, 784, 880, 987.8, 880, 784, 659.3, 698.5, 659.3, 587.3, 523.3, 587.3, 523.3];
    const beat = 0.42; let next = ctx.currentTime + 0.2, i = 0;
    const schedule = () => {
      if (!station) return;
      while (next < ctx.currentTime + 1.2) {
        const f = notes[i % notes.length];
        blip(f, f * 0.998, 1.2, 0.07, "sine", next); blip(f * 2, f * 2, 0.5, 0.015, "sine", next);
        if (i % 3 === 0) blip(f / 2, f / 2, 1.0, 0.03, "triangle", next);
        if (i % 6 === 5) next += beat;
        next += beat; i++;
      }
      timers.push(setTimeout(schedule, 300));
    };
    schedule();
    every(180, 420, () => tick(7000 + Math.random() * 2000, 0.05, 0.03));
  }
  const MAKERS = { lofi, simmer, rain, coffee, campfire, ocean, holiday };

  function stopNodes() {
    timers.forEach(clearTimeout); timers = [];
    nodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    nodes = [];
  }
  function play(id) {
    const st = RADIO_STATIONS.find(s => s.id === id);
    if (!st || !stationOpen(st) || !audio() || !MAKERS[id]) return;
    stopNodes();
    station = id; settings.radioStation = id; saveSettings();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(vol(), ctx.currentTime + 1.2);
    MAKERS[id]();
    render();
  }
  function stop() {
    if (!ctx || !station) { station = null; render(); return; }
    station = null;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => { if (!station) stopNodes(); }, 450);
    render();
  }
  function setVolume(v) {
    settings.radioVol = v; saveSettings();
    if (ctx && station) master.gain.setTargetAtTime(vol(), ctx.currentTime, 0.1);
  }
  function render() {
    const box = document.getElementById("radioStations");
    if (box) box.innerHTML = RADIO_STATIONS.map(s => {
      const open = stationOpen(s);
      return `<button type="button" class="station ${station === s.id ? "on" : ""} ${open ? "" : "locked"}" ${open ? `aria-pressed="${station === s.id}"` : `aria-disabled="true"`} data-station="${s.id}">
      <strong>${open ? "" : `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/lock.svg#i"/></svg> `}${esc(t(s.name))}</strong><span>${esc(!open ? t("In Benji's shop") : station === s.id ? t("Playing. Tap to stop.") : t(s.desc))}</span></button>`;
    }).join("");
    const pill = document.getElementById("radioPill");
    if (pill) {
      pill.classList.toggle("hidden", !station);
      document.body.classList.toggle("radio-on", !!station);
      const st = RADIO_STATIONS.find(s => s.id === station);
      if (st) { pill.querySelector(".rp-name").textContent = t(st.short); pill.querySelector(".rp-open").setAttribute("aria-label", t("{name} is playing. Open the radio.", { name: t(st.name) })); }
    }
  }
  function init() {
    const brand = document.querySelector(".brand") || document.body;
    brand.insertAdjacentHTML("afterbegin", `<div id="radioPill" class="radio-pill hidden" role="region" aria-label="${esc(t("Kitchen radio"))}">
      <button type="button" class="rp-open" aria-label="${esc(t("Kitchen radio"))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/music.svg#i"/></svg><span class="rp-name"></span></button>
      <button type="button" class="rp-stop" aria-label="${esc(t("Stop the radio"))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/close.svg#i"/></svg></button></div>`);
    $("#radioPill .rp-stop").addEventListener("click", stop);
    $("#radioPill .rp-open").addEventListener("click", () => openPlay());
    $("#radioStations").addEventListener("click", e => {
      const b = e.target.closest("[data-station]"); if (!b) return;
      const st = RADIO_STATIONS.find(s => s.id === b.dataset.station);
      if (!stationOpen(st)) { $("#playPage").close(); openShop(); return; }
      if (station === b.dataset.station) stop(); else play(b.dataset.station);
    });
    const v = $("#radioVol");
    v.value = settings.radioVol == null ? 50 : settings.radioVol;
    v.addEventListener("input", () => setVolume(Number(v.value)));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { wasPlaying = station; if (station) stop(); }
      else if (wasPlaying) { play(wasPlaying); wasPlaying = false; }
    });
    render();
  }
  return { init, play, stop, render, playing: () => station };
})();
