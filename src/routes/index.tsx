import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatDuration } from "@/lib/format";
import { buildFocusPlan, countWorkBlocks, MAX_GOAL_SECONDS } from "@/lib/plan";
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
      <div className="rise-in mx-auto flex max-w-md flex-col items-center py-10 text-center sm:py-20">
        {hasRunning && (
          <button
            onClick={() => void navigate({ to: "/focus" })}
            className="mb-12 min-h-11 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Reprendre la session en cours
          </button>
        )}

        <h1 className="text-balance font-display text-2xl font-normal tracking-tight sm:text-3xl">
          Combien de temps veux-tu travailler ?
        </h1>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
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
                className={`min-h-11 text-lg transition-colors ${
                  selected
                    ? "text-foreground underline underline-offset-8"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {formatDuration(minutes * 60)}
              </button>
            );
          })}
          <button
            onClick={() => setCustom((v) => !v)}
            aria-expanded={custom}
            aria-pressed={custom}
            className={`min-h-11 text-lg transition-colors ${
              custom ? "text-foreground underline underline-offset-8" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Autre
          </button>
        </div>

        {custom && (
          <div className="rise-in mt-8 flex items-end justify-center gap-6">
            <label className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
              Heures
              <input
                type="number"
                min={0}
                max={12}
                value={customH}
                onChange={(e) => setCustomH(Math.max(0, Math.min(12, Number(e.target.value))))}
                className="min-h-11 w-20 border-b border-input bg-transparent text-center text-lg text-foreground outline-none"
              />
            </label>
            <label className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
              Minutes
              <input
                type="number"
                min={0}
                max={59}
                step={5}
                value={customM}
                onChange={(e) => setCustomM(Math.max(0, Math.min(59, Number(e.target.value))))}
                className="min-h-11 w-20 border-b border-input bg-transparent text-center text-lg text-foreground outline-none"
              />
            </label>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="mt-16 min-h-12 rounded-md bg-primary px-10 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Commencer
        </button>

        <p className="mt-6 text-sm text-muted-foreground">
          {countWorkBlocks(plan) > 0
            ? `${countWorkBlocks(plan)} session${countWorkBlocks(plan) > 1 ? "s" : ""} de ${focusMinutes} min · pauses de ${breakMinutes} min`
            : "Choisis au moins 1 minute."}
        </p>
      </div>
    </AppShell>
  );
}
