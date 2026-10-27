import { createSeed } from "./seed";
import { runEvents } from "./engine";
import { simulatedInterpreter, unavailableInterpreter, type MessageInterpreter } from "./interpreter";
import type { SimEvent, SimState } from "./types";

export const SUPPLIER = "orders@northbay-parts.example";

export const emailBody = (part: string, eta: string) =>
  `Hi Dana, confirming your order for ${part}, qty: 1. Shipped via courier, expected delivery ${eta.replace("T", " ")}. Regards, Northbay Medical Parts`;

export const ev = {
  detect: (): SimEvent => ({ type: "DETECT", eventId: "EVT-1001" }),
  coordinate: (): SimEvent => ({ type: "COORDINATE", eventId: "EVT-1002" }),
  email: (part = "P-USB-410", eta = "2026-10-26T16:00", id = "MSG-881"): SimEvent => ({
    type: "SUPPLIER_EMAIL",
    eventId: `EVT-${id}`,
    messageId: id,
    from: SUPPLIER,
    body: emailBody(part, eta),
  }),
  receipt: (part = "P-USB-410", id = "GR-4410"): SimEvent => ({
    type: "GOODS_RECEIPT",
    eventId: `EVT-${id}`,
    receiptId: id,
    partId: part,
    quantity: 1,
    source: "warehouse",
  }),
  resume: (n = 1): SimEvent => ({ type: "RESUME", eventId: `EVT-RES-${n}` }),
};

export interface Check {
  label: string;
  expected: string;
  actual: (s: SimState, seed: SimState) => string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  events: SimEvent[];
  interpreter?: MessageInterpreter;
  checks: Check[];
}

const wo = (s: SimState) => s.workOrder.status;
const allocs = (s: SimState) => String(s.allocations.length);
const clinical: Check = {
  label: "Clinical release untouched",
  expected: "Not authorized — clinical engineering sign-off required",
  actual: (s) => s.workOrder.clinicalRelease,
};

export const scenarios: Scenario[] = [
  {
    id: "A",
    title: "Happy path",
    description: "Correct component confirmed by supplier and independently received by warehouse.",
    expectedOutcome: "Logistics ready",
    events: [ev.detect(), ev.coordinate(), ev.email(), ev.receipt(), ev.resume()],
    checks: [
      { label: "Work order status", expected: "Logistics Ready", actual: wo },
      { label: "Allocations", expected: "1", actual: allocs },
      { label: "Dependency", expected: "Resolved", actual: (s) => s.dependency.state },
      clinical,
    ],
  },
  {
    id: "B1",
    title: "Wrong component — supplier email",
    description: "Supplier confirms P-USB-405 instead of P-USB-410.",
    expectedOutcome: "No allocation; blocker remains; reconciliation task",
    events: [ev.detect(), ev.coordinate(), ev.email("P-USB-405"), ev.resume()],
    checks: [
      { label: "Work order status", expected: "Blocked: Parts", actual: wo },
      { label: "Allocations", expected: "0", actual: allocs },
      { label: "Dependency", expected: "Needs review", actual: (s) => s.dependency.state },
      { label: "Reconciliation tasks", expected: "1", actual: (s) => String(s.tasks.filter((t) => t.kind === "reconciliation").length) },
    ],
  },
  {
    id: "B2",
    title: "Wrong component — warehouse receipt",
    description: "Supplier confirms the right part, but warehouse receives P-USB-405.",
    expectedOutcome: "No allocation; blocker remains; reconciliation task",
    events: [ev.detect(), ev.coordinate(), ev.email(), ev.receipt("P-USB-405"), ev.resume()],
    checks: [
      { label: "Work order status", expected: "Blocked: Parts", actual: wo },
      { label: "Allocations", expected: "0", actual: allocs },
      { label: "P-USB-410 on hand", expected: "0", actual: (s) => String(s.inventory.find((i) => i.partId === "P-USB-410")!.onHand) },
      { label: "Reconciliation tasks", expected: "1", actual: (s) => String(s.tasks.filter((t) => t.kind === "reconciliation").length) },
    ],
  },
  {
    id: "C",
    title: "Delayed shipment",
    description: "Supplier ETA is Tuesday 15:00 — after the 13:00 appointment.",
    expectedOutcome: "At risk; dispatcher review; no rescheduling",
    events: [ev.detect(), ev.coordinate(), ev.email("P-USB-410", "2026-10-27T15:00")],
    checks: [
      { label: "Work order status", expected: "At Risk", actual: wo },
      { label: "Appointment unchanged", expected: "2026-10-27T13:00", actual: (s) => s.workOrder.appointment },
      { label: "Dispatcher review tasks", expected: "1", actual: (s) => String(s.tasks.filter((t) => t.kind === "dispatcher-review").length) },
      { label: "Allocations", expected: "0", actual: allocs },
    ],
  },
  {
    id: "D",
    title: "Duplicate supplier message",
    description: "The same supplier message and goods receipt are each delivered twice.",
    expectedOutcome: "No duplicate task, receipt, or allocation",
    events: [ev.detect(), ev.coordinate(), ev.email(), ev.email(), ev.receipt(), ev.receipt(), ev.resume(1), ev.resume(2)],
    checks: [
      { label: "Supplier claims", expected: "1", actual: (s) => String(s.claims.length) },
      { label: "Tasks", expected: "1", actual: (s) => String(s.tasks.length) },
      { label: "Goods receipts", expected: "1", actual: (s) => String(s.receipts.length) },
      { label: "Allocations", expected: "1", actual: allocs },
    ],
  },
  {
    id: "E",
    title: "Interpretation unavailable",
    description: "The message interpreter fails while processing the supplier email.",
    expectedOutcome: "Safe state preserved; logged; human review",
    events: [ev.detect(), ev.coordinate(), ev.email(), ev.resume()],
    interpreter: unavailableInterpreter,
    checks: [
      { label: "Dependency unchanged", expected: "Awaiting supplier", actual: (s) => s.dependency.state },
      { label: "Supplier claims", expected: "0", actual: (s) => String(s.claims.length) },
      { label: "Interpretation review tasks", expected: "1", actual: (s) => String(s.tasks.filter((t) => t.kind === "interpretation-review").length) },
      { label: "Error logged", expected: "yes", actual: (s) => (s.log.some((l) => l.error?.includes("unavailable")) ? "yes" : "no") },
    ],
  },
];

export interface ScenarioResult {
  scenario: Scenario;
  final: SimState;
  checks: { label: string; expected: string; actual: string; pass: boolean }[];
  pass: boolean;
}

/** Executes the scenario against the real engine from a fresh seed. */
export function runScenario(sc: Scenario): ScenarioResult {
  const seed = createSeed();
  const final = runEvents(seed, sc.events, { interpreter: sc.interpreter ?? simulatedInterpreter });
  const checks = sc.checks.map((c) => {
    const actual = c.actual(final, seed);
    return { label: c.label, expected: c.expected, actual, pass: actual === c.expected };
  });
  return { scenario: sc, final, checks, pass: checks.every((c) => c.pass) };
}
