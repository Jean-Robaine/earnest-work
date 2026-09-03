import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Focus" },
  { to: "/today", label: "Journal" },
  { to: "/settings", label: "Réglages" },
] as const;

export function AppShell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {!bare && (
        <header className="mx-auto w-full max-w-2xl px-6 pt-6 sm:pt-10">
          <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-6">
              {NAV.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    activeOptions={{ exact: to === "/" }}
                    className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    activeProps={{ className: "text-foreground" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
      )}
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:py-16">{children}</main>
    </div>
  );
}
