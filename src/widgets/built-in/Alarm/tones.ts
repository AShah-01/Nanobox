import type { AlarmSound } from "../../../storage/alarms";

let ctx: AudioContext | null = null;
const getCtx = () => (ctx ??= new AudioContext());

/** Synthesized alarm tones via Web Audio — no bundled audio assets needed. */
export function playTone(sound: AlarmSound) {
  const audioCtx = getCtx();
  const now = audioCtx.currentTime;

  const patterns: Record<AlarmSound, { freq: number; times: number[]; duration: number }> = {
    chime: { freq: 880, times: [0, 0.3, 0.6], duration: 0.22 },
    beep: { freq: 660, times: [0, 0.18, 0.36], duration: 0.12 },
    digital: { freq: 1200, times: [0, 0.1, 0.2, 0.3], duration: 0.08 },
  };

  const { freq, times, duration } = patterns[sound];
  times.forEach((t, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = sound === "digital" ? "square" : "sine";
    osc.frequency.value = i % 2 === 0 ? freq : freq * 1.25;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.2, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + t);
    osc.stop(now + t + duration + 0.05);
  });
}
