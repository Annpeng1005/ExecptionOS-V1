import type { SimState } from "./types";

export const REQUIRED_PART = "P-USB-410";
export const DEMO_START = "2026-10-26T09:00"; // Monday, demo clock
export const APPOINTMENT = "2026-10-27T13:00"; // Tuesday 13:00

/** Baseline state. Every reset returns a fresh deep copy of this. */
export function createSeed(): SimState {
  return {
    clock: 0, // demo "now" = DEMO_START + clock minutes
    workOrder: {
      id: "SR-2041",
      customer: "Lakeshore General Hospital (demo)",
      site: "Diagnostic Imaging, Level 2",
      equipment: "Ultrasound system US-7 · serial DEMO-88213",
      appointment: APPOINTMENT,
      technician: "Priya Raman (demo)",
      technicianQualified: true,
      technicianAvailable: true,
      downtimeWindowConfirmed: true,
      requiredPartId: REQUIRED_PART,
      status: "Scheduled",
      businessImpact: "Imaging room capacity reduced until service visit is completed.",
      repairStatus: "Pending technician",
      clinicalRelease: "Not authorized — clinical engineering sign-off required",
    },
    dependency: {
      id: "DEP-7001",
      workOrderId: "SR-2041",
      partId: REQUIRED_PART,
      requiredOutcome: "1 × P-USB-410 verified in stock and allocated to SR-2041",
      owner: "Unassigned",
      externalParty: "Northbay Medical Parts (demo)",
      deadline: null,
      escalationOwner: "Marcus Lee, Service Ops Lead (demo)",
      evidenceRequired: "Authorized warehouse goods receipt for P-USB-410",
      state: "Not detected",
    },
    tasks: [],
    messages: [],
    claims: [],
    receipts: [],
    inventory: [
      {
        partId: "P-USB-410",
        description: "Transducer interface board, US-7",
        onHand: 0,
        allocated: 0,
        compatibleWith: ["US-7"],
      },
      {
        partId: "P-USB-405",
        description: "Transducer interface board, US-5",
        onHand: 0,
        allocated: 0,
        compatibleWith: ["US-5"],
      },
    ],
    allocations: [],
    log: [],
    processedEventIds: [],
  };
}

export const PEOPLE = {
  purchasing: "Dana Ortiz, Purchasing (demo)",
  inventoryLead: "Sam Whitfield, Inventory Lead (demo)",
  dispatcher: "Jordan Kim, Dispatch (demo)",
  coordinator: "Alex Moreau, Service Coordinator (demo)",
};
