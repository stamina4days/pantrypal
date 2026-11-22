"use strict";
/* Kitchen radio: gentle background sound made right on the phone with Web Audio.
   Nothing to download and no music licenses. It only starts when you tap a station,
   pauses when you leave the app, and picks back up when you return. */

const RADIO_STATIONS = [
  { id: "lofi", name: "Lo-fi kitchen", short: "Lo-fi", desc: "Soft chords and a slow beat" },
  { id: "simmer", name: "Simmering pot", short: "Simmering", desc: "A pot bubbling on the stove" },
  { id: "rain", name: "Rain on the window", short: "Rain", desc: "A rainy afternoon indoors" }
];

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
  const MAKERS = { lofi, simmer, rain };

  function stopNodes() {
    timers.forEach(clearTimeout); timers = [];
    nodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    nodes = [];
  }
  function play(id) {
    if (!audio() || !MAKERS[id]) return;
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
    if (box) box.innerHTML = RADIO_STATIONS.map(s => `<button type="button" class="station ${station === s.id ? "on" : ""}" aria-pressed="${station === s.id}" data-station="${s.id}">
      <strong>${esc(t(s.name))}</strong><span>${esc(station === s.id ? t("Playing. Tap to stop.") : t(s.desc))}</span></button>`).join("");
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
