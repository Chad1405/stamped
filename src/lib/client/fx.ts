// Game feel: synthesized sound effects (Web Audio, no files, the way Krillion does it), a confetti burst, and a screen shake.
const MUTE_KEY = "stamped:muted";
let ac: AudioContext | null = null, out: GainNode | null = null;

export const reducedMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export function isMuted() { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } }
export function setMuted(m: boolean) { try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch { /* storage blocked: mute lasts this page */ } if (out) out.gain.value = m ? 0 : 0.6; }

function ctx() {
  if (typeof window === "undefined") return null;
  if (!ac) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); out = ac.createGain(); out.gain.value = isMuted() ? 0 : 0.6; out.connect(ac.destination); } catch { ac = null; return null; }
  }
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

type Tone = { f: number; to?: number; dur: number; at?: number; type?: OscillatorType; peak?: number };
function tone({ f, to, dur, at = 0, type = "sine", peak = 0.25 }: Tone) {
  const a = ctx(); if (!a || !out) return;
  const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.02);
}
function noise({ dur, at = 0, peak = 0.2, lp = 1800, to }: { dur: number; at?: number; peak?: number; lp?: number; to?: number }) {
  const a = ctx(); if (!a || !out) return;
  const t = a.currentTime + at, buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = "lowpass"; f.frequency.setValueAtTime(lp, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out); src.start(t);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
const SOUNDS = {
  board: () => { tone({ f: G5, dur: 0.35, type: "triangle", peak: 0.18 }); tone({ f: E5, dur: 0.5, at: 0.16, type: "triangle", peak: 0.18 }); }, // airport chime, high-low
  count: () => tone({ f: 880, dur: 0.09, type: "square", peak: 0.05 }),
  go: () => tone({ f: 1320, dur: 0.22, type: "square", peak: 0.06 }),
  tick: () => tone({ f: 1500, dur: 0.04, type: "square", peak: 0.04 }),
  reject: () => { tone({ f: 180, to: 120, dur: 0.22, type: "sawtooth", peak: 0.09 }); noise({ dur: 0.12, peak: 0.05, lp: 900 }); },
  correct: () => { tone({ f: C5, dur: 0.14, type: "triangle" }); tone({ f: G5, dur: 0.28, at: 0.08, type: "triangle" }); },
  deeper: () => noise({ dur: 0.7, peak: 0.16, lp: 3200, to: 300 }), // descent whoosh
  bank: () => { tone({ f: 1318, dur: 0.12, type: "triangle", peak: 0.16 }); tone({ f: 1760, dur: 0.3, at: 0.07, type: "triangle", peak: 0.16 }); },
  stamp: () => { tone({ f: 140, to: 45, dur: 0.22, peak: 0.5 }); noise({ dur: 0.09, peak: 0.25, lp: 1400 }); }, // the thud of a rubber stamp
  miss: () => { tone({ f: 392, to: 330, dur: 0.2, type: "triangle", peak: 0.14 }); tone({ f: 330, to: 262, dur: 0.35, at: 0.18, type: "triangle", peak: 0.14 }); },
  top: () => [C5, E5, G5, C6].forEach((f, i) => tone({ f, dur: 0.4, at: i * 0.09, type: "triangle", peak: 0.16 })),
  finale: () => { [C5, E5, G5].forEach((f, i) => tone({ f, dur: 0.9, at: 0.05 * i, type: "triangle", peak: 0.11 })); tone({ f: C6, dur: 1.1, at: 0.3, type: "triangle", peak: 0.13 }); },
};
export type Sfx = keyof typeof SOUNDS;
export function sfx(name: Sfx) { if (!isMuted()) try { SOUNDS[name](); } catch { /* audio unavailable */ } }

/** Shakes an element briefly: the stamp hitting the desk. */
export function shake(el: Element | null, cls = "jolt") {
  if (!el || reducedMotion()) return;
  el.classList.remove(cls); void (el as HTMLElement).offsetWidth; el.classList.add(cls);
}

/** A short burst of paper confetti in the palette, from a point on screen (defaults to the top centre). */
export function confetti(origin?: { x: number; y: number }, count = 120) {
  if (typeof document === "undefined" || reducedMotion()) return;
  const cs = getComputedStyle(document.documentElement), colors = ["--pal-teal", "--pal-leather", "--color-accent-2", "--pal-stone"].map(v => cs.getPropertyValue(v).trim() || "#245F73");
  const c = document.createElement("canvas"), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; c.setAttribute("aria-hidden", "true");
  Object.assign(c.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "700" });
  document.body.appendChild(c);
  const g = c.getContext("2d")!; g.scale(dpr, dpr);
  const o = origin ?? { x: W / 2, y: H * 0.3 };
  const bits = Array.from({ length: count }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 6 + Math.random() * 9;
    return { x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: colors[(Math.random() * colors.length) | 0] };
  });
  const t0 = performance.now();
  const step = (now: number) => {
    const k = (now - t0) / 1800;
    g.clearRect(0, 0, W, H); g.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4);
    for (const b of bits) {
      b.vx *= 0.985; b.vy = b.vy * 0.985 + 0.32; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.scale(1, Math.cos(b.r * 2)); g.fillStyle = b.col; g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.restore();
    }
    if (k < 1) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
}
