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
        <p className="py-24 text-center text-sm text-muted-foreground">Chargement…</p>
      </AppShell>
    );
  }

  if (!state) {
    return (
      <AppShell>
        <div className="rise-in py-20 text-center">
          <p className="text-[0.95rem] text-muted-foreground">Aucune session en cours.</p>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4">
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
        <div className="rise-in flex min-h-[70dvh] flex-col items-center justify-center text-center">
          <p className="label-caps text-muted-foreground">
            {state.state === "WORKING" ? "Focus" : "Pause"}
          </p>

          <p
            className="timer-digits mt-8 text-[19vw] sm:text-[7.5rem] lg:text-[8.5rem]"
            role="timer"
            aria-live="off"
            aria-label={`Temps restant ${formatClock(remainingSeconds)}`}
          >
            {formatClock(remainingSeconds)}
          </p>

          <p className="mt-8 text-sm text-muted-foreground">
            {state.state === "WORKING"
              ? `Session ${state.sessionNumber} / ${state.totalSessions}`
              : "Souffle un peu."}
          </p>

          <div
            className="mt-10 h-px w-full max-w-xs bg-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Progression de l'objectif"
          >
            <div
              className="h-px bg-foreground/50 transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-14 flex items-center gap-8">
            {state.state === "BREAK" && (
              <button
                onClick={() => {
                  unlockAudio();
                  skipBreak();
                }}
                className="min-h-11 text-sm transition-colors hover:text-foreground"
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
              className="min-h-11 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      {state.state === "AWAITING_LOG" && (
        <form
          className="rise-in mx-auto max-w-lg py-6"
          onSubmit={(e) => {
            e.preventDefault();
            unlockAudio();
            submitLog(note);
            setNote("");
          }}
        >
          <p className="text-sm text-muted-foreground">
            Session terminée · {formatDuration(state.currentSessionDurationSeconds)}
          </p>
          <h1 className="mt-3 font-display text-2xl font-normal tracking-tight sm:text-3xl">
            Qu'as-tu fait ?
          </h1>
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
            rows={8}
            placeholder="Écris ce que tu as accompli…"
            className="mt-8 w-full resize-y border-0 border-b border-border bg-transparent pb-3 text-[1.05rem] leading-relaxed outline-none placeholder:text-muted-foreground focus:border-foreground"
          />
          <button
            type="submit"
            className="mt-10 min-h-12 rounded-md bg-primary px-10 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Enregistrer
          </button>
        </form>
      )}

      {state.state === "COMPLETED" && (
        <div className="rise-in flex min-h-[60dvh] flex-col items-center justify-center text-center">
          <p className="label-caps text-muted-foreground">Terminé</p>
          <p className="timer-digits mt-8 text-5xl sm:text-6xl">
            {formatDuration(state.goalSeconds)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {state.totalSessions} session{state.totalSessions > 1 ? "s" : ""} de focus
          </p>
          <div className="mt-14 flex items-center gap-8">
            <Link
              to="/today"
              onClick={() => reset()}
              className="inline-flex min-h-12 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground"
            >
              Voir mon journal
            </Link>
            <button
              onClick={() => {
                reset();
                void navigate({ to: "/" });
              }}
              className="min-h-11 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Nouvelle session
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
