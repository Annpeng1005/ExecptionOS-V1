import { DEMO_START } from "./seed";
import type { SimState } from "./types";

export const available = (s: SimState, partId: string) => {
  const item = s.inventory.find((i) => i.partId === partId);
  return item ? item.onHand - item.allocated : 0;
};

export const isCompatible = (s: SimState, partId: string) => {
  const item = s.inventory.find((i) => i.partId === partId);
  return !!item && item.compatibleWith.some((m) => s.workOrder.equipment.includes(m));
};

export const demoNow = (s: SimState) => new Date(new Date(DEMO_START).getTime() + s.clock * 60_000);

export const etaThreatensAppointment = (eta: string, appointment: string) => {
  // Part must arrive at least 2h before the visit for receipt + verification.
  const buffer = 2 * 60 * 60 * 1000;
  return new Date(eta).getTime() > new Date(appointment).getTime() - buffer;
};

export interface Guard {
  label: string;
  pass: boolean;
}

/** Guards that must pass before the agent may allocate the part. */
export function allocationGuards(s: SimState): Guard[] {
  const part = s.workOrder.requiredPartId;
  return [
    { label: "Dependency verified by goods receipt", pass: s.dependency.state === "Verified" || s.dependency.state === "Resolved" },
    { label: `Authorized warehouse receipt for ${part}`, pass: s.receipts.some((r) => r.partId === part && r.source === "warehouse") },
    { label: `${part} compatible with equipment`, pass: isCompatible(s, part) },
    {
      label: `Unallocated stock of ${part} ≥ 1`,
      pass: available(s, part) >= 1 || s.allocations.some((a) => a.workOrderId === s.workOrder.id),
    },
  ];
}

/** Every requirement for Logistics Ready. Missing information = failing guard. */
export function readinessGuards(s: SimState): Guard[] {
  const wo = s.workOrder;
  return [
    ...allocationGuards(s),
    { label: `${wo.requiredPartId} allocated to ${wo.id}`, pass: s.allocations.some((a) => a.workOrderId === wo.id && a.partId === wo.requiredPartId) },
    { label: "Technician qualified for equipment", pass: wo.technicianQualified === true },
    { label: "Technician available at appointment", pass: wo.technicianAvailable === true },
    { label: "Appointment still in the future", pass: demoNow(s).getTime() < new Date(wo.appointment).getTime() },
    { label: "Downtime window confirmed with site", pass: wo.downtimeWindowConfirmed === true },
  ];
}
