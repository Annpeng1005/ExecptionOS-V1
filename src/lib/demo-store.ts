import { useSyncExternalStore } from "react";
import { advanceGuided, injectGuided, guidedPause } from "@/engine/guided";
import { createSeed } from "@/engine/seed";
import { ev, scenarios, runScenario, type ScenarioResult } from "@/engine/scenarios";
import type { SimEvent, SimState } from "@/engine/types";

/** The five guided stages, each one real engine event. */
export interface Stage {
  key: string;
  label: string;
  title: string;
  button: string;
  explain: string;
  success: string;
  summary: string;
  event: () => SimEvent;
}

export const STAGES: Stage[] = [
  { key: "detect", label: "Detect", title: "Check whether the part is in stock", button: "Check inventory", explain: "The agent reads the service request and inventory to see whether P-USB-410 is available for Tuesday's visit.", success: "Part not in stock — service request blocked and a parts blocker opened.", summary: "Read Field Service and Inventory; detect the missing component.", event: ev.detect },
  { key: "coordinate", label: "Coordinate", title: "Ask Purchasing to follow up with the supplier", button: "Create supplier follow-up", explain: "The agent creates a follow-up task owned by Purchasing, with a deadline, to get a confirmed delivery from the supplier.", success: "Supplier follow-up created and assigned to Purchasing.", summary: "Create a Purchasing-owned supplier follow-up task.", event: ev.coordinate },
  { key: "interpret", label: "Interpret", title: "Process the supplier's reply", button: "Process supplier reply", explain: "The agent reads the supplier's email and records what they promised. This is a claim only — no stock changes.", success: "Supplier reply recorded as an unverified claim. Follow-up task closed; still waiting for the part.", summary: "Interpret the supplier reply as an unverified claim.", event: () => ev.email() },
  { key: "verify", label: "Verify", title: "Record the warehouse receipt", button: "Record warehouse receipt", explain: "The warehouse logs the part it physically received. The agent checks part number, quantity and compatibility.", success: "Correct part physically received and verified by the warehouse.", summary: "Record an authorized warehouse goods receipt and verify it.", event: () => ev.receipt() },
  { key: "resume", label: "Resume", title: "Check whether the visit can go ahead", button: "Check service readiness", explain: "Fixed business rules check every logistics requirement. Only if all pass is the part allocated and the request marked Logistics Ready.", success: "All logistics requirements met — part allocated and the service visit can proceed.", summary: "Run deterministic readiness rules; allocate only if every guard passes.", event: () => ev.resume() },
];

interface DemoState {
  /** snapshots[0] = seed; snapshots[i] = state immediately after stage i. */
  snapshots: SimState[];
  results: Record<string, ScenarioResult>;
}

let state: DemoState = { snapshots: [createSeed()], results: {} };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const demo = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  next() {
    state = { ...state, snapshots: advanceGuided(state.snapshots, false) };
    emit();
  },
  run() {
    state = { ...state, snapshots: advanceGuided(state.snapshots, true) };
    emit();
  },
  injectSupplier(part = "P-USB-410") {
    state = { ...state, snapshots: injectGuided(state.snapshots, ev.email(part)) };
    emit();
  },
  injectReceipt(part = "P-USB-410") {
    state = { ...state, snapshots: injectGuided(state.snapshots, ev.receipt(part)) };
    emit();
  },
  runTests(id?: string) {
    const selected = id ? scenarios.filter((s) => s.id === id) : scenarios;
    state = { ...state, results: { ...state.results, ...Object.fromEntries(selected.map((s) => [s.id, runScenario(s)])) } };
    emit();
  },
  reset() {
    state = { snapshots: [createSeed()], results: {} };
    emit();
  },
};

export function useDemo() {
  const s = useSyncExternalStore(demo.subscribe, demo.get, demo.get);
  const current = s.snapshots.at(-1) ?? createSeed();
  return { snapshots: s.snapshots, current, results: s.results, stepsRun: s.snapshots.length - 1, pause: guidedPause(current, s.snapshots.length - 1) };
}

/** Milestones derived only from engine state. */
export function milestones(s: SimState) {
  const part = s.workOrder.requiredPartId;
  const supplierTask = s.tasks.find((t) => t.kind === "supplier-response");
  return {
    supplierResponded: supplierTask?.status === "Completed",
    componentVerified: s.receipts.some((r) => r.partId === part && r.source === "warehouse") && (s.dependency.state === "Verified" || s.dependency.state === "Resolved"),
    blockerResolved: s.allocations.some((a) => a.workOrderId === s.workOrder.id && a.partId === part) && s.dependency.state === "Resolved",
    logisticsReady: s.workOrder.status === "Logistics Ready",
  };
}

/** A stage is complete only when the state after it proves its outcome. */
export function stageVerified(key: string, s: SimState): boolean {
  const m = milestones(s);
  switch (key) {
    case "detect": return s.dependency.state !== "Not detected";
    case "coordinate": return s.tasks.some((t) => t.kind === "supplier-response");
    case "interpret": return m.supplierResponded && s.claims.length > 0;
    case "verify": return m.componentVerified;
    case "resume": return m.logisticsReady;
    default: return false;
  }
}

/** Plain-language list of record changes between two engine states. */
export function stateChanges(before: SimState, after: SimState): { label: string; from: string; to: string; system: string }[] {
  const out: { label: string; from: string; to: string; system: string }[] = [];
  const add = (system: string, label: string, a: string, b: string) => { if (a !== b) out.push({ system, label, from: a, to: b }); };
  add("Field Service", "Service request status", before.workOrder.status, after.workOrder.status);
  add("Agent", "Parts blocker", before.dependency.state, after.dependency.state);
  add("Agent", "Blocker owner", before.dependency.owner, after.dependency.owner);
  const tasks = (s: SimState) => s.tasks.map((t) => `${t.title} (${t.status})`).join("; ") || "none";
  add("Agent", "Tasks", tasks(before), tasks(after));
  const claims = (s: SimState) => s.claims.map((c) => `${c.quantity} × ${c.partId}, ETA ${c.eta.replace("T", " ")} (unverified)`).join("; ") || "none";
  add("Supplier Email", "Supplier claim", claims(before), claims(after));
  const rec = (s: SimState) => s.receipts.map((r) => `${r.quantity} × ${r.partId}`).join("; ") || "none";
  add("Inventory/ERP", "Warehouse receipts", rec(before), rec(after));
  for (const i of after.inventory) {
    const b = before.inventory.find((x) => x.partId === i.partId);
    if (!b) continue;
    add("Inventory/ERP", `${i.partId} stock`, `${b.onHand} on hand, ${b.allocated} allocated`, `${i.onHand} on hand, ${i.allocated} allocated`);
  }
  const al = (s: SimState) => s.allocations.map((a) => `${a.partId} → ${a.workOrderId}`).join("; ") || "none";
  add("Inventory/ERP", "Allocation", al(before), al(after));
  return out;
}
