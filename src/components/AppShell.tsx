import { Link } from "@tanstack/react-router";
import { CalendarDays, Settings as SettingsIcon, Timer } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Focus", icon: Timer },
  { to: "/today", label: "Ma journée", icon: CalendarDays },
  { to: "/settings", label: "Paramètres", icon: SettingsIcon },
] as const;

export function AppShell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2" aria-label="Focus — accueil">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-[0.95rem] font-medium tracking-tight">Focus</span>
          </Link>
          {!bare && (
            <nav aria-label="Navigation principale">
              <ul className="flex items-center gap-1">
                {NAV.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      activeOptions={{ exact: to === "/" }}
                      className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      activeProps={{ className: "bg-secondary text-foreground" }}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sr-only sm:hidden">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:py-12">{children}</main>
      <footer className="mx-auto w-full max-w-3xl px-5 pb-8 text-center text-xs text-muted-foreground">
        Work with intention. Keep the proof.
      </footer>
    </div>
  );
}
