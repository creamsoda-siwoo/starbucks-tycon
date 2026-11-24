// WebAudio로 만든 짧은 효과음 (외부 파일 없음)
let AC = null;
let muted = false;

export function setMuted(v) { muted = v; }

function tone(f, d = 0.09, type = 'sine', v = 0.05, delay = 0) {
  if (muted || typeof window === 'undefined') return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime + delay;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* 소리 없이 계속 */ }
}

export const sfx = {
  add: () => tone(520 + Math.random() * 120, 0.06, 'triangle', 0.04),
  ok: () => { tone(660, 0.1, 'sine', 0.06); tone(880, 0.12, 'sine', 0.06, 0.09); tone(1320, 0.15, 'sine', 0.05, 0.18); },
  bad: () => tone(200, 0.18, 'sawtooth', 0.04),
  bell: () => tone(1046, 0.25, 'sine', 0.04),
  leave: () => { tone(300, 0.12, 'square', 0.03); tone(220, 0.18, 'square', 0.03, 0.1); },
  ding: () => tone(880, 0.05, 'sine', 0.02),
  partner: () => tone(740, 0.08, 'triangle', 0.04),
};
