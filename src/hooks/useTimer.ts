import { useCallback, useEffect, useRef, useState } from "react";
import { buildFocusPlan, countWorkBlocks } from "@/lib/plan";
import { notify, playChime } from "@/lib/sound";
import {
  clearTimerState,
  getSettings,
  getTimerState,
  saveSession,
  saveTimerState,
  toDateKey,
} from "@/lib/storage";
import type { PlanBlock, Session, TimerState } from "@/types";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function chime(reason: "work" | "break") {
  const settings = getSettings();
  if (settings.soundEnabled) playChime(settings.soundKind, settings.volume);
  if (settings.notificationsEnabled) {
    if (reason === "work") notify("Session terminée", "Note ce que tu as accompli.");
    else notify("Pause terminée", "On repart pour une session de focus.");
  }
}

function startBlock(state: TimerState, index: number, from: Date): TimerState {
  const block = state.blocks[index];
  const startedAt = from.toISOString();
  const endsAt = new Date(from.getTime() + block.seconds * 1000).toISOString();
  return {
    ...state,
    state: block.type === "WORK" ? "WORKING" : "BREAK",
    blockIndex: index,
    currentSessionDurationSeconds: block.seconds,
    currentSessionStartedAt: startedAt,
    currentSessionEndsAt: endsAt,
    sessionNumber:
      block.type === "WORK"
        ? countWorkBlocks(state.blocks.slice(0, index + 1))
        : state.sessionNumber,
    draftNote: "",
  };
}

/** Advance the state machine as far as elapsed time requires. */
function reconcile(state: TimerState, now: number): { next: TimerState; fired: Array<"work" | "break"> } {
  let current = state;
  const fired: Array<"work" | "break"> = [];
  let guard = 0;

  while (guard++ < 100) {
    if (current.state !== "WORKING" && current.state !== "BREAK") break;
    const endsAt = current.currentSessionEndsAt ? Date.parse(current.currentSessionEndsAt) : null;
    if (endsAt === null || now < endsAt) break;

    if (current.state === "WORKING") {
      fired.push("work");
      current = { ...current, state: "AWAITING_LOG" };
      break; // waits for the user's log before continuing
    }

    // BREAK finished -> start the next work block from now
    fired.push("break");
    const nextIndex = current.blockIndex + 1;
    if (nextIndex >= current.blocks.length) {
      current = { ...current, state: "COMPLETED" };
      break;
    }
    current = startBlock(current, nextIndex, new Date(now));
  }

  return { next: current, fired };
}

export function useTimer() {
  const [state, setState] = useState<TimerState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  const commit = useCallback((next: TimerState | null) => {
    setState(next);
    if (next) saveTimerState(next);
    else clearTimerState();
  }, []);

  // hydrate + reconcile on mount
  useEffect(() => {
    const stored = getTimerState();
    if (stored) {
      const { next } = reconcile(stored, Date.now());
      setState(next);
      saveTimerState(next);
    }
    setHydrated(true);
  }, []);

  // ticking clock
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // state machine transitions driven by timestamps
  useEffect(() => {
    if (!state) return;
    if (state.state !== "WORKING" && state.state !== "BREAK") return;
    const { next, fired } = reconcile(state, now);
    if (next === state) return;
    if (fired.length && !firedRef.current) {
      firedRef.current = true;
      chime(fired[fired.length - 1]);
      window.setTimeout(() => {
        firedRef.current = false;
      }, 1000);
    }
    commit(next);
  }, [now, state, commit]);

  const start = useCallback(
    (goalSeconds: number, focusSeconds: number, breakSeconds: number) => {
      const blocks: PlanBlock[] = buildFocusPlan(goalSeconds, focusSeconds, breakSeconds);
      if (!blocks.length) return;
      const base: TimerState = {
        state: "IDLE",
        goalSeconds,
        focusSeconds,
        breakSeconds,
        blocks,
        blockIndex: 0,
        completedWorkSeconds: 0,
        currentSessionDurationSeconds: blocks[0].seconds,
        currentSessionStartedAt: null,
        currentSessionEndsAt: null,
        sessionNumber: 1,
        totalSessions: countWorkBlocks(blocks),
        draftNote: "",
      };
      commit(startBlock(base, 0, new Date()));
    },
    [commit],
  );

  const setDraftNote = useCallback(
    (note: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, draftNote: note };
        saveTimerState(next);
        return next;
      });
    },
    [],
  );

  const submitLog = useCallback(
    (note: string) => {
      if (!state || state.state !== "AWAITING_LOG") return;
      const endedAtIso = state.currentSessionEndsAt ?? new Date().toISOString();
      const startedAtIso =
        state.currentSessionStartedAt ??
        new Date(Date.parse(endedAtIso) - state.currentSessionDurationSeconds * 1000).toISOString();

      const session: Session = {
        id: makeId(),
        date: toDateKey(new Date(startedAtIso)),
        startedAt: startedAtIso,
        endedAt: endedAtIso,
        durationSeconds: state.currentSessionDurationSeconds,
        note: note.trim(),
      };
      saveSession(session);

      const completed = state.completedWorkSeconds + state.currentSessionDurationSeconds;
      const nextIndex = state.blockIndex + 1;
      const base = { ...state, completedWorkSeconds: completed, draftNote: "" };

      if (nextIndex >= state.blocks.length) {
        commit({ ...base, state: "COMPLETED", currentSessionEndsAt: null });
        return;
      }
      commit(startBlock(base, nextIndex, new Date()));
    },
    [state, commit],
  );

  const skipBreak = useCallback(() => {
    if (!state || state.state !== "BREAK") return;
    const nextIndex = state.blockIndex + 1;
    if (nextIndex >= state.blocks.length) {
      commit({ ...state, state: "COMPLETED", currentSessionEndsAt: null });
      return;
    }
    commit(startBlock(state, nextIndex, new Date()));
  }, [state, commit]);

  const reset = useCallback(() => commit(null), [commit]);

  const endsAt = state?.currentSessionEndsAt ? Date.parse(state.currentSessionEndsAt) : null;
  const remainingSeconds =
    endsAt && (state?.state === "WORKING" || state?.state === "BREAK")
      ? Math.max(0, (endsAt - now) / 1000)
      : 0;

  const liveWorkSeconds =
    state?.state === "WORKING"
      ? state.completedWorkSeconds + (state.currentSessionDurationSeconds - remainingSeconds)
      : (state?.completedWorkSeconds ?? 0);

  return {
    state,
    hydrated,
    remainingSeconds,
    liveWorkSeconds,
    start,
    submitLog,
    setDraftNote,
    skipBreak,
    reset,
  };
}
