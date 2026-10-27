import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Section } from "@/components/demo-ui";
import { useDemo } from "@/lib/demo-store";
import { runScenario, scenarios, type ScenarioResult } from "@/engine/scenarios";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Testing & Logs — ExceptionOS demo" },
      { name: "description", content: "Mock system records, executable failure scenarios and the boundary between message interpretation and deterministic rules." },
      { property: "og:title", content: "Testing & Logs — ExceptionOS demo" },
      { property: "og:description", content: "Run six scenarios against the real engine and inspect pass/fail results." },
    ],
  }),
  component: Lab,
});

function Lab() {
  const { current } = useDemo();
  // Scenario results are isolated: each run starts from a fresh seed, never the live demo.
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const runAll = () => setResults(Object.fromEntries(scenarios.map((s) => [s.id, runScenario(s)])));
  const ran = Object.values(results);
  const passed = ran.filter((r) => r.pass).length;
  const failed = ran.length - passed;
  const notRun = scenarios.length - ran.length;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Eyebrow>Testing & Logs</Eyebrow>
        <h1 className="text-2xl font-semibold tracking-tight">Does the agent fail safely?</h1>
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

      <Section title="Interpretation vs deterministic rules">
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
      </Section>

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
          {scenarios.map((sc) => {
            const r = results[sc.id];
            return (
              <div key={sc.id} data-testid={`scenario-${sc.id}`} data-result={r ? (r.pass ? "pass" : "fail") : "not-run"} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{sc.id}</span>
                  <span className="font-medium">{sc.title}</span>
                  <span className="w-full text-sm text-muted-foreground md:w-auto">{sc.description} Expected: {sc.expectedOutcome.toLowerCase()}.</span>
                  <div className="ml-auto flex items-center gap-2">
                    {r && (r.pass
                      ? <span className="flex items-center gap-1 text-sm text-success"><Check className="h-4 w-4" />Pass</span>
                      : <span className="flex items-center gap-1 text-sm text-destructive"><X className="h-4 w-4" />Fail</span>)}
                    <Button size="sm" variant="outline" onClick={() => setResults((p) => ({ ...p, [sc.id]: runScenario(sc) }))}>Run</Button>
                  </div>
                </div>
                {r && (
                  <p className={cn("mt-2 text-sm", r.pass ? "text-success" : "text-destructive")}>
                    {r.pass ? `Behaved as expected: ${sc.expectedOutcome.toLowerCase()}.` : `Did not behave as expected — ${r.checks.filter((c) => !c.pass).map((c) => `${c.label}: expected ${c.expected}, got ${c.actual}`).join("; ")}.`}
                  </p>
                )}
                {r && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-muted-foreground">Checks and event history</summary>
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
                          {e.error && <span className="text-destructive"> · error: {e.error}</span>}
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

function Count({ n, label, tone }: { n: number; label: string; tone?: string }) {
  return (
    <div>
      <div className={cn("text-2xl font-semibold", tone)} data-testid={`count-${label}`}>{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
