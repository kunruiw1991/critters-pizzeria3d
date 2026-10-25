/**
 * Critter Pizzeria 3D - Procedural WebAudio ASMR & Kalimba/Marimba Sound Engine
 * 100% procedural synthesis using WebAudio API (AudioContext, DynamicsCompressor,
 * warm sine/triangle/filtered-noise generators).
 */

const PENTATONIC_HZ = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6

let ctx = null;
let masterGain = null;
let compressor = null;
let noiseBuffer = null;
let muted = false;
let listenersBound = false;
let gestureUnlocked = false;
let resumePending = false;
const lastTriggerMap = new Map();

function hasUserActivation() {
  if (typeof navigator !== 'undefined' && navigator.userActivation) {
    return Boolean(navigator.userActivation.isActive || navigator.userActivation.hasBeenActive);
  }
  return gestureUnlocked;
}

function canTrigger(key, minGapMs = 18) {
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const prev = lastTriggerMap.get(key) || 0;
  if (now - prev < minGapMs) return false;
  lastTriggerMap.set(key, now);
  return true;
}

function createNoiseBuffer(audioCtx) {
  const sampleRate = audioCtx.sampleRate || 44100;
  const length = Math.floor(sampleRate * 1.5);
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    // Warm pink-tinted noise so ASMR textures never sound harsh
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
    b6 = white * 0.115926;
  }
  return buffer;
}

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!hasUserActivation()) return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, ctx.currentTime);
      compressor.knee.setValueAtTime(24, ctx.currentTime);
      compressor.ratio.setValueAtTime(6, ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0.0001 : 0.72, ctx.currentTime);

      masterGain.connect(compressor);
      compressor.connect(ctx.destination);
      noiseBuffer = createNoiseBuffer(ctx);
    } catch (_) {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended' && !resumePending) {
    resumePending = true;
    try {
      const p = ctx.resume();
      if (p && typeof p.then === 'function') {
        p.then(() => { resumePending = false; }, () => { resumePending = false; });
      } else {
        resumePending = false;
      }
    } catch (_) {
      resumePending = false;
    }
  }
  return ctx;
}

function bindGestureUnlock() {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;
  const unlock = (e) => {
    if (e && e.isTrusted === false) return;
    if (typeof navigator !== 'undefined' && navigator.userActivation) {
      if (!navigator.userActivation.isActive && !navigator.userActivation.hasBeenActive) return;
    }
    gestureUnlocked = true;
    ensureContext();
  };
  const opts = { capture: true, passive: true };
  window.addEventListener('pointerdown', unlock, opts);
  window.addEventListener('mousedown', unlock, opts);
  window.addEventListener('touchstart', unlock, opts);
  window.addEventListener('keydown', unlock, opts);
  window.addEventListener('click', unlock, opts);
}

bindGestureUnlock();

function init() {
  bindGestureUnlock();
  return ensureContext();
}

function setMuted(bool) {
  muted = Boolean(bool);
  if (ctx && masterGain) {
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(muted ? 0.0001 : 0.72, now, 0.02);
  }
  return muted;
}

function isMuted() {
  return muted;
}

function toggleMute() {
  return setMuted(!muted);
}

/**
 * Helper: play a warm marimba/kalimba note with fundamental + soft octave harmonic
 */
function scheduleKalimbaNote(audioCtx, dest, freq, startTime, duration = 0.24, peakGain = 0.22) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.18, startTime);
  g2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.45);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  osc1.connect(gain);
  osc2.connect(g2);
  g2.connect(gain);
  gain.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration + 0.02);
  osc2.stop(startTime + duration + 0.02);
}

/**
 * Helper: play a burst of filtered pink noise for ASMR culinary textures
 */
function scheduleFilteredNoise(audioCtx, dest, startTime, duration, filterType, freqStart, freqEnd, Q, peakGain, attack = 0.015) {
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer(audioCtx);
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.setValueAtTime(Q, startTime);
  filter.frequency.setValueAtTime(Math.max(40, freqStart), startTime);
  if (freqEnd && freqEnd !== freqStart) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startTime + duration);
  }

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(attack, duration * 0.45));
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  const offset = ( startTime * 0.37 ) % 0.8;
  src.start(startTime, offset);
  src.stop(startTime + duration + 0.02);
}

/**
 * Warm low-mid membrane thump + soft rising pop (140Hz -> 320Hz) when dough lands on the prep board.
 */
function playDoughPlop() {
  if (muted || !canTrigger('doughPlop', 20)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;

    // 1. Warm wooden board membrane thump (115Hz -> 62Hz)
    const thump = audioCtx.createOscillator();
    const thumpGain = audioCtx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(115, t);
    thump.frequency.exponentialRampToValueAtTime(62, t + 0.13);
    thumpGain.gain.setValueAtTime(0.0001, t);
    thumpGain.gain.linearRampToValueAtTime(0.34, t + 0.009);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    thump.connect(thumpGain);
    thumpGain.connect(masterGain);
    thump.start(t);
    thump.stop(t + 0.16);

    // 2. Plump rising dough pop (140Hz -> 320Hz)
    const pop = audioCtx.createOscillator();
    const popGain = audioCtx.createGain();
    pop.type = 'triangle';
    pop.frequency.setValueAtTime(140, t + 0.025);
    pop.frequency.exponentialRampToValueAtTime(320, t + 0.14);
    popGain.gain.setValueAtTime(0.0001, t + 0.025);
    popGain.gain.linearRampToValueAtTime(0.24, t + 0.045);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    const lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(950, t + 0.025);

    pop.connect(lpf);
    lpf.connect(popGain);
    popGain.connect(masterGain);
    pop.start(t + 0.025);
    pop.stop(t + 0.17);

    // 3. Subtle flour pat texture
    scheduleFilteredNoise(audioCtx, masterGain, t + 0.005, 0.09, 'bandpass', 420, 680, 2.2, 0.14, 0.01);
  } catch (_) {}
}

/**
 * Soft filtered noise swoosh + wet bubble pop when spreading tomato sauce & cheese.
 */
function playSauceSpread() {
  if (muted || !canTrigger('sauceSpread', 25)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Soft ladle swoosh
    scheduleFilteredNoise(audioCtx, masterGain, t, 0.19, 'bandpass', 380, 920, 3.0, 0.20, 0.04);

    // Two gentle wet sauce bubble pops
    const freqs = [290, 410];
    freqs.forEach((f, idx) => {
      const start = t + 0.06 + idx * 0.055;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      osc.frequency.exponentialRampToValueAtTime(f * 1.65, start + 0.065);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.16, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.075);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.08);
    });
  } catch (_) {}
}

/**
 * Cheerful marimba/xylophone pentatonic pop (C5, D5, E5, G5, A5, C6) when adding pepperoni or veggies.
 */
function playToppingPop(stepIndex = 0) {
  if (muted || !canTrigger('toppingPop', 15)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    const idx = Math.abs(Math.floor(Number(stepIndex) || 0)) % PENTATONIC_HZ.length;
    const freq = PENTATONIC_HZ[idx];

    // Warm marimba bar hit
    scheduleKalimbaNote(audioCtx, masterGain, freq, t, 0.22, 0.26);

    // Subtle crisp placement pop
    const pop = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(freq * 0.5, t);
    pop.frequency.exponentialRampToValueAtTime(freq * 1.25, t + 0.045);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
    pop.connect(g);
    g.connect(masterGain);
    pop.start(t);
    pop.stop(t + 0.06);
  } catch (_) {}
}

/**
 * Wooden peel slide + warm brick hearth whoosh when sliding pizza into an oven.
 */
function playOvenSlide() {
  if (muted || !canTrigger('ovenSlide', 25)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Wooden peel scrape/slide (bandpass sweep)
    scheduleFilteredNoise(audioCtx, masterGain, t, 0.22, 'bandpass', 320, 780, 2.8, 0.24, 0.03);

    // Warm brick hearth low whoosh
    scheduleFilteredNoise(audioCtx, masterGain, t + 0.05, 0.26, 'lowpass', 480, 210, 1.4, 0.26, 0.05);

    // Cozy low wood resonance thump at settle
    const wood = audioCtx.createOscillator();
    const wg = audioCtx.createGain();
    wood.type = 'triangle';
    wood.frequency.setValueAtTime(165, t + 0.12);
    wood.frequency.exponentialRampToValueAtTime(98, t + 0.25);
    wg.gain.setValueAtTime(0.0001, t + 0.12);
    wg.gain.linearRampToValueAtTime(0.18, t + 0.135);
    wg.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    wood.connect(wg);
    wg.connect(masterGain);
    wood.start(t + 0.12);
    wood.stop(t + 0.27);
  } catch (_) {}
}

/**
 * Crystal-clear harmonic kitchen timer bell (1046.5Hz + 2093Hz with warm shimmer) when a pizza finishes baking.
 */
function playOvenDing() {
  if (muted || !canTrigger('ovenDing', 35)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    const partials = [
      { freq: 1046.5, gain: 0.28, dur: 0.68 },
      { freq: 2093.0, gain: 0.16, dur: 0.52 },
      { freq: 3139.5, gain: 0.06, dur: 0.34 },
      { freq: 1049.2, gain: 0.09, dur: 0.62 } // Warm chorus shimmer
    ];
    partials.forEach((p) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(p.gain, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + p.dur + 0.02);
    });
  } catch (_) {}
}

/**
 * Gentle rhythmic woodblock tick when a baked pizza is close to burning.
 */
function playBurnWarning() {
  if (muted || !canTrigger('burnWarning', 120)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Hollow maple woodblock (740Hz + 1110Hz short resonant click)
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(760, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.065);

    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(740, t);
    bp.Q.setValueAtTime(5.5, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

    osc.connect(bp);
    bp.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  } catch (_) {}
}

/**
 * Funny low puff of smoke + descending muted trombone/bassoon note when a pizza burns or is trashed.
 */
function playBurnPoof() {
  if (muted || !canTrigger('burnPoof', 40)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Soft smoke poof
    scheduleFilteredNoise(audioCtx, masterGain, t, 0.32, 'lowpass', 620, 140, 1.8, 0.28, 0.02);

    // Muted bassoon/trombone playful descending two-step ("womp-womp")
    const notes = [
      { start: t + 0.02, f0: 196.0, f1: 185.0, dur: 0.16 },
      { start: t + 0.18, f0: 174.6, f1: 130.8, dur: 0.28 }
    ];
    notes.forEach((n) => {
      const osc = audioCtx.createOscillator();
      const lpf = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f0, n.start);
      osc.frequency.exponentialRampToValueAtTime(n.f1, n.start + n.dur);

      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(480, n.start);
      lpf.Q.setValueAtTime(2.5, n.start);

      g.gain.setValueAtTime(0.0001, n.start);
      g.gain.linearRampToValueAtTime(0.18, n.start + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, n.start + n.dur);

      osc.connect(lpf);
      lpf.connect(g);
      g.connect(masterGain);
      osc.start(n.start);
      osc.stop(n.start + n.dur + 0.02);
    });
  } catch (_) {}
}

/**
 * Bubbly liquid fizz + bright glass clink when a mango juice cup finishes filling.
 */
function playJuiceReady() {
  if (muted || !canTrigger('juiceReady', 35)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Sparkling mango fizz bubbles
    const bubbleFreqs = [580, 740, 920, 1180];
    bubbleFreqs.forEach((bf, i) => {
      const st = t + i * 0.032;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(bf, st);
      osc.frequency.exponentialRampToValueAtTime(bf * 1.45, st + 0.045);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(0.12, st + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.05);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(st);
      osc.stop(st + 0.055);
    });

    // Bright crystal glass clink (1568Hz G6 + 2349Hz D7)
    const clinkStart = t + 0.11;
    scheduleKalimbaNote(audioCtx, masterGain, 1567.98, clinkStart, 0.28, 0.20);
    scheduleKalimbaNote(audioCtx, masterGain, 2349.32, clinkStart + 0.015, 0.22, 0.12);
  } catch (_) {}
}

/**
 * Quick airy arc whoosh when food flies to a customer.
 */
function playServeWhoosh() {
  if (muted || !canTrigger('serveWhoosh', 20)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    scheduleFilteredNoise(audioCtx, masterGain, t, 0.20, 'bandpass', 420, 1350, 2.2, 0.22, 0.035);
    // Gentle rising breeze whistle
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.10, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.19);
  } catch (_) {}
}

/**
 * Double crispy pizza bite + joyful kalimba arpeggio that transposes upward with combo (1..4).
 */
function playHappyChomp(combo = 1) {
  if (muted || !canTrigger('happyChomp', 25)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    const clampedCombo = Math.max(1, Math.min(4, Math.floor(Number(combo) || 1)));
    // Semitone transposition per combo level (0, +2, +4, +7 semitones)
    const semitoneMap = [0, 2, 4, 7];
    const pitchRatio = Math.pow(2, semitoneMap[clampedCombo - 1] / 12);

    // 1. Double crispy crust chomp ("crunch-crunch")
    [0, 0.095].forEach((offset, idx) => {
      const st = t + offset;
      scheduleFilteredNoise(audioCtx, masterGain, st, 0.075, 'bandpass', 720 + idx * 140, 420, 2.4, 0.25, 0.008);
      const bOsc = audioCtx.createOscillator();
      const bGain = audioCtx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(210 + idx * 35, st);
      bOsc.frequency.exponentialRampToValueAtTime(110, st + 0.065);
      bGain.gain.setValueAtTime(0.0001, st);
      bGain.gain.linearRampToValueAtTime(0.20, st + 0.007);
      bGain.gain.exponentialRampToValueAtTime(0.001, st + 0.07);
      bOsc.connect(bGain);
      bGain.connect(masterGain);
      bOsc.start(st);
      bOsc.stop(st + 0.075);
    });

    // 2. Joyful rising kalimba arpeggio (C5 - E5 - G5 - C6 transposed by combo)
    const baseArp = [523.25, 659.25, 783.99, 1046.50];
    baseArp.forEach((f, i) => {
      const noteTime = t + 0.14 + i * 0.055;
      scheduleKalimbaNote(audioCtx, masterGain, f * pitchRatio, noteTime, 0.26, 0.22);
    });
  } catch (_) {}
}

/**
 * Sparkling staggered gold coin chimes.
 */
function playCoinJingle(count = 3) {
  if (muted || !canTrigger('coinJingle', 25)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    const n = Math.max(1, Math.min(6, Math.floor(Number(count) || 3)));
    const coinNotes = [1318.51, 1567.98, 1975.53, 2093.00, 2637.02, 3135.96]; // E6, G6, B6, C7, E7, G7
    for (let i = 0; i < n; i++) {
      const st = t + i * 0.052;
      const freq = coinNotes[i % coinNotes.length];
      scheduleKalimbaNote(audioCtx, masterGain, freq, st, 0.30, 0.18);
    }
  } catch (_) {}
}

/**
 * Gentle sympathetic descending two-note sigh if a customer's patience runs out.
 */
function playCustomerAngry() {
  if (muted || !canTrigger('customerAngry', 40)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Warm marimba/woodwind sympathetic two-note descending interval (E4 -> C4)
    const sighNotes = [
      { start: t, f0: 329.63, f1: 311.13, dur: 0.22 },
      { start: t + 0.21, f0: 261.63, f1: 246.94, dur: 0.34 }
    ];
    sighNotes.forEach((sn) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(sn.f0, sn.start);
      osc.frequency.exponentialRampToValueAtTime(sn.f1, sn.start + sn.dur);

      const lpf = audioCtx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(720, sn.start);

      g.gain.setValueAtTime(0.0001, sn.start);
      g.gain.linearRampToValueAtTime(0.20, sn.start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, sn.start + sn.dur);

      osc.connect(lpf);
      lpf.connect(g);
      g.connect(masterGain);
      osc.start(sn.start);
      osc.stop(sn.start + sn.dur + 0.02);
    });
  } catch (_) {}
}

/**
 * Triumphant marimba + warm brass chord progression for stars >= 1 (1..3),
 * or a gentle encouraging retry cadence for stars === 0.
 */
function playWaveResult(stars = 3) {
  if (muted || !canTrigger('waveResult', 60)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    const starCount = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));

    if (starCount >= 1) {
      // Triumphant marimba fanfare + warm brass pad (C major -> F major -> G major -> C6 tonic)
      const chords = [
        { time: 0.00, notes: [261.63, 329.63, 392.00, 523.25], dur: 0.22 },
        { time: 0.18, notes: [349.23, 440.00, 523.25, 698.46], dur: 0.22 },
        { time: 0.36, notes: [392.00, 493.88, 587.33, 783.99], dur: 0.24 },
        { time: 0.56, notes: [261.63, 392.00, 523.25, 659.25, 1046.50], dur: 0.65 }
      ];
      chords.forEach((ch) => {
        ch.notes.forEach((freq, idx) => {
          // Warm marimba lead
          scheduleKalimbaNote(audioCtx, masterGain, freq, t + ch.time + idx * 0.015, ch.dur, 0.15);

          // Soft warm brass pad underneath
          const brass = audioCtx.createOscillator();
          const lpf = audioCtx.createBiquadFilter();
          const bg = audioCtx.createGain();
          brass.type = 'sawtooth';
          brass.frequency.setValueAtTime(freq * 0.5, t + ch.time);

          lpf.type = 'lowpass';
          lpf.frequency.setValueAtTime(680, t + ch.time);

          bg.gain.setValueAtTime(0.0001, t + ch.time);
          bg.gain.linearRampToValueAtTime(0.055, t + ch.time + 0.03);
          bg.gain.exponentialRampToValueAtTime(0.0008, t + ch.time + ch.dur);

          brass.connect(lpf);
          lpf.connect(bg);
          bg.connect(masterGain);
          brass.start(t + ch.time);
          brass.stop(t + ch.time + ch.dur + 0.02);
        });
      });
    } else {
      // Gentle, warm encouraging retry cadence (G4 -> E4 -> C4 -> D4 -> G4)
      const retryNotes = [
        { time: 0.00, freq: 392.00, dur: 0.20 },
        { time: 0.16, freq: 329.63, dur: 0.20 },
        { time: 0.32, freq: 261.63, dur: 0.28 },
        { time: 0.52, freq: 293.66, dur: 0.38 }
      ];
      retryNotes.forEach((rn) => {
        scheduleKalimbaNote(audioCtx, masterGain, rn.freq, t + rn.time, rn.dur, 0.20);
      });
    }
  } catch (_) {}
}

/**
 * Optional gentle wooden UI tap helper in case HUD buttons call it.
 */
function playClick() {
  if (muted || !canTrigger('uiClick', 15)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    scheduleKalimbaNote(audioCtx, masterGain, 659.25, audioCtx.currentTime, 0.09, 0.15);
  } catch (_) {}
}

/**
 * Creamy soft-serve swirl sweep + ascending pentatonic kalimba chime for Gelato Sundae Station.
 */
function playGelatoSwirl(stepIndex = 0) {
  if (muted || !canTrigger('gelatoSwirl', 20)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    const step = Math.max(0, Math.min(2, Math.floor(Number(stepIndex) || 0)));

    // Creamy soft-serve dispenser swirl noise sweep
    scheduleFilteredNoise(
      audioCtx,
      masterGain,
      t,
      0.22,
      'bandpass',
      460 + step * 180,
      1180 + step * 260,
      3.4,
      0.19,
      0.03
    );

    // Smooth rising sine swirl glide
    const swirlOsc = audioCtx.createOscillator();
    const swirlGain = audioCtx.createGain();
    swirlOsc.type = 'sine';
    swirlOsc.frequency.setValueAtTime(360 + step * 110, t);
    swirlOsc.frequency.exponentialRampToValueAtTime(740 + step * 220, t + 0.18);
    swirlGain.gain.setValueAtTime(0.0001, t);
    swirlGain.gain.linearRampToValueAtTime(0.15, t + 0.025);
    swirlGain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    swirlOsc.connect(swirlGain);
    swirlGain.connect(masterGain);
    swirlOsc.start(t);
    swirlOsc.stop(t + 0.21);

    // Ascending pentatonic kalimba chime (C5-E5-G5 or E5-G5-C6)
    const chimeSets = [
      [523.25, 659.25, 783.99],
      [659.25, 783.99, 1046.50],
      [783.99, 1046.50, 1318.51]
    ];
    const notes = chimeSets[step] || chimeSets[0];
    notes.forEach((freq, idx) => {
      scheduleKalimbaNote(audioCtx, masterGain, freq, t + 0.04 + idx * 0.055, 0.24, 0.20);
    });
  } catch (_) {}
}

/**
 * Shimmering golden bell triad (C6 - E6 - G6 - C7) when crowning a pizza with Golden Honey-Star Crust.
 */
function playStarCrustSparkle() {
  if (muted || !canTrigger('starCrustSparkle', 25)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    const triad = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7
    triad.forEach((freq, idx) => {
      const start = t + idx * 0.048;
      scheduleKalimbaNote(audioCtx, masterGain, freq, start, 0.34, 0.21);
      // Shimmer overtone
      scheduleKalimbaNote(audioCtx, masterGain, freq * 1.5, start + 0.015, 0.22, 0.09);
    });
  } catch (_) {}
}

/**
 * Cheerful bouncy 3-note marimba riff when tapping the Sous-Chef Helper Buddy.
 */
function playHelperCheer() {
  if (muted || !canTrigger('helperCheer', 30)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Bouncy 3-note marimba riff (G5 -> A5 -> C6 with warm fifth harmony)
    const riff = [
      { freq: 783.99, harm: 523.25, offset: 0.00, dur: 0.18 },
      { freq: 880.00, harm: 587.33, offset: 0.085, dur: 0.18 },
      { freq: 1046.50, harm: 659.25, offset: 0.17, dur: 0.32 }
    ];
    riff.forEach((note) => {
      scheduleKalimbaNote(audioCtx, masterGain, note.freq, t + note.offset, note.dur, 0.24);
      scheduleKalimbaNote(audioCtx, masterGain, note.harm, t + note.offset + 0.01, note.dur, 0.14);
    });
  } catch (_) {}
}

/**
 * Gentle magic pizza-peel whoosh + crystal rescue chime when Sous-Chef Buddy prevents an oven burn.
 */
function playHelperRescue() {
  if (muted || !canTrigger('helperRescue', 60)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    scheduleFilteredNoise(audioCtx, masterGain, t, 0.16, 'bandpass', 520, 1480, 2.5, 0.18, 0.02);
    scheduleKalimbaNote(audioCtx, masterGain, 880.00, t + 0.02, 0.22, 0.20);
    scheduleKalimbaNote(audioCtx, masterGain, 1174.66, t + 0.08, 0.28, 0.22);
    scheduleKalimbaNote(audioCtx, masterGain, 1567.98, t + 0.14, 0.34, 0.20);
  } catch (_) {}
}

/**
 * Festive 5-note golden party fanfare when VIP Golden Pizza Party Fever triggers.
 */
function playPartyFeverFanfare() {
  if (muted || !canTrigger('partyFeverFanfare', 80)) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !masterGain) return;
  try {
    const t = audioCtx.currentTime;
    // Festive 5-note ascending golden fanfare: C5 -> E5 -> G5 -> A5 -> C6 (+ octave shimmer)
    const fanfareNotes = [
      { freq: 523.25, offset: 0.00, dur: 0.18 },
      { freq: 659.25, offset: 0.07, dur: 0.18 },
      { freq: 783.99, offset: 0.14, dur: 0.18 },
      { freq: 880.00, offset: 0.21, dur: 0.20 },
      { freq: 1046.50, offset: 0.29, dur: 0.48 }
    ];
    fanfareNotes.forEach((n, idx) => {
      const st = t + n.offset;
      scheduleKalimbaNote(audioCtx, masterGain, n.freq, st, n.dur, 0.24);
      scheduleKalimbaNote(audioCtx, masterGain, n.freq * 2, st + 0.012, n.dur * 0.85, 0.13);
      if (idx === fanfareNotes.length - 1) {
        // Warm brass pad on final tonic
        const pad = audioCtx.createOscillator();
        const lpf = audioCtx.createBiquadFilter();
        const pg = audioCtx.createGain();
        pad.type = 'sawtooth';
        pad.frequency.setValueAtTime(523.25, st);
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(820, st);
        pg.gain.setValueAtTime(0.0001, st);
        pg.gain.linearRampToValueAtTime(0.08, st + 0.03);
        pg.gain.exponentialRampToValueAtTime(0.0008, st + n.dur);
        pad.connect(lpf);
        lpf.connect(pg);
        pg.connect(masterGain);
        pad.start(st);
        pad.stop(st + n.dur + 0.02);
      }
    });
  } catch (_) {}
}

export const PizzeriaAudio = {
  init,
  setMuted,
  isMuted,
  toggleMute,
  playDoughPlop,
  playSauceSpread,
  playToppingPop,
  playOvenSlide,
  playOvenDing,
  playBurnWarning,
  playBurnPoof,
  playJuiceReady,
  playServeWhoosh,
  playHappyChomp,
  playCoinJingle,
  playCustomerAngry,
  playWaveResult,
  playClick,
  playGelatoSwirl,
  playStarCrustSparkle,
  playHelperCheer,
  playHelperRescue,
  playPartyFeverFanfare
};

if (typeof window !== 'undefined') {
  window.PizzeriaAudio = PizzeriaAudio;
}

export {
  init,
  setMuted,
  isMuted,
  toggleMute,
  playDoughPlop,
  playSauceSpread,
  playToppingPop,
  playOvenSlide,
  playOvenDing,
  playBurnWarning,
  playBurnPoof,
  playJuiceReady,
  playServeWhoosh,
  playHappyChomp,
  playCoinJingle,
  playCustomerAngry,
  playWaveResult,
  playClick,
  playGelatoSwirl,
  playStarCrustSparkle,
  playHelperCheer,
  playHelperRescue,
  playPartyFeverFanfare
};

export default PizzeriaAudio;
