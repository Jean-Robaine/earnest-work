import type { DayJournal, ExportPayload, Session, Settings, TimerState } from "@/types";

const KEYS = {
  journals: "focus.journals.v1",
  timer: "focus.timer.v1",
  settings: "focus.settings.v1",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  soundKind: "soft",
  volume: 0.5,
  notificationsEnabled: false,
  defaultFocusMinutes: 30,
  defaultBreakMinutes: 5,
};

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------------- journals ---------------- */

type JournalMap = Record<string, DayJournal>;

function readJournals(): JournalMap {
  return read<JournalMap>(KEYS.journals, {});
}

export function getAllJournals(): DayJournal[] {
  return Object.values(readJournals()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getJournal(date: string): DayJournal {
  return readJournals()[date] ?? { date, totalFocusedSeconds: 0, sessions: [] };
}

export function getTodayJournal(): DayJournal {
  return getJournal(toDateKey());
}

export function saveSession(session: Session): DayJournal {
  const journals = readJournals();
  const current = journals[session.date] ?? {
    date: session.date,
    totalFocusedSeconds: 0,
    sessions: [],
  };
  const sessions = [...current.sessions.filter((s) => s.id !== session.id), session].sort((a, b) =>
    a.startedAt < b.startedAt ? -1 : 1,
  );
  const updated: DayJournal = {
    date: session.date,
    sessions,
    totalFocusedSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
  };
  journals[session.date] = updated;
  write(KEYS.journals, journals);
  return updated;
}

/* ---------------- timer state ---------------- */

export function saveTimerState(state: TimerState) {
  write(KEYS.timer, state);
}

export function getTimerState(): TimerState | null {
  return read<TimerState | null>(KEYS.timer, null);
}

export function clearTimerState() {
  if (isBrowser()) window.localStorage.removeItem(KEYS.timer);
}

/* ---------------- settings ---------------- */

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}

export function saveSettings(settings: Settings) {
  write(KEYS.settings, settings);
}

/* ---------------- data management ---------------- */

export function exportData(): ExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    journals: getAllJournals(),
    settings: getSettings(),
  };
}

export function importData(raw: unknown): { imported: number } {
  const payload = raw as Partial<ExportPayload>;
  if (!payload || !Array.isArray(payload.journals)) {
    throw new Error("Fichier invalide : aucune journée trouvée.");
  }
  const journals = readJournals();
  let imported = 0;
  for (const day of payload.journals) {
    if (!day?.date || !Array.isArray(day.sessions)) continue;
    const existing = journals[day.date]?.sessions ?? [];
    const merged = [...existing];
    for (const session of day.sessions) {
      if (!session?.id) continue;
      if (!merged.some((s) => s.id === session.id)) {
        merged.push(session);
        imported += 1;
      }
    }
    merged.sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1));
    journals[day.date] = {
      date: day.date,
      sessions: merged,
      totalFocusedSeconds: merged.reduce((sum, s) => sum + (s.durationSeconds || 0), 0),
    };
  }
  write(KEYS.journals, journals);
  if (payload.settings) saveSettings({ ...DEFAULT_SETTINGS, ...payload.settings });
  return { imported };
}

export function clearAllData() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEYS.journals);
  window.localStorage.removeItem(KEYS.timer);
  window.localStorage.removeItem(KEYS.settings);
}
