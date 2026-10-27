import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, CircleDashed, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, StatusBadge, fmt } from "@/components/demo-ui";
import { STAGES, demo, milestones, stageVerified, useDemo } from "@/lib/demo-store";
import { readinessGuards } from "@/engine/rules";
import { PEOPLE } from "@/engine/seed";
import type { SimState } from "@/engine/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Workflow — SR-2041 · ExceptionOS demo" },
      { name: "description", content: "Step through detection, supplier follow-up, claim interpretation, warehouse verification and readiness for SR-2041." },
      { property: "og:title", content: "Live Workflow — SR-2041 · ExceptionOS demo" },
      { property: "og:description", content: "Five engine-driven stages with three distinct, state-verified milestones." },
    ],
  }),
  component: Workflow,
});

function nextAction(s: SimState): { owner: string; action: string } {
  const open = s.tasks.find((t) => t.status === "Open" && t.kind !== "supplier-response");
  if (open) return { owner: open.owner, action: open.title };
  switch (s.dependency.state) {
    case "Not detected": return { owner: "Agent", action: "Detect: read work order and inventory" };
    case "Open": return { owner: "Agent", action: "Coordinate: create Purchasing-owned supplier follow-up" };
    case "Awaiting supplier": return { owner: PEOPLE.purchasing, action: "Obtain supplier confirmation by Mon 15:00" };
    case "Awaiting receipt": return { owner: PEOPLE.inventoryLead, action: "Record authorized warehouse receipt for P-USB-410" };
    case "Verified": return { owner: PEOPLE.coordinator, action: "Run readiness rules and allocate component" };
    case "Resolved": return { owner: s.workOrder.technician, action: "Perform service visit (human)" };
    default: return { owner: PEOPLE.coordinator, action: "Review" };
  }
}

function Workflow() {
  const { snapshots, current, stepsRun } = useDemo();
  const wo = current.workOrder;
  const m = milestones(current);
  const na = nextAction(current);
  const protectedAppt = wo.status === "Logistics Ready";
  const guards = readinessGuards(current);

  return (
    <div className="space-y-8">
      {/* SR-2041 summary */}
      <section className="rounded-md border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <Eyebrow>Service request {wo.id} · {wo.customer}</Eyebrow>
            <h1 className="text-2xl font-semibold tracking-tight">
              Service appointment at risk: required component {wo.requiredPartId} not in stock
            </h1>
            <p className="text-sm text-muted-foreground">{wo.equipment} · {wo.site}</p>
          </div>
          <StatusBadge status={wo.status} />
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Current status" value={`${wo.status} · dependency ${current.dependency.state}`} />
          <Fact label="Accountable owner" value={na.owner} />
          <Fact label="Next action" value={na.action} testId="next-action" />
          <Fact
            label="Appointment"
            value={`${fmt(wo.appointment)} — ${protectedAppt ? "protected" : "at risk"}`}
            className={protectedAppt ? "text-success" : "text-destructive"}
          />
        </dl>
      </section>

      {/* Three milestones */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Three separate milestones</h2>
        <div className="grid gap-px overflow-hidden rounded-md border bg-border md:grid-cols-3">
          <Milestone n={1} done={m.supplierResponded} title="Supplier-response task completed" note="Purchasing follow-up closed. The reply is an unverified claim — no stock changes." />
          <Milestone n={2} done={m.blockerResolved} title="Missing-component blocker resolved" note={m.componentVerified && !m.blockerResolved ? "Component received and verified by warehouse; not yet allocated." : "Correct, compatible part received by warehouse, verified and allocated to SR-2041."} partial={m.componentVerified && !m.blockerResolved} />
          <Milestone n={3} done={m.logisticsReady} title="Service request Logistics Ready" note="All logistics prerequisites pass; the service visit can proceed." />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Logistics Ready is not clinical sign-off. Technician servicing, required documentation and authorized clinical release remain separate, outstanding human steps.
        </p>
      </section>

      {/* Guided stages */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Guided workflow</h2>
          <Button size="sm" onClick={() => demo.next()} disabled={stepsRun >= STAGES.length}>
            <Play className="h-3.5 w-3.5" />
            {stepsRun >= STAGES.length ? "All stages run" : `Run ${STAGES[stepsRun]!.label}`}
          </Button>
        </div>
        <ol className="divide-y rounded-md border bg-card">
          {STAGES.map((st, i) => {
            const snap = snapshots[i + 1];
            const ran = !!snap;
            const ok = ran && stageVerified(st.key, snap);
            const entries = ran ? snap.log.slice(snapshots[i]!.log.length) : [];
            return (
              <li key={st.key} data-testid={`stage-${st.key}`} data-state={ok ? "verified" : ran ? "not-verified" : "pending"} className="grid gap-3 p-4 md:grid-cols-[180px_1fr_200px]">
                <div className="flex items-center gap-2">
                  {ok ? <Check className="h-4 w-4 text-success" /> : ran ? <CircleDashed className="h-4 w-4 text-warning" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium">{i + 1}. {st.label}</span>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">{st.summary}</p>
                  {entries.map((e, k) => (
                    <p key={k} className="mt-1">
                      <span className="text-xs text-muted-foreground">[{e.sourceSystem}]</span> {e.action}
                      {e.error && <span className="ml-1 text-destructive">— {e.error}</span>}
                    </p>
                  ))}
                </div>
                <div className="text-xs">
                  {ran ? (
                    <>
                      <div className="font-mono">{snap.workOrder.status}</div>
                      <div className="text-muted-foreground">Dependency: {snap.dependency.state}</div>
                      <div className={ok ? "text-success" : "text-warning-foreground"}>{ok ? "Verified by state" : "Not verified"}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not run</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Logistics readiness rules (now)</h2>
          <ul className="space-y-1 text-sm">
            {guards.map((g) => (
              <li key={g.label} className="flex items-start gap-2">
                {g.pass ? <Check className="mt-0.5 h-4 w-4 text-success" /> : <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                <span className={g.pass ? "" : "text-muted-foreground"}>{g.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-md bg-muted p-3 text-sm">
            <div className="font-medium">Human approval still pending</div>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              <li>Technician servicing — {wo.repairStatus}</li>
              <li>Required service documentation — not started</li>
              <li>Clinical release — {wo.clinicalRelease}</li>
            </ul>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Action history</h2>
          {current.log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Run Detect to begin.</p>
          ) : (
            <ol className="space-y-2 text-sm" data-testid="history">
              {current.log.map((e, k) => (
                <li key={k} className="border-l-2 border-primary/40 pl-3">
                  <div className="font-mono text-xs text-muted-foreground">{e.timestamp} · {e.sourceSystem}</div>
                  <div>{e.action}</div>
                  {e.humanReview && <div className="text-xs text-warning-foreground">Human review: {e.humanReview}</div>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value, className, testId }: { label: string; value: string; className?: string; testId?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd data-testid={testId} className={cn("mt-0.5 font-medium", className)}>{value}</dd>
    </div>
  );
}

function Milestone({ n, done, title, note, partial }: { n: number; done: boolean; title: string; note: string; partial?: boolean }) {
  return (
    <div data-testid={`milestone-${n}`} data-done={done} className="bg-card p-4">
      <div className="flex items-center gap-2">
        {done ? <Check className="h-4 w-4 text-success" /> : partial ? <CircleDashed className="h-4 w-4 text-warning" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">Milestone {n}</span>
      </div>
      <div className={cn("mt-1 font-medium", !done && "text-muted-foreground")}>{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      <div className={cn("mt-2 text-xs font-medium", done ? "text-success" : "text-muted-foreground")}>{done ? "Complete" : partial ? "In progress" : "Not complete"}</div>
    </div>
  );
}
