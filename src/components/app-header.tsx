import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demo } from "@/lib/demo-store";
import { useDemo } from "@/lib/demo-store";
import { StatusBadge } from "@/components/demo-ui";

const tabs = [
  { to: "/", label: "Agent Run" },
  { to: "/brief", label: "Business Case" },
  { to: "/lab", label: "Testing & Logs" },
] as const;

export function AppHeader() {
    const { current } = useDemo();
    return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight">ExceptionOS</span>
          <span className="text-xs text-muted-foreground">Fictional simulation</span>
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
          <span className="hidden text-xs text-muted-foreground sm:inline">{current.workOrder.id}</span>
          <StatusBadge status={current.workOrder.status} />
          <Button size="sm" variant="outline" onClick={() => demo.reset()}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset Demo
          </Button>
        </div>
      </div>
    </header>
  );
}
