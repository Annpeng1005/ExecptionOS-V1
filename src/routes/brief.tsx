import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/brief")({
  head: () => ({
    meta: [
      { title: "Business Case — ExceptionOS demo" },
      { name: "description", content: "Fictional executive summary: reducing avoidable service delays and manual coordination for blocked service requests." },
      { property: "og:title", content: "Business Case — ExceptionOS demo" },
      { property: "og:description", content: "Problem, proposed AI-assisted solution, validation questions and unmeasured pilot measures." },
    ],
  }),
  component: Brief,
});

const rows: [string, string][] = [
  ["Customer problem", "A service appointment is at risk because a required part isn't in stock, and fixing it relies on manual hand-offs between Purchasing, the supplier, Inventory and Dispatch."],
  ["Why this may matter", "Avoidable service delays and coordination effort. How often and how much is not yet known."],
  ["Proposed solution", "An agent detects the blocker, assigns a Purchasing follow-up, records the supplier's reply as an unverified claim, and lets fixed rules confirm readiness only after a warehouse receipt. Existing systems stay authoritative."],
  ["Needs customer validation", "Blocked-request volume, current ownership of supplier follow-up, receipt timeliness, and which decisions must stay human."],
];

const kpis = ["Blocker resolution time", "Correct workflow completion rate", "Human coordination effort per affected request"];

function Brief() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-primary">Business Case · fictional customer</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Reduce avoidable service delays and manual coordination across Purchasing, suppliers, Inventory and Dispatch.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">A hypothesis to test — no customer findings yet.</p>
      </div>

      <dl className="divide-y rounded-lg border bg-card">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="text-sm font-medium">{k}</dt>
            <dd className="text-sm text-muted-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h2 className="mb-2 text-sm font-medium">Pilot success measures</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {kpis.map((k) => (
            <li key={k} className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium">{k}</div>
              <div className="mt-2 text-xs text-muted-foreground">Not measured — requires customer baseline</div>
            </li>
          ))}
        </ul>
      </div>

      <Button asChild>
        <Link to="/">See the agent run <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </div>
  );
}
