// Game feel: synthesized sound effects (Web Audio, no files, the way Krillion does it), and a screen shake.
// Cue timings and envelopes follow the measurements in the open-source OpenKrillion fidelity audit (MIT): sounds start from silence
// with a linear attack (an exponential one sounds soft), decay exponentially, and the clock's warning is a double pulse.
const MUTE_KEY = "stamped:muted", MASTER = 0.6;
let ac: AudioContext | null = null, out: GainNode | null = null;

export const reducedMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export function isMuted() { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } }
export function setMuted(m: boolean) { try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch { /* storage blocked: mute lasts this page */ } if (out) out.gain.value = m ? 0 : MASTER; }

function ctx() {
  if (typeof window === "undefined") return null;
  if (!ac) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); out = ac.createGain(); out.gain.value = isMuted() ? 0 : MASTER; out.connect(ac.destination); } catch { ac = null; return null; }
    // a hidden tab goes quiet, and wakes again when it is shown
    document.addEventListener("visibilitychange", () => { if (!ac) return; if (document.hidden) void ac.suspend().catch(() => {}); else if (!isMuted()) void ac.resume().catch(() => {}); });
  }
  if (ac.state === "suspended" && !document.hidden) void ac.resume();
  return ac;
}

/** One voice of a cue: a tone (f, optionally gliding to 'to') or filtered noise. vol is the peak gain before the master. */
export type Voice = { f?: number; to?: number; noise?: true; dur: number; at?: number; type?: OscillatorType; vol: number; attack?: number; lp?: number; lpTo?: number; hp?: number };
/** Schedules one voice on any audio context, live or offline (the sound check renders every cue offline). */
export function playVoice(a: BaseAudioContext, dest: AudioNode, v: Voice) {
  const t = a.currentTime + (v.at ?? 0), attack = v.attack ?? (v.noise ? 0.003 : 0.005), g = a.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v.vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + v.dur);
  let src: AudioScheduledSourceNode, node: AudioNode;
  if (v.noise) {
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * (v.dur + 0.1)), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const b = a.createBufferSource(); b.buffer = buf; src = b; node = b;
  } else {
    const o = a.createOscillator(); o.type = v.type ?? "sine"; o.frequency.setValueAtTime(v.f!, t); if (v.to) o.frequency.exponentialRampToValueAtTime(v.to, t + v.dur); src = o; node = o;
  }
  if (v.lp || v.noise) { const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(v.lp ?? 1200, t); if (v.lpTo) f.frequency.exponentialRampToValueAtTime(v.lpTo, t + v.dur); node.connect(f); node = f; }
  if (v.hp) { const f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = v.hp; node.connect(f); node = f; }
  node.connect(g).connect(dest); src.start(t); src.stop(t + attack + v.dur + 0.1);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
export const CUES = {
  board: [{ f: G5, dur: 0.35, type: "triangle", vol: 0.18 }, { f: E5, dur: 0.5, at: 0.16, type: "triangle", vol: 0.18 }],   // airport chime, high-low
  count: [{ f: 880, dur: 0.09, type: "square", vol: 0.05 }],
  go: [{ f: 1320, dur: 0.22, type: "square", vol: 0.06 }],
  tick: [{ f: 880, dur: 0.07, vol: 0.16 }, { f: 880, dur: 0.05, vol: 0.06, at: 0.12 }],   // the last three seconds: a double pulse, 120 ms apart
  submit: [{ f: 1150, dur: 0.16, attack: 0.003, vol: 0.16 }],
  reject: [{ noise: true, dur: 0.22, lp: 420, vol: 0.2 }, { f: 150, to: 62, dur: 0.36, vol: 0.22, lp: 700 }],
  correct: [{ f: C5, dur: 0.14, type: "triangle", vol: 0.22 }, { f: G5, dur: 0.28, at: 0.08, type: "triangle", vol: 0.22 }],
  deeper: [{ noise: true, dur: 1.3, lp: 1400, lpTo: 180, vol: 0.16 }, { f: 300, to: 60, dur: 1.3, vol: 0.1 }],   // the descent
  bank: [{ f: 1318, dur: 0.12, type: "triangle", vol: 0.16 }, { f: 1760, dur: 0.3, at: 0.07, type: "triangle", vol: 0.16 }],
  land: [{ f: 140, to: 70, dur: 0.25, vol: 0.28, lp: 600 }, { noise: true, dur: 0.14, lp: 500, vol: 0.1 }],   // a light landing: tourist, lost luggage
  landBig: [{ f: 80, to: 45, dur: 0.6, vol: 0.38 }, { noise: true, dur: 0.7, lp: 900, lpTo: 200, vol: 0.18, at: 0.02 }, { f: C5, dur: 0.4, vol: 0.09, type: "triangle", at: 0.15 }],
  gold: [{ f: 60, to: 40, dur: 1.2, vol: 0.34 }, ...[784, 988, 1175, 1568].map((f, i) => ({ f, dur: 0.7, vol: 0.15, type: "triangle" as const, lp: 3000, at: i * 0.13 })), { noise: true, dur: 1.4, lp: 2500, hp: 1200, vol: 0.05, at: 0.3 }],
  miss: [{ f: 220, to: 52, dur: 0.7, vol: 0.24 }, { noise: true, dur: 0.5, lp: 400, vol: 0.14, at: 0.05 }],
  stamp: [{ f: 140, to: 45, dur: 0.22, vol: 0.5 }, { noise: true, dur: 0.09, vol: 0.25, lp: 1400 }],   // the thud of a rubber stamp
  finale: [...[C5, E5, G5].map((f, i) => ({ f, dur: 0.9, at: 0.05 * i, type: "triangle" as const, vol: 0.11 })), { f: C6, dur: 1.1, at: 0.3, type: "triangle", vol: 0.13 }],
  takeoff: [{ noise: true, dur: 1.6, lp: 300, lpTo: 1800, vol: 0.12 }, { f: 90, to: 150, dur: 1.6, vol: 0.08 }],   // engines spooling up for the next leg
  touchdown: [{ f: 120, to: 60, dur: 0.18, vol: 0.3, lp: 500 }, { noise: true, dur: 0.25, lp: 2500, lpTo: 400, vol: 0.12, at: 0.02 }],   // wheels on the runway
} satisfies Record<string, Voice[]>;
export const MASTER_GAIN = MASTER;
export type Sfx = keyof typeof CUES;
export function sfx(name: Sfx) {
  if (isMuted() || (typeof document !== "undefined" && document.hidden)) return;
  const a = ctx(); if (!a || !out) return;
  try { for (const v of CUES[name] as Voice[]) playVoice(a, out, v); } catch { /* audio unavailable */ }
}

/** Jumps to the top of the page at once (no smooth scroll, which a new screen would fight). */
export const toTop = () => { scrollTo({ top: 0, left: 0, behavior: "instant" }); };

/** Shakes an element briefly: the stamp hitting the desk. */
export function shake(el: Element | null, cls = "jolt") {
  if (!el || reducedMotion()) return;
  el.classList.remove(cls); void (el as HTMLElement).offsetWidth; el.classList.add(cls);
}
