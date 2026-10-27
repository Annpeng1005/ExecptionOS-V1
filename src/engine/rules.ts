import type { SimState } from "./types";

export const available = (s: SimState, partId: string) => {
  const item = s.inventory.find((i) => i.partId === partId);
  return item ? item.onHand - item.allocated : 0;
};

export const isCompatible = (s: SimState, partId: string) => {
  const item = s.inventory.find((i) => i.partId === partId);
  return !!item && item.compatibleWith.some((m) => s.workOrder.equipment.includes(m));
};

export const etaThreatensAppointment = (eta: string, appointment: string) => {
  // Part must arrive at least 2h before the visit for receipt + verification.
  const buffer = 2 * 60 * 60 * 1000;
  return new Date(eta).getTime() > new Date(appointment).getTime() - buffer;
};

/** Every guard that must pass before the agent may allocate and mark Logistics ready. */
export function allocationGuards(s: SimState) {
  const part = s.workOrder.requiredPartId;
  return [
    { label: "Dependency verified by goods receipt", pass: s.dependency.state === "Verified" },
    {
      label: `Warehouse receipt exists for ${part}`,
      pass: s.receipts.some((r) => r.partId === part && r.source === "warehouse"),
    },
    { label: `${part} compatible with equipment`, pass: isCompatible(s, part) },
    { label: `Available stock of ${part} ≥ 1`, pass: available(s, part) >= 1 },
    { label: "No existing allocation for this work order", pass: s.allocations.length === 0 },
  ];
}
