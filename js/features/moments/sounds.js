"use strict";
/* Little sounds and buzzes, made on the fly (no sound files to download).
   Turn them off in Settings under "Sounds and buzzes". */
let sfxCtx = null;
function sfxOn() { return settings.sounds !== false; }
function sfxContext() {
  if (!sfxCtx) { try { sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (sfxCtx.state === "suspended") sfxCtx.resume().catch(() => {});
  return sfxCtx;
}
function tone(ctx, { f1, f2, dur, type, vol, at }) {
  const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + (at || 0);
  o.type = type || "sine";
  o.frequency.setValueAtTime(f1, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(ctx, { dur, vol, freq, at }) {
  const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t0 = ctx.currentTime + (at || 0);
  src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq || 2000; f.Q.value = 0.8;
  g.gain.value = vol || 0.2;
  src.connect(f); f.connect(g); g.connect(ctx.destination);
  src.start(t0);
}
const SFX = {
  pop: c => tone(c, { f1: 420, f2: 900, dur: 0.09, vol: 0.14 }),
  ding: c => { tone(c, { f1: 1046, dur: 0.5, vol: 0.12 }); tone(c, { f1: 1568, dur: 0.6, vol: 0.06, at: 0.04 }); },
  thunk: c => { tone(c, { f1: 160, f2: 60, dur: 0.18, type: "triangle", vol: 0.35 }); noise(c, { dur: 0.06, vol: 0.12, freq: 900 }); },
  rip: c => { noise(c, { dur: 0.22, vol: 0.18, freq: 3200 }); noise(c, { dur: 0.12, vol: 0.12, freq: 1800, at: 0.08 }); },
  tick: c => tone(c, { f1: 1800, dur: 0.03, type: "square", vol: 0.04 }),
  cheer: c => [523, 659, 784, 1046].forEach((f, i) => tone(c, { f1: f, dur: 0.18, vol: 0.1, at: i * 0.08 }))
};
function sfx(name) {
  if (!sfxOn() || !SFX[name]) return;
  const c = sfxContext();
  if (c) try { SFX[name](c); } catch (e) {}
}
function buzz(pattern) {
  if (!sfxOn()) return;
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}
