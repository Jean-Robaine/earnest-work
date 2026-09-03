import { Link } from "@tanstack/react-router";
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
    <div className="rise-in">
      <header>
        <h1 className="font-display text-3xl font-normal tracking-tight sm:text-4xl">
          {date === today ? "Aujourd'hui" : formatDateKey(date)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDuration(journal?.totalFocusedSeconds ?? 0)} de focus
          {sessions.length > 0 && ` · ${sessions.length} session${sessions.length > 1 ? "s" : ""}`}
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="mt-16">
          <p className="text-[0.95rem] text-muted-foreground">
            {date === today ? "Rien encore aujourd'hui." : "Rien enregistré ce jour-là."}
          </p>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4">
            Commencer à travailler
          </Link>
        </div>
      ) : (
        <ol className="mt-12 space-y-10">
          {sessions.map((session) => (
            <li key={session.id}>
              <p className="text-sm text-muted-foreground">
                {formatTime(session.startedAt)} — {formatTime(session.endedAt)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[1.05rem] leading-relaxed">
                {session.note || <span className="text-muted-foreground">Aucune note.</span>}
              </p>
            </li>
          ))}
        </ol>
      )}

      <nav
        className="mt-20 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground"
        aria-label="Navigation entre les journées"
      >
        <Link
          to="/day/$date"
          params={{ date: shiftDateKey(date, -1) }}
          className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
        >
          Veille
        </Link>
        {date !== today && (
          <Link to="/today" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">
            Aujourd'hui
          </Link>
        )}
        <Link
          to="/day/$date"
          params={{ date: shiftDateKey(date, 1) }}
          className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
        >
          Lendemain
        </Link>
      </nav>
    </div>
  );
}
