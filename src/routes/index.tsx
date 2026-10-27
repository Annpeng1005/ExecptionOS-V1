import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Section } from "@/components/demo-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Client Brief — ExceptionOS demo" },
      { name: "description", content: "Fictional case brief: reducing avoidable service delays and manual coordination for a blocked equipment-service request." },
      { property: "og:title", content: "Client Brief — ExceptionOS demo" },
      { property: "og:description", content: "Hypothesis, authority boundaries and unmeasured pilot metrics for AI-assisted service coordination." },
    ],
  }),
  component: Brief,
});

const kpis = [
  { name: "Blocker resolution time", def: "Time from blocker detection to the service request becoming Logistics Ready." },
  { name: "Correct workflow completion rate", def: "Share of affected requests that reach the correct outcome without rework or wrong-part allocation." },
  { name: "Human coordination effort per affected request", def: "Manual touches across Purchasing, Inventory and Dispatch per blocked request." },
];

function Brief() {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <Eyebrow>Client brief · fictional customer</Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Reduce avoidable service delays and manual coordination across Purchasing, suppliers, Inventory and Dispatch.
        </h1>
        <p className="text-muted-foreground">
          Customer objective for a fictional medical-equipment service organisation. Everything below is a hypothesis to test, not a validated finding.
        </p>
        <Button asChild>
          <Link to="/workflow">Explore Workflow <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Section title="Hypothetical problem">
          <p className="text-sm leading-relaxed">
            An equipment-service appointment (SR-2041, Tuesday 13:00) is at risk because the required component is not available in stock.
            Resolving it today needs hand-offs between Purchasing, the supplier, Inventory and Dispatch, tracked by email and memory.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Assumed, not observed: how often this happens and how much effort it consumes.</p>
        </Section>
        <Section title="Validated findings">
          <p className="text-sm text-muted-foreground">
            None yet. No customer data has been reviewed. The demo shows a mechanism; it does not show impact.
          </p>
        </Section>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Section title="Why AI-assisted coordination might help">
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>Detects the blocker and assigns a named owner and deadline straight away.</li>
            <li>Creates a Purchasing-owned supplier follow-up instead of relying on inbox memory.</li>
            <li>Reads the supplier reply and records it as an unverified claim.</li>
            <li>Applies the same readiness rules every time and lists what is still outstanding.</li>
          </ul>
        </Section>
        <Section title="What stays authoritative">
          <dl className="space-y-2 text-sm">
            <div><dt className="font-medium">Field Service</dt><dd className="text-muted-foreground">Appointment, technician, status. Agent never reschedules.</dd></div>
            <div><dt className="font-medium">Inventory / ERP</dt><dd className="text-muted-foreground">Stock changes only through an authorized warehouse receipt.</dd></div>
            <div><dt className="font-medium">Supplier email</dt><dd className="text-muted-foreground">The record of what the supplier said — a claim, not proof of stock.</dd></div>
          </dl>
        </Section>
      </div>

      <Section title="Proposed pilot metrics">
        <div className="grid gap-px overflow-hidden rounded-md border bg-border md:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.name} className="bg-card p-4">
              <div className="font-medium">{k.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">{k.def}</p>
              <div className="mt-3 text-xs font-medium text-warning-foreground">Not measured — requires customer baseline</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Assumptions and questions to validate">
        <ul className="grid gap-2 text-sm md:grid-cols-2">
          <li>How many service requests per month are blocked by parts, and for how long?</li>
          <li>Who owns supplier follow-up today, and how is it tracked?</li>
          <li>Are warehouse receipts recorded promptly enough to rely on?</li>
          <li>Which readiness checks does Dispatch apply before confirming a visit?</li>
          <li>Which actions must always require a human decision?</li>
          <li>Can the agent read Field Service and ERP records with appropriate access?</li>
        </ul>
      </Section>
    </div>
  );
}
