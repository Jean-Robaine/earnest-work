import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDateKey, formatDuration, formatTime, shiftDateKey } from "@/lib/format";
import { getJournal, toDateKey } from "@/lib/storage";
import type { DayJournal } from "@/types";

export function DayJournalView({ date }: { date: string }) {
  const [journal, setJournal] = useState<DayJournal | null>(null);
  const today = toDateKey();

  useEffect(() => {
    setJournal(getJournal(date));
  }, [date]);

  const sessions = journal?.sessions ?? [];

  return (
    <div className="rise-in space-y-8">
      <nav
        className="flex items-center justify-between gap-3"
        aria-label="Navigation entre les journées"
      >
        <Link
          to="/day/$date"
          params={{ date: shiftDateKey(date, -1) }}
          className="flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Jour précédent</span>
          <span className="sm:hidden">Préc.</span>
        </Link>
        <h1 className="text-center font-display text-lg font-medium tracking-tight sm:text-xl">
          {date === today ? "Aujourd'hui" : formatDateKey(date)}
        </h1>
        <Link
          to="/day/$date"
          params={{ date: shiftDateKey(date, 1) }}
          className="flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <span className="hidden sm:inline">Jour suivant</span>
          <span className="sm:hidden">Suiv.</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </nav>

      <p className="text-center text-sm text-muted-foreground">{formatDateKey(date)}</p>

      {date !== today && (
        <div className="flex justify-center">
          <Link
            to="/today"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm transition-colors hover:bg-secondary"
          >
            Aujourd'hui
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="surface-card px-5 py-4">
          <p className="label-caps text-muted-foreground">Temps travaillé</p>
          <p className="mt-1 text-2xl font-light tracking-tight">
            {formatDuration(journal?.totalFocusedSeconds ?? 0)}
          </p>
        </div>
        <div className="surface-card px-5 py-4">
          <p className="label-caps text-muted-foreground">Sessions</p>
          <p className="mt-1 text-2xl font-light tracking-tight">{sessions.length}</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="surface-card px-6 py-12 text-center">
          <p className="font-display text-lg">
            {date === today ? "Ta journée est encore vide." : "Rien enregistré pour cette journée."}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Lance une session pour commencer à construire ton historique.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Commencer à travailler
          </Link>
        </div>
      ) : (
        <ol className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id} className="surface-card px-5 py-4">
              <p className="label-caps text-muted-foreground">
                {formatTime(session.startedAt)} — {formatTime(session.endedAt)}
                <span className="ml-2 normal-case tracking-normal">
                  · {formatDuration(session.durationSeconds)}
                </span>
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-relaxed">
                {session.note || (
                  <span className="text-muted-foreground">Aucune note pour cette session.</span>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
