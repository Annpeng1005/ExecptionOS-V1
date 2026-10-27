import { useSyncExternalStore } from "react";
import { applyEvent } from "@/engine/engine";
import { createSeed } from "@/engine/seed";
import { ev } from "@/engine/scenarios";
import type { SimEvent, SimState } from "@/engine/types";

/** The five guided stages, each one real engine event. */
export const STAGES: { key: string; label: string; summary: string; event: () => SimEvent }[] = [
  { key: "detect", label: "Detect", summary: "Read Field Service and Inventory; detect the missing component.", event: ev.detect },
  { key: "coordinate", label: "Coordinate", summary: "Create a Purchasing-owned supplier follow-up task.", event: ev.coordinate },
  { key: "interpret", label: "Interpret", summary: "Interpret the supplier reply as an unverified claim.", event: () => ev.email() },
  { key: "verify", label: "Verify", summary: "Record an authorized warehouse goods receipt and verify it.", event: () => ev.receipt() },
  { key: "resume", label: "Resume", summary: "Run deterministic readiness rules; allocate only if every guard passes.", event: () => ev.resume() },
];

interface DemoState {
  /** snapshots[0] = seed; snapshots[i] = state immediately after stage i. */
  snapshots: SimState[];
}

let state: DemoState = { snapshots: [createSeed()] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const demo = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  next() {
    const i = state.snapshots.length - 1;
    if (i >= STAGES.length) return;
    const after = applyEvent(state.snapshots[i], STAGES[i].event());
    state = { snapshots: [...state.snapshots, after] };
    emit();
  },
  reset() {
    state = { snapshots: [createSeed()] };
    emit();
  },
};

export function useDemo() {
  const s = useSyncExternalStore(demo.subscribe, demo.get, demo.get);
  const current = s.snapshots[s.snapshots.length - 1];
  return { snapshots: s.snapshots, current, stepsRun: s.snapshots.length - 1 };
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
