import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatDuration } from "@/lib/format";
import {
  buildFocusPlan,
  countWorkBlocks,
  MAX_GOAL_SECONDS,
  totalElapsedSeconds,
} from "@/lib/plan";
import { unlockAudio } from "@/lib/sound";
import { getSettings, getTimerState } from "@/lib/storage";
import { useTimer } from "@/hooks/useTimer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focus — Travaille par blocs, garde la trace" },
      {
        name: "description",
        content:
          "Choisis ta durée de travail, enchaîne des blocs de focus et de pause, et note ce que tu as accompli dans un journal quotidien 100 % local.",
      },
      { property: "og:title", content: "Focus — Travaille par blocs, garde la trace" },
      {
        property: "og:description",
        content: "Timer par blocs de 30 minutes et journal de travail quotidien, hors ligne.",
      },
    ],
  }),
  component: Home,
});

const PRESETS = [30, 60, 90, 120, 180];

function Home() {
  const navigate = useNavigate();
  const { start } = useTimer();
  const [goalMinutes, setGoalMinutes] = useState(60);
  const [custom, setCustom] = useState(false);
  const [customH, setCustomH] = useState(1);
  const [customM, setCustomM] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(30);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [hasRunning, setHasRunning] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    setFocusMinutes(settings.defaultFocusMinutes);
    setBreakMinutes(settings.defaultBreakMinutes);
    const stored = getTimerState();
    setHasRunning(!!stored && stored.state !== "COMPLETED");
  }, []);

  const effectiveMinutes = custom ? customH * 60 + customM : goalMinutes;
  const goalSeconds = Math.min(effectiveMinutes * 60, MAX_GOAL_SECONDS);
  const plan = useMemo(
    () => buildFocusPlan(goalSeconds, focusMinutes * 60, breakMinutes * 60),
    [goalSeconds, focusMinutes, breakMinutes],
  );
  const canStart = goalSeconds >= 60;

  const handleStart = () => {
    if (!canStart) return;
    unlockAudio();
    start(goalSeconds, focusMinutes * 60, breakMinutes * 60);
    void navigate({ to: "/focus" });
  };

  return (
    <AppShell>
      <div className="rise-in space-y-10">
        {hasRunning && (
          <button
            onClick={() => void navigate({ to: "/focus" })}
            className="w-full rounded-full border border-accent/40 bg-accent/10 px-5 py-3 text-sm text-foreground transition-colors hover:bg-accent/15"
          >
            Une session est en cours — reprendre
          </button>
        )}

        <div className="text-center">
          <p className="label-caps text-muted-foreground">Focus</p>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Combien de temps veux-tu travailler ?
          </h1>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {PRESETS.map((minutes) => {
              const selected = !custom && goalMinutes === minutes;
              return (
                <button
                  key={minutes}
                  onClick={() => {
                    setCustom(false);
                    setGoalMinutes(minutes);
                  }}
                  aria-pressed={selected}
                  className={`min-h-14 rounded-xl border text-[0.95rem] transition-all ${
                    selected
                      ? "border-foreground bg-primary text-primary-foreground"
                      : "border-border bg-surface hover:border-foreground/30"
                  }`}
                >
                  {formatDuration(minutes * 60)}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCustom((v) => !v)}
            aria-expanded={custom}
            className={`mt-3 min-h-11 w-full rounded-xl border text-sm transition-colors ${
              custom ? "border-foreground bg-secondary" : "border-border hover:border-foreground/30"
            }`}
          >
            Personnalisé
          </button>

          {custom && (
            <div className="rise-in mt-3 flex items-end justify-center gap-4 rounded-xl border border-border bg-surface px-5 py-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Heures</span>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={customH}
                  onChange={(e) => setCustomH(Math.max(0, Math.min(12, Number(e.target.value))))}
                  className="min-h-11 w-24 rounded-lg border border-input bg-background px-3 text-center"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Minutes</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={customM}
                  onChange={(e) => setCustomM(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="min-h-11 w-24 rounded-lg border border-input bg-background px-3 text-center"
                />
              </label>
            </div>
          )}
        </div>

        <section className="surface-card px-5 py-5" aria-labelledby="plan-title">
          <h2 id="plan-title" className="label-caps text-muted-foreground">
            Ton plan
          </h2>
          {plan.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Choisis au moins 1 minute de travail pour démarrer.
            </p>
          ) : (
            <>
              <ol className="mt-4 flex flex-wrap gap-2">
                {plan.map((block, i) => (
                  <li
                    key={i}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      block.type === "WORK"
                        ? "border-accent/35 bg-accent/10"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    <span className="label-caps mr-2">
                      {block.type === "WORK" ? "Focus" : "Pause"}
                    </span>
                    {formatDuration(block.seconds)}
                  </li>
                ))}
              </ol>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Total de travail</dt>
                  <dd className="mt-1 text-base">{formatDuration(goalSeconds)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Temps réel estimé</dt>
                  <dd className="mt-1 text-base">{formatDuration(totalElapsedSeconds(plan))}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sessions</dt>
                  <dd className="mt-1 text-base">{countWorkBlocks(plan)}</dd>
                </div>
              </dl>
            </>
          )}
        </section>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="min-h-14 w-full rounded-full bg-primary text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Commencer une session
        </button>
      </div>
    </AppShell>
  );
}
