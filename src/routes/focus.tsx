import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useTimer } from "@/hooks/useTimer";
import { formatClock, formatDuration } from "@/lib/format";
import { unlockAudio } from "@/lib/sound";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "Session de focus — Focus" },
      {
        name: "description",
        content: "Ton bloc de travail en cours, avec pause automatique et compte rendu de session.",
      },
      { property: "og:title", content: "Session de focus — Focus" },
      {
        property: "og:description",
        content: "Timer par blocs, pauses automatiques et compte rendu après chaque session.",
      },
    ],
  }),
  component: FocusPage,
});

function FocusPage() {
  const navigate = useNavigate();
  const { state, hydrated, remainingSeconds, liveWorkSeconds, submitLog, setDraftNote, skipBreak, reset } =
    useTimer();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (state?.state === "AWAITING_LOG") setNote(state.draftNote ?? "");
  }, [state?.state, state?.currentSessionEndsAt]);

  if (!hydrated) {
    return (
      <AppShell bare>
        <p className="py-20 text-center text-sm text-muted-foreground">Chargement…</p>
      </AppShell>
    );
  }

  if (!state) {
    return (
      <AppShell>
        <div className="surface-card rise-in px-6 py-14 text-center">
          <p className="font-display text-lg">Aucune session en cours.</p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Choisir une durée
          </Link>
        </div>
      </AppShell>
    );
  }

  const progress = Math.min(100, (liveWorkSeconds / state.goalSeconds) * 100);

  return (
    <AppShell bare={state.state === "WORKING" || state.state === "BREAK"}>
      {(state.state === "WORKING" || state.state === "BREAK") && (
        <div className="rise-in flex flex-col items-center gap-8 py-6 text-center sm:py-12">
          <p
            className="label-caps"
            style={{ color: state.state === "WORKING" ? "var(--focus)" : "var(--rest)" }}
          >
            {state.state === "WORKING" ? "Focus" : "Pause"}
          </p>

          <p
            className="timer-digits text-[24vw] sm:text-[9rem]"
            role="timer"
            aria-live="off"
            aria-label={`Temps restant ${formatClock(remainingSeconds)}`}
          >
            {formatClock(remainingSeconds)}
          </p>

          {state.state === "WORKING" ? (
            <p className="text-sm text-muted-foreground">
              Session {state.sessionNumber} / {state.totalSessions} · Objectif{" "}
              {formatDuration(state.goalSeconds)}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profite de ces quelques minutes.</p>
              <p className="text-sm text-muted-foreground">
                Prochaine session : {formatDuration(state.blocks[state.blockIndex + 1]?.seconds ?? 0)}
              </p>
            </div>
          )}

          <div className="w-full max-w-md space-y-2">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label="Progression de l'objectif"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor(liveWorkSeconds / 60)} / {Math.round(state.goalSeconds / 60)} min de
              travail
            </p>
          </div>

          <div className="flex gap-3">
            {state.state === "BREAK" && (
              <button
                onClick={() => {
                  unlockAudio();
                  skipBreak();
                }}
                className="min-h-11 rounded-full border border-border px-5 text-sm transition-colors hover:bg-secondary"
              >
                Passer la pause
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("Abandonner la session en cours ?")) {
                  reset();
                  void navigate({ to: "/" });
                }
              }}
              className="min-h-11 rounded-full px-5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Arrêter
            </button>
          </div>
        </div>
      )}

      {state.state === "AWAITING_LOG" && (
        <form
          className="rise-in space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            unlockAudio();
            submitLog(note);
            setNote("");
          }}
        >
          <div className="text-center">
            <p className="label-caps text-muted-foreground">Session terminée</p>
            <h1 className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Qu'as-tu fait pendant ces {formatDuration(state.currentSessionDurationSeconds)} ?
            </h1>
          </div>
          <label htmlFor="session-note" className="sr-only">
            Compte rendu de la session
          </label>
          <textarea
            id="session-note"
            autoFocus
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setDraftNote(e.target.value);
            }}
            rows={7}
            placeholder="Écris ce que tu as accompli pendant cette session…"
            className="w-full resize-y rounded-2xl border border-input bg-surface p-4 text-[0.95rem] leading-relaxed shadow-[var(--shadow-soft)] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="min-h-14 w-full rounded-full bg-primary text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Enregistrer
          </button>
          <p className="text-center text-xs text-muted-foreground">
            La pause démarrera après l'enregistrement.
          </p>
        </form>
      )}

      {state.state === "COMPLETED" && (
        <div className="rise-in surface-card px-6 py-14 text-center">
          <p className="label-caps text-muted-foreground">Travail terminé</p>
          <p className="mt-4 font-display text-4xl font-medium tracking-tight">
            {formatDuration(state.goalSeconds)} de focus
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {state.totalSessions} session{state.totalSessions > 1 ? "s" : ""}
          </p>
          <p className="mt-6 text-[0.95rem]">Beau travail. Prends une vraie pause maintenant.</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/today"
              onClick={() => reset()}
              className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
            >
              Voir ma journée
            </Link>
            <button
              onClick={() => {
                reset();
                void navigate({ to: "/" });
              }}
              className="min-h-11 text-sm text-muted-foreground hover:text-foreground"
            >
              Nouvelle session
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
