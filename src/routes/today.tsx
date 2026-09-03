import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DayJournalView } from "@/components/DayJournalView";
import { toDateKey } from "@/lib/storage";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Ma journée — Focus" },
      {
        name: "description",
        content: "Le journal de ta journée : temps travaillé, sessions et comptes rendus.",
      },
      { property: "og:title", content: "Ma journée — Focus" },
      {
        property: "og:description",
        content: "Retrouve chaque session de travail et ce que tu y as accompli.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => setDate(toDateKey()), []);

  return (
    <AppShell>
      {date ? (
        <DayJournalView date={date} />
      ) : (
        <p className="py-20 text-center text-sm text-muted-foreground">Chargement…</p>
      )}
    </AppShell>
  );
}
