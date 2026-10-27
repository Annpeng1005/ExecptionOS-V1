import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Section } from "@/components/demo-ui";
import { demo, useDemo } from "@/lib/demo-store";
import { scenarios } from "@/engine/scenarios";
import { cn } from "@/lib/utils";
import { operationalSummary, outcomeLabel } from "@/lib/handoff";
import { createSeed } from "@/engine/seed";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Testing & Logs — ExceptionOS demo" },
      { name: "description", content: "Mock system records, executable failure scenarios and the boundary between message interpretation and deterministic rules." },
      { property: "og:title", content: "Testing & Logs — ExceptionOS demo" },
      { property: "og:description", content: "Run six scenarios against the real engine and inspect pass/fail results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lab,
});

function Lab() {
  const { current, results } = useDemo();
  // Scenario results are isolated: each run starts from a fresh seed, never the live demo.
  const runAll = () => demo.runTests();
  const ran = Object.values(results);
  const passed = ran.filter((r) => r.pass).length;
  const failed = ran.length - passed;
  const notRun = scenarios.length - ran.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Eyebrow>Testing & Logs</Eyebrow>
        <h1 className="text-3xl font-semibold">Test the workflow. Inspect the evidence.</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Each scenario runs the real workflow rules from a clean start. Running them never changes the Agent Run screen.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-5" data-testid="test-summary">
        <Count n={notRun} label="Not yet run" />
        <Count n={passed} label="Passed" tone="text-success" />
        <Count n={failed} label="Failed" tone={failed ? "text-destructive" : undefined} />
        <Button className="ml-auto" onClick={runAll}>Run all scenarios</Button>
      </div>

      <details className="border-t pt-4">
        <summary className="cursor-pointer text-sm font-semibold">Simulated interpretation vs deterministic rules</summary>
        <div className="grid gap-px overflow-hidden rounded-md border bg-border md:grid-cols-2">
          <div className="bg-card p-4 text-sm">
            <div className="font-medium">Simulated message interpretation</div>
            <p className="mt-1 text-muted-foreground">Extracts part, quantity and ETA from supplier text. Output is only ever an unverified supplier claim. No live AI model is connected; it can fail, and failure routes to human review.</p>
          </div>
          <div className="bg-card p-4 text-sm">
            <div className="font-medium">Deterministic business rules</div>
            <p className="mt-1 text-muted-foreground">Decide allocation and Logistics Ready. Stock changes only through an authorized warehouse receipt. Same input, same result, every time.</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Synthetic tests do not establish production reliability or autonomous execution rates. A real pilot must validate trusted event sources, customer baselines, integration failures, costs and oversight.</p>
      </details>

      <Section title="Mock system records (current Agent Run state)">
        <div className="grid gap-6 md:grid-cols-3">
          <Record title="Field Service" rows={[
            ["Work order", current.workOrder.id],
            ["Status", current.workOrder.status],
            ["Appointment", current.workOrder.appointment.replace("T", " ")],
            ["Technician", current.workOrder.technician],
            ["Open tasks", String(current.tasks.filter((t) => t.status === "Open").length)],
            ["Completed tasks", String(current.tasks.filter((t) => t.status === "Completed").length)],
          ]} />
          <Record title="Inventory / ERP" rows={[
            ...current.inventory.map((i) => [i.partId, `on hand ${i.onHand} · allocated ${i.allocated}`] as [string, string]),
            ["Goods receipts", current.receipts.map((r) => `${r.receiptId} (${r.partId})`).join(", ") || "none"],
            ["Allocations", current.allocations.map((a) => a.id).join(", ") || "none"],
          ]} />
          <Record title="Supplier Email" rows={[
            ["Messages", String(current.messages.length)],
            ["Claims (unverified)", current.claims.map((c) => `${c.quantity} × ${c.partId}, ETA ${c.eta.replace("T", " ")}`).join("; ") || "none"],
          ]} />
        </div>
        {current.messages.length > 0 && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Show raw supplier messages</summary>
            {current.messages.map((msg) => (
              <pre key={msg.messageId} className="mt-2 whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">{msg.messageId} from {msg.from}{"\n"}{msg.body}</pre>
            ))}
          </details>
        )}
      </Section>

      <Section title="Executable scenarios">
        <div className="divide-y rounded-md border bg-card">
          <div className="hidden gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_4rem]"><span>Scenario</span><span>Expected result</span><span>Run</span><span>Actual</span></div>
          {scenarios.map((sc) => {
            const r = results[sc.id];
            return (
              <div key={sc.id} data-testid={`scenario-${sc.id}`} data-result={r ? (r.pass ? "pass" : "fail") : "not-run"} className="px-4 py-3">
                <div className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_4rem] md:gap-4">
                  <span className="text-sm font-medium"><span className="mr-2 font-mono text-xs text-muted-foreground">{sc.id}</span>{sc.title}</span>
                  <span className="text-xs text-muted-foreground"><span className="md:hidden">Expected: </span>{sc.expectedOutcome}</span>
                  <Button size="sm" variant="outline" className="w-fit" aria-label={`Run scenario ${sc.id}`} onClick={() => demo.runTests(sc.id)}>Run</Button>
                  <div className="text-xs">
                    {r ? (r.pass
                      ? <span className="flex items-center gap-1 text-sm text-success"><Check className="h-4 w-4" />Pass</span>
                      : <span className="flex items-center gap-1 text-sm text-destructive"><X className="h-4 w-4" />Fail</span>) : <span className="text-muted-foreground">Not run</span>}
                  </div>
                </div>
                {r && sc.id === "D" && (
                  <div className="mt-2 text-sm" data-testid={`summary-${sc.id}`}>
                    <span className={cn("mr-2 rounded px-1.5 py-0.5 text-xs font-medium", r.pass ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>{r.pass ? "Duplicates safely ignored" : "Duplicate handling failed"}</span>
                    Repeated events were processed once: {r.final.tasks.length} task{r.final.tasks.length === 1 ? "" : "s"}, {r.final.receipts.length} receipt, {r.final.allocations.length} allocation — no duplicates created.
                    {r.final.workOrder.status === "Logistics Ready" && <p className="mt-1 text-xs text-muted-foreground">Secondary outcome: Logistics Ready was reached through the legitimate, non-duplicate events.</p>}
                  </div>
                )}
                {r && sc.id !== "D" && (
                  <div className="mt-2 text-sm" data-testid={`summary-${sc.id}`}>
                    <span className={cn("mr-2 rounded px-1.5 py-0.5 text-xs font-medium", outcomeLabel(r.final) === "Service logistics ready" ? "bg-success/15 text-success" : outcomeLabel(r.final) === "Execution error" ? "bg-destructive/10 text-destructive" : "bg-warning/20 text-warning-foreground")}>{outcomeLabel(r.final)}</span>
                    {operationalSummary(r.final, createSeed())}
                  </div>
                )}
                {r && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-muted-foreground">Checks and event history</summary>
                    <p className="mt-2 text-xs text-muted-foreground">{sc.description}</p>
                    <p className={cn("mt-2 text-xs", r.pass ? "text-success" : "text-destructive")}>
                      Actual: {r.final.workOrder.status} · dependency {r.final.dependency.state} · {r.final.allocations.length} allocation(s).
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">Human escalation: {r.final.tasks.filter((t) => t.status === "Open" && t.kind !== "supplier-response").map((t) => `${t.owner}: ${t.title}`).join("; ") || "None required by this scenario."}</div>
                    <table className="mt-2 w-full text-xs">
                      <thead className="text-left text-muted-foreground"><tr><th className="py-1">Check</th><th>Expected</th><th>Actual</th><th /></tr></thead>
                      <tbody>
                        {r.checks.map((c) => (
                          <tr key={c.label} className="border-t">
                            <td className="py-1">{c.label}</td><td>{c.expected}</td><td>{c.actual}</td>
                            <td>{c.pass ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-destructive" />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <ol className="mt-3 space-y-1 font-mono text-xs">
                      {r.final.log.map((e, k) => (
                        <li key={k}>
                          {e.timestamp} [{e.sourceSystem}] {e.action}
                          {e.error && <span className="text-destructive"> · {e.error.startsWith("Expected") || e.error.startsWith("Duplicate") || e.error.startsWith("Unauthorized") ? "validation blocked" : "error"}: {e.error}</span>}
                          <div className="text-muted-foreground">{e.resultingState}{e.humanReview && ` · Human review: ${e.humanReview}`}</div>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Record({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="text-sm">
      <div className="mb-2 font-medium">{title}</div>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-dashed pb-1">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-mono text-xs">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Count({ n, label, tone }: { n: number; label: string; tone?: string | undefined }) {
  return (
    <div>
      <div className={cn("text-2xl font-semibold", tone)} data-testid={`count-${label}`}>{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
