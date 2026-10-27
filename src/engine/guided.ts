import { applyEvent } from "./engine";
import { ev } from "./scenarios";
import type { SimEvent, SimState } from "./types";

export type Pause = "supplier" | "warehouse" | "human" | "complete" | null;

export function guidedPause(s: SimState, steps: number): Pause {
  if (s.tasks.some((t) => t.status === "Open" && t.kind !== "supplier-response") || s.dependency.state === "Needs review") return "human";
  if (steps >= 5) return s.workOrder.status === "Logistics Ready" ? "complete" : "human";
  if (steps === 2) return "supplier";
  if (steps === 3) return "warehouse";
  return null;
}

/** Only internal actions are automatic. No email, receipt or authorization is synthesized. */
export function advanceGuided(snapshots: SimState[], automatic: boolean): SimState[] {
  let out = [...snapshots];
  do {
    const current = out.at(-1);
    const step = out.length - 1;
    if (!current || guidedPause(current, step)) break;
    const event = step === 0 ? ev.detect() : step === 1 ? ev.coordinate() : step === 4 ? ev.resume() : null;
    if (!event) break;
    out = [...out, applyEvent(current, event)];
  } while (automatic);
  return out;
}

export function injectGuided(snapshots: SimState[], event: SimEvent): SimState[] {
  const current = snapshots.at(-1);
  if (!current) return snapshots;
  const pause = guidedPause(current, snapshots.length - 1);
  if ((pause === "supplier" && event.type === "SUPPLIER_EMAIL") || (pause === "warehouse" && event.type === "GOODS_RECEIPT")) {
    return [...snapshots, applyEvent(current, event)];
  }
  return snapshots;
}