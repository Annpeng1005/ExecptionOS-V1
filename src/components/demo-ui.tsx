import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/engine/types";

const tone: Record<WorkOrderStatus, string> = {
  Scheduled: "bg-muted text-muted-foreground",
  "Blocked: Parts": "bg-destructive/10 text-destructive",
  "At Risk": "bg-warning/20 text-warning-foreground",
  "Logistics Ready": "bg-success/15 text-success",
};

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span data-testid="wo-status" className={cn("rounded px-2 py-0.5 text-xs font-medium", tone[status])}>
      {status}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-xs font-medium uppercase tracking-wider text-primary">{children}</div>;
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t pt-6", className)}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-CA", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}
