export type TimerPhase = "IDLE" | "WORKING" | "AWAITING_LOG" | "BREAK" | "COMPLETED";

export type BlockType = "WORK" | "BREAK";

export type PlanBlock = {
  type: BlockType;
  seconds: number;
};

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  note: string;
};

export type DayJournal = {
  date: string;
  totalFocusedSeconds: number;
  sessions: Session[];
};

export type TimerState = {
  state: TimerPhase;
  goalSeconds: number;
  focusSeconds: number;
  breakSeconds: number;
  blocks: PlanBlock[];
  blockIndex: number;
  completedWorkSeconds: number;
  currentSessionDurationSeconds: number;
  currentSessionStartedAt: string | null;
  currentSessionEndsAt: string | null;
  sessionNumber: number;
  totalSessions: number;
  draftNote: string;
};

export type SoundKind = "ding" | "bell" | "soft";

export type Settings = {
  soundEnabled: boolean;
  soundKind: SoundKind;
  volume: number; // 0..1
  notificationsEnabled: boolean;
  defaultFocusMinutes: number;
  defaultBreakMinutes: number;
};

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  journals: DayJournal[];
  settings: Settings;
};
