import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { playChime, requestNotificationPermission, unlockAudio } from "@/lib/sound";
import { clearAllData, exportData, importData } from "@/lib/storage";
import type { SoundKind } from "@/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — Focus" },
      {
        name: "description",
        content: "Son de fin de session, durées par défaut, export et import de tes données locales.",
      },
      { property: "og:title", content: "Paramètres — Focus" },
      {
        property: "og:description",
        content: "Personnalise le son, les durées et gère tes données stockées sur cet appareil.",
      },
    ],
  }),
  component: SettingsPage,
});

const SOUNDS: Array<{ value: SoundKind; label: string }> = [
  { value: "ding", label: "Ding" },
  { value: "bell", label: "Bell" },
  { value: "soft", label: "Soft" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card px-5 py-5">
      <h2 className="label-caps text-muted-foreground">{title}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function SettingsPage() {
  const { settings, update } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focus-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const { imported } = importData(JSON.parse(await file.text()));
      setMessage(`${imported} session(s) importée(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    }
  };

  return (
    <AppShell>
      <div className="rise-in space-y-6">
        <h1 className="font-display text-2xl font-medium tracking-tight">Paramètres</h1>

        <Section title="Son">
          <label className="flex min-h-11 items-center justify-between gap-4 text-[0.95rem]">
            <span>Son de fin de session</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => {
                unlockAudio();
                update({ soundEnabled: e.target.checked });
              }}
              className="h-6 w-6 accent-[var(--accent)]"
            />
          </label>

          <div>
            <p className="mb-2 text-[0.95rem]">Type de son</p>
            <div className="flex gap-2">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.value}
                  onClick={() => {
                    unlockAudio();
                    update({ soundKind: sound.value });
                    playChime(sound.value, settings.volume);
                  }}
                  aria-pressed={settings.soundKind === sound.value}
                  className={`min-h-11 flex-1 rounded-xl border text-sm transition-colors ${
                    settings.soundKind === sound.value
                      ? "border-foreground bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[0.95rem]">Volume · {Math.round(settings.volume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
              className="mt-3 w-full accent-[var(--accent)]"
            />
          </label>

          <label className="flex min-h-11 items-center justify-between gap-4 text-[0.95rem]">
            <span>
              Notifications navigateur
              <span className="block text-xs text-muted-foreground">
                Optionnel, selon les permissions de ton navigateur.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={async (e) => {
                if (!e.target.checked) return update({ notificationsEnabled: false });
                const granted = await requestNotificationPermission();
                update({ notificationsEnabled: granted });
                if (!granted) setMessage("Notifications refusées par le navigateur.");
              }}
              className="h-6 w-6 accent-[var(--accent)]"
            />
          </label>
        </Section>

        <Section title="Préférences">
          <label className="flex min-h-11 items-center justify-between gap-4 text-[0.95rem]">
            <span>Durée de focus par défaut (min)</span>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.defaultFocusMinutes}
              onChange={(e) =>
                update({ defaultFocusMinutes: Math.max(5, Math.min(120, Number(e.target.value))) })
              }
              className="min-h-11 w-24 rounded-lg border border-input bg-background px-3 text-center"
            />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-4 text-[0.95rem]">
            <span>Durée de pause par défaut (min)</span>
            <input
              type="number"
              min={0}
              max={60}
              value={settings.defaultBreakMinutes}
              onChange={(e) =>
                update({ defaultBreakMinutes: Math.max(0, Math.min(60, Number(e.target.value))) })
              }
              className="min-h-11 w-24 rounded-lg border border-input bg-background px-3 text-center"
            />
          </label>
        </Section>

        <Section title="Données">
          <button
            onClick={handleExport}
            className="min-h-12 w-full rounded-xl border border-border text-sm transition-colors hover:bg-secondary"
          >
            Exporter mes données
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="min-h-12 w-full rounded-xl border border-border text-sm transition-colors hover:bg-secondary"
          >
            Importer mes données
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => {
              if (
                confirm(
                  "Cette action supprimera définitivement toutes les données enregistrées sur cet appareil. Continuer ?",
                ) &&
                confirm("Dernière confirmation : supprimer toutes mes données ?")
              ) {
                clearAllData();
                setMessage("Toutes les données ont été supprimées.");
              }
            }}
            className="min-h-12 w-full rounded-xl border border-destructive/40 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Supprimer toutes mes données
          </button>
          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
          <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Tes données sont stockées uniquement sur cet appareil. L'application n'envoie pas ton
            journal vers un serveur.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
