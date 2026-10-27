// Shared, typed data model for the ExceptionOS simulation. All data is fictional demo data.

export type SourceSystem = "Field Service" | "Inventory/ERP" | "Supplier Email" | "Agent" | "Rules";

export type WorkOrderStatus = "Scheduled" | "Blocked: Parts" | "At Risk" | "Logistics Ready";

export type DependencyState =
  | "Not detected"
  | "Open"
  | "Awaiting supplier"
  | "Awaiting receipt"
  | "Verified"
  | "Resolved"
  | "Needs review";

export type TaskKind =
  | "supplier-response"
  | "reconciliation"
  | "dispatcher-review"
  | "interpretation-review";

export interface WorkOrder {
  id: string;
  customer: string;
  site: string;
  equipment: string;
  appointment: string; // ISO local, demo clock
  technician: string;
  requiredPartId: string;
  status: WorkOrderStatus;
  businessImpact: string;
  /** Human-only states. The agent never writes these. */
  repairStatus: "Pending technician";
  clinicalRelease: "Not authorized — clinical engineering sign-off required";
}

export interface Dependency {
  id: string;
  workOrderId: string;
  partId: string;
  requiredOutcome: string;
  owner: string; // "Unassigned" until coordinated
  externalParty: string;
  deadline: string | null;
  escalationOwner: string;
  evidenceRequired: string;
  state: DependencyState;
}

export interface Task {
  id: string;
  kind: TaskKind;
  dependencyId: string;
  owner: string;
  title: string;
  deadline: string | null;
  sourceEventId: string;
}

export interface SupplierMessage {
  messageId: string;
  from: string;
  body: string;
  linkedTaskId: string | null;
}

/** Output of the interpreter. A claim — never verified stock. */
export interface SupplierClaim {
  messageId: string;
  partId: string;
  quantity: number;
  eta: string;
}

export interface GoodsReceipt {
  receiptId: string;
  partId: string;
  quantity: number;
  source: "warehouse" | string;
}

export interface InventoryItem {
  partId: string;
  description: string;
  onHand: number;
  allocated: number;
  compatibleWith: string[];
}

export interface Allocation {
  id: string;
  partId: string;
  workOrderId: string;
  receiptId: string;
}

export interface EventLogEntry {
  eventId: string;
  timestamp: string;
  sourceSystem: SourceSystem;
  input: string;
  action: string;
  resultingState: string;
  error?: string;
  humanReview?: string;
}

export interface SimState {
  clock: number; // minutes since demo start, deterministic
  workOrder: WorkOrder;
  dependency: Dependency;
  tasks: Task[];
  messages: SupplierMessage[];
  claims: SupplierClaim[];
  receipts: GoodsReceipt[];
  inventory: InventoryItem[];
  allocations: Allocation[];
  log: EventLogEntry[];
  processedEventIds: string[];
}

export type SimEvent =
  | { type: "DETECT"; eventId: string }
  | { type: "COORDINATE"; eventId: string }
  | { type: "SUPPLIER_EMAIL"; eventId: string; messageId: string; from: string; body: string }
  | {
      type: "GOODS_RECEIPT";
      eventId: string;
      receiptId: string;
      partId: string;
      quantity: number;
      source: string;
    }
  | { type: "RESUME"; eventId: string };
