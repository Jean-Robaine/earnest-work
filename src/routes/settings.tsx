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
        content:
          "Son de fin de session, durées par défaut, export et import de tes données locales.",
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

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-6 border-b border-border py-3">
      <div>
        <p className="text-[0.95rem]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-4">{children}</div>
    </div>
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
      const imported = importData(JSON.parse(await file.text()));
      setMessage(`${imported} session(s) importée(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    }
  };

  return (
    <AppShell>
      <div className="rise-in mx-auto max-w-lg">
        <h1 className="font-display text-3xl font-normal tracking-tight">Réglages</h1>

        <div className="mt-12">
          <Row label="Son de fin de session">
            <input
              type="checkbox"
              aria-label="Activer le son"
              checked={settings.soundEnabled}
              onChange={(e) => {
                unlockAudio();
                update({ soundEnabled: e.target.checked });
              }}
              className="h-5 w-5 accent-[var(--foreground)]"
            />
          </Row>

          <Row label="Type de son">
            {SOUNDS.map((sound) => (
              <button
                key={sound.value}
                onClick={() => {
                  unlockAudio();
                  update({ soundKind: sound.value });
                  playChime(sound.value, settings.volume);
                }}
                aria-pressed={settings.soundKind === sound.value}
                className={`min-h-11 text-sm transition-colors ${
                  settings.soundKind === sound.value
                    ? "text-foreground underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sound.label}
              </button>
            ))}
          </Row>

          <Row label="Volume" hint={`${Math.round(settings.volume * 100)}%`}>
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
              className="w-40 accent-[var(--foreground)]"
            />
          </Row>

          <Row label="Notifications" hint="Selon les permissions du navigateur.">
            <input
              type="checkbox"
              aria-label="Activer les notifications"
              checked={settings.notificationsEnabled}
              onChange={async (e) => {
                if (!e.target.checked) return update({ notificationsEnabled: false });
                const granted = await requestNotificationPermission();
                update({ notificationsEnabled: granted });
                if (!granted) setMessage("Notifications refusées par le navigateur.");
              }}
              className="h-5 w-5 accent-[var(--foreground)]"
            />
          </Row>

          <Row label="Durée de focus" hint="minutes">
            <input
              type="number"
              min={5}
              max={120}
              value={settings.defaultFocusMinutes}
              onChange={(e) =>
                update({ defaultFocusMinutes: Math.max(5, Math.min(120, Number(e.target.value))) })
              }
              className="min-h-11 w-16 border-b border-input bg-transparent text-center outline-none focus:border-foreground"
            />
          </Row>

          <Row label="Durée de pause" hint="minutes">
            <input
              type="number"
              min={0}
              max={60}
              value={settings.defaultBreakMinutes}
              onChange={(e) =>
                update({ defaultBreakMinutes: Math.max(0, Math.min(60, Number(e.target.value))) })
              }
              className="min-h-11 w-16 border-b border-input bg-transparent text-center outline-none focus:border-foreground"
            />
          </Row>
        </div>

        <h2 className="mt-16 text-sm text-muted-foreground">Données</h2>
        <div className="mt-4 flex flex-col items-start gap-1">
          <button onClick={handleExport} className="min-h-11 text-[0.95rem] hover:underline underline-offset-4">
            Exporter mes données
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="min-h-11 text-[0.95rem] hover:underline underline-offset-4"
          >
            Importer des données
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
            className="min-h-11 text-[0.95rem] text-destructive hover:underline underline-offset-4"
          >
            Supprimer toutes mes données
          </button>
        </div>

        {message && (
          <p role="status" className="mt-6 text-sm text-muted-foreground">
            {message}
          </p>
        )}

        <p className="mt-16 text-xs leading-relaxed text-muted-foreground">
          Tes données sont stockées uniquement sur cet appareil.
        </p>
      </div>
    </AppShell>
  );
}
