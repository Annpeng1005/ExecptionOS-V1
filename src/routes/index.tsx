import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Circle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, fmt } from "@/components/demo-ui";
import { STAGES, demo, milestones, stageVerified, stateChanges, useDemo } from "@/lib/demo-store";
import { readinessGuards } from "@/engine/rules";
import { PEOPLE } from "@/engine/seed";
import type { SimState } from "@/engine/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Run — SR-2041 · ExceptionOS demo" },
      { name: "description", content: "Guide the agent step by step through a blocked ultrasound service request and see each verified result." },
      { property: "og:title", content: "Agent Run — SR-2041 · ExceptionOS demo" },
      { property: "og:description", content: "Problem, action, verified result, next step — for a missing-part service request." },
    ],
  }),
  component: AgentRun,
});

function owner(s: SimState) {
  const open = s.tasks.find((t) => t.status === "Open" && t.kind !== "supplier-response");
  if (open) return open.owner;
  switch (s.dependency.state) {
    case "Awaiting supplier": return PEOPLE.purchasing;
    case "Awaiting receipt": return PEOPLE.inventoryLead;
    case "Resolved": return s.workOrder.technician;
    default: return PEOPLE.coordinator;
  }
}

function AgentRun() {
  const { snapshots, current, stepsRun } = useDemo();
  const [inspect, setInspect] = useState<number | null>(null);
  const lastOk = stepsRun === 0 || stageVerified(STAGES[stepsRun - 1]!.key, current);
  const next = lastOk && stepsRun < STAGES.length ? STAGES[stepsRun]! : null;
  const done = stepsRun === STAGES.length && lastOk;
  const wo = current.workOrder;
  const m = milestones(current);
  const nextLabel = !lastOk ? "Human review of the failed step" : next ? next.title : "Technician performs the service visit";

  const run = () => { setInspect(null); demo.next(); };

  return (
    <div className="space-y-8">
      {/* Problem card */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <div className="text-xs text-muted-foreground">SR-2041 · Ultrasound service</div>
            <div className="text-lg font-semibold">Missing part P-USB-410</div>
          </div>
          <Item label="Appointment" value={`${fmt(wo.appointment)}`} />
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <StatusBadge status={wo.status} />
          </div>
          <Item label="Responsible" value={owner(current).replace(" (demo)", "")} />
          <Item label="Next required action" value={nextLabel} testId="next-action" />
        </div>
      </section>

      {/* Timeline */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Progress">
        {STAGES.map((st, i) => {
          const snap = snapshots[i + 1];
          const ok = !!snap && stageVerified(st.key, snap);
          const failed = !!snap && !ok;
          const isCurrent = !snap && i === stepsRun && lastOk;
          return (
            <li key={st.key} className="flex items-center gap-2">
              <button
                type="button"
                data-testid={`step-${st.key}`}
                data-state={ok ? "done" : failed ? "failed" : isCurrent ? "current" : "pending"}
                disabled={!snap}
                onClick={() => setInspect(inspect === i ? null : i)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                  ok && "border-success/40 bg-success/10 text-success",
                  failed && "border-destructive/40 bg-destructive/10 text-destructive",
                  isCurrent && "border-primary bg-accent font-medium text-accent-foreground",
                  !snap && !isCurrent && "text-muted-foreground",
                  inspect === i && "ring-2 ring-ring",
                )}
              >
                {ok ? <Check className="h-3.5 w-3.5" /> : failed ? <AlertTriangle className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}
                {st.label}
              </button>
              {i < STAGES.length - 1 && <span className="h-px w-4 bg-border" />}
            </li>
          );
        })}
        {stepsRun > 0 && <li className="ml-auto text-xs text-muted-foreground">Click a completed step to review it</li>}
      </ol>

      {/* Current action / inspection panel */}
      <section className="rounded-lg border-2 border-primary/30 bg-card p-6 shadow-sm" data-testid="action-panel">
        {inspect !== null ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reviewing step {inspect + 1} (read-only)</span>
              <Button size="sm" variant="ghost" onClick={() => setInspect(null)}>Back to current action</Button>
            </div>
            <Result i={inspect} before={snapshots[inspect]!} after={snapshots[inspect + 1]!} />
          </>
        ) : (
          <div className="space-y-6">
            {stepsRun > 0 && <Result i={stepsRun - 1} before={snapshots[stepsRun - 1]!} after={current} />}
            {next && (
              <div className={cn(stepsRun > 0 && "border-t pt-6")}>
                <div className="text-xs font-medium uppercase tracking-wider text-primary">{stepsRun === 0 ? "Start here" : "Next action"} · step {stepsRun + 1} of 5</div>
                <h2 className="mt-1 text-xl font-semibold">{next.title}</h2>
                <p className="mt-1 max-w-2xl text-muted-foreground">{next.explain}</p>
                <Button size="lg" className="mt-4" onClick={run} data-testid="primary-action">
                  {next.button} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!lastOk && (
              <div className="border-t pt-6 text-sm">
                <div className="font-medium">Workflow paused for human review.</div>
                <p className="text-muted-foreground">The agent will not continue automatically. Use Reset Demo to start over.</p>
              </div>
            )}
            {done && (
              <div className="border-t pt-6">
                <div className="text-xs font-medium uppercase tracking-wider text-primary">Agent work complete</div>
                <h2 className="mt-1 text-xl font-semibold">Hand-off to people</h2>
                <p className="mt-1 text-muted-foreground">Logistics Ready means the visit can proceed. It is not clinical sign-off. These remain with people:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />Technician servicing — {wo.repairStatus}</li>
                  <li className="flex gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />Required service documentation — not started</li>
                  <li className="flex gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />Clinical release — {wo.clinicalRelease}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Milestones */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Milestone n={1} done={m.supplierResponded} title="Supplier replied" note="Follow-up closed. A claim, not stock." />
        <Milestone n={2} done={m.blockerResolved} partial={m.componentVerified && !m.blockerResolved} title="Missing-part blocker resolved" note="Part received, verified and allocated." />
        <Milestone n={3} done={m.logisticsReady} title="Logistics Ready" note="Visit can proceed. Not clinical sign-off." />
      </section>

      {/* Details */}
      <div className="space-y-2">
        <Details title="Readiness requirements">
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {readinessGuards(current).map((g) => (
              <li key={g.label} className="flex items-start gap-2">
                {g.pass ? <Check className="mt-0.5 h-4 w-4 text-success" /> : <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                <span className={g.pass ? "" : "text-muted-foreground"}>{g.label}</span>
              </li>
            ))}
          </ul>
        </Details>
        <Details title={`Activity log (${current.log.length})`}>
          {current.log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ol className="space-y-1.5 text-sm" data-testid="history">
              {current.log.map((e, k) => (
                <li key={k}>
                  <span className="font-mono text-xs text-muted-foreground">{e.timestamp} · {e.sourceSystem} · {e.eventId}</span>
                  <div>{e.action}{e.error && <span className="text-destructive"> — {e.error}</span>}</div>
                </li>
              ))}
            </ol>
          )}
        </Details>
      </div>
    </div>
  );
}

function Result({ i, before, after }: { i: number; before: SimState; after: SimState }) {
  const st = STAGES[i]!;
  const ok = stageVerified(st.key, after);
  const changes = stateChanges(before, after);
  const entries = after.log.slice(before.log.length);
  const errors = entries.filter((e) => e.error);
  return (
    <div data-testid="result" data-ok={ok}>
      <div className={cn("flex items-start gap-3", ok ? "text-success" : "text-destructive")}>
        {ok ? <Check className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
        <div>
          <div className="text-xs font-medium uppercase tracking-wider">{ok ? "Done" : "Needs human review"} · {st.button}</div>
          <div className="text-lg font-semibold text-foreground">{ok ? st.success : "This step did not reach its verified outcome."}</div>
          {errors.map((e, k) => <div key={k} className="text-sm">{e.action} — {e.error}</div>)}
        </div>
      </div>
      {changes.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-md border">
          <div className="bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">What changed in the records</div>
          <ul className="divide-y text-sm">
            {changes.map((c) => (
              <li key={c.label} className="grid gap-1 px-3 py-2 sm:grid-cols-[200px_1fr]">
                <span className="text-muted-foreground">{c.label} <span className="text-xs">· {c.system}</span></span>
                <span><span className="text-muted-foreground line-through">{c.from}</span> <ArrowRight className="inline h-3 w-3" /> <span className="font-medium">{c.to}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Item({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium" data-testid={testId}>{value}</div>
    </div>
  );
}

function Milestone({ n, done, title, note, partial }: { n: number; done: boolean; title: string; note: string; partial?: boolean }) {
  return (
    <div data-testid={`milestone-${n}`} data-done={done} className={cn("rounded-lg border p-4", done ? "border-success/40 bg-success/5" : "bg-card")}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {done ? <Check className="h-4 w-4 text-success" /> : <Circle className={cn("h-4 w-4", partial ? "text-warning" : "text-muted-foreground")} />}
        <span className={done ? "" : "text-muted-foreground"}>{title}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{partial ? "Part verified; not yet allocated." : note}</p>
    </div>
  );
}

function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
        {title}
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t px-4 py-3">{children}</div>
    </details>
  );
}
