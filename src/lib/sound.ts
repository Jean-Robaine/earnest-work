import type { SoundKind } from "@/types";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Must be called from a user gesture to satisfy browser autoplay policies. */
export function unlockAudio() {
  const audio = getContext();
  if (audio && audio.state === "suspended") void audio.resume();
}

type Tone = { freq: number; delay: number; duration: number; type: OscillatorType };

const RECIPES: Record<SoundKind, Tone[]> = {
  ding: [{ freq: 880, delay: 0, duration: 0.7, type: "sine" }],
  bell: [
    { freq: 660, delay: 0, duration: 1.1, type: "sine" },
    { freq: 990, delay: 0.02, duration: 0.9, type: "sine" },
  ],
  soft: [
    { freq: 523.25, delay: 0, duration: 0.8, type: "sine" },
    { freq: 783.99, delay: 0.16, duration: 0.9, type: "sine" },
  ],
};

export function playChime(kind: SoundKind, volume: number) {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  const now = audio.currentTime;
  const gainLevel = Math.max(0, Math.min(1, volume)) * 0.3;

  for (const tone of RECIPES[kind] ?? RECIPES.soft) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = tone.type;
    osc.frequency.value = tone.freq;
    const start = now + tone.delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainLevel), start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + tone.duration + 0.05);
  }
}

export function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, silent: true });
  } catch {
    /* ignore */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}
