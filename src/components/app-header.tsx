import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demo } from "@/lib/demo-store";

const tabs = [
  { to: "/", label: "Agent Run" },
  { to: "/brief", label: "Business Case" },
  { to: "/lab", label: "Testing & Logs" },
] as const;

export function AppHeader() {
    return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight">ExceptionOS</span>
          <span className="rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning-foreground">Fictional demo</span>
        </div>
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-sm bg-accent text-accent-foreground font-medium" }}
              activeOptions={{ exact: true }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => demo.reset()}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset Demo
          </Button>
        </div>
      </div>
    </header>
  );
}
