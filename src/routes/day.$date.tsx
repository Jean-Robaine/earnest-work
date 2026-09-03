import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DayJournalView } from "@/components/DayJournalView";

export const Route = createFileRoute("/day/$date")({
  head: () => ({
    meta: [
      { title: "Journal d'une journée — Focus" },
      {
        name: "description",
        content: "Consulte les sessions de travail et les comptes rendus d'une journée précise.",
      },
      { property: "og:title", content: "Journal d'une journée — Focus" },
      {
        property: "og:description",
        content: "Navigue jour par jour dans ton historique de sessions de focus.",
      },
    ],
  }),
  component: DayPage,
});

function DayPage() {
  const { date } = Route.useParams();
  return (
    <AppShell>
      <DayJournalView date={date} />
    </AppShell>
  );
}
