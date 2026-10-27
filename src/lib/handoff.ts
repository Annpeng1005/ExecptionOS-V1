import type { SimState, Task } from "@/engine/types";

const clean = (n: string) => n.replace(" (demo)", "");
const openReview = (s: SimState): Task | undefined =>
  s.tasks.find((t) => t.status === "Open" && t.kind !== "supplier-response");

/** Per-component quantities, derived from inventory and receipt records. */
export function inventoryLines(s: SimState) {
  const required = s.workOrder.requiredPartId;
  return s.inventory
    .filter((i) => i.partId === required || s.receipts.some((r) => r.partId === i.partId))
    .map((i) => ({
      partId: i.partId,
      required: i.partId === required,
      received: s.receipts.filter((r) => r.partId === i.partId).reduce((n, r) => n + r.quantity, 0),
      available: i.onHand - i.allocated,
      allocated: i.allocated,
      text:
        i.partId === required
          ? `Required part ${i.partId}: ${i.onHand - i.allocated} available, ${i.allocated} allocated.`
          : `Incorrect part ${i.partId}: ${s.receipts.filter((r) => r.partId === i.partId).reduce((n, r) => n + r.quantity, 0)} received, ${i.allocated} allocated.`,
    }));
}

export interface Handoff {
  reason: string;
  mismatch: string;
  owner: string;
  action: string;
  blocked: string;
  sentence: string;
}

/** Human handoff summary derived from the open review task and records. */
export function handoff(s: SimState): Handoff | null {
  const t = openReview(s);
  if (!t) return null;
  const req = s.workOrder.requiredPartId;
  const owner = clean(t.owner);
  const alloc = s.allocations.length ? `${s.allocations.length} component allocated` : "no component has been allocated";
  const blocked = `The work order remains ${s.workOrder.status.toLowerCase()}, and ${alloc}.`;
  if (t.kind === "reconciliation") {
    const receipt = s.receipts.find((r) => r.partId !== req);
    const claim = s.claims.find((c) => c.partId !== req);
    const mismatch = receipt
      ? `Warehouse received ${receipt.partId}, but ${req} is required.`
      : `Supplier confirmed ${claim?.partId ?? "a different part"}, but ${req} is required.`;
    const action = receipt ? "reconcile the mismatch" : "confirm the correct component with the supplier";
    return { reason: "Component mismatch", mismatch, owner, action, blocked, sentence: `${mismatch} ${owner} must ${action}. ${blocked}` };
  }
  if (t.kind === "dispatcher-review") {
    const mismatch = `Supplier ETA ${s.claims[0]?.eta.replace("T", " ") ?? ""} is after the ${s.workOrder.appointment.replace("T", " ")} appointment.`;
    const action = "decide whether to keep or reschedule the appointment";
    return { reason: "Delivery threatens appointment", mismatch, owner, action, blocked, sentence: `${mismatch} ${owner} must ${action}. ${blocked}` };
  }
  const mismatch = "The supplier message could not be interpreted.";
  const action = "review the supplier message manually";
  return { reason: "Interpretation failed", mismatch, owner, action, blocked, sentence: `${mismatch} ${owner} must ${action}. ${blocked}` };
}

export type OutcomeLabel = "Service logistics ready" | "Safeguard worked / Validation blocked" | "Human review required" | "Execution error";

/** Classifies what a final state represents. Does not affect pass/fail. */
export function outcomeLabel(s: SimState): OutcomeLabel {
  if (s.workOrder.status === "Logistics Ready") return "Service logistics ready";
  const t = openReview(s);
  if (t?.kind === "interpretation-review") return "Execution error";
  if (t?.kind === "reconciliation") return "Safeguard worked / Validation blocked";
  return "Human review required";
}

/** One-sentence operational result for a scenario's final state. */
export function operationalSummary(s: SimState, initial: SimState): string {
  const req = s.workOrder.requiredPartId;
  const noAlloc = s.allocations.length === 0 ? "no allocation occurred" : `${s.allocations.length} allocation recorded`;
  const t = openReview(s);
  if (s.workOrder.status === "Logistics Ready")
    return `Correct component ${req} verified and allocated once; all logistics prerequisites passed and the service visit can proceed.`;
  if (t?.kind === "reconciliation" && s.receipts.some((r) => r.partId !== req))
    return `Incorrect component received at the warehouse. Work order remains blocked, ${noAlloc}, and Inventory review is required.`;
  if (t?.kind === "reconciliation")
    return `Incorrect supplier component detected. Work order remains blocked, ${noAlloc}, and Purchasing was assigned to reconcile the mismatch.`;
  if (t?.kind === "dispatcher-review")
    return `Late supplier ETA flagged the visit at risk. Appointment unchanged, ${noAlloc}, and Dispatch must decide on the schedule.`;
  if (t?.kind === "interpretation-review") {
    const same = JSON.stringify(s.inventory) === JSON.stringify(initial.inventory);
    return `Supplier message could not be interpreted. Work order and inventory ${same ? "unchanged" : "changed"}, error logged, and the Service Coordinator must review it.`;
  }
  return `Work order is ${s.workOrder.status}; ${noAlloc}.`;
}
