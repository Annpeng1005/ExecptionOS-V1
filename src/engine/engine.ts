import { DEMO_START, PEOPLE } from "./seed";
import { simulatedInterpreter, type MessageInterpreter } from "./interpreter";
import { allocationGuards, available, demoNow, etaThreatensAppointment, isCompatible, readinessGuards } from "./rules";
import type { EventLogEntry, SimEvent, SimState, SourceSystem, Task } from "./types";

export interface EngineOptions {
  interpreter?: MessageInterpreter;
}

const clone = <T,>(v: T): T => structuredClone(v);

function stamp(s: SimState) {
  const d = demoNow(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
void DEMO_START;

function summary(s: SimState) {
  return `WO ${s.workOrder.status} · DEP ${s.dependency.state}`;
}

function addTask(s: SimState, t: Omit<Task, "id" | "status">) {
  // Idempotent: stable ID per (kind, dependency) — never create the same task twice.
  const id = `TSK-${t.dependencyId}-${t.kind}`;
  if (s.tasks.some((x) => x.id === id)) return false;
  s.tasks.push({ ...t, id, status: "Open" });
  return true;
}

/** Pure reducer. Returns a new state; never mutates input. */
export function applyEvent(prev: SimState, event: SimEvent, opts: EngineOptions = {}): SimState {
  const interpreter = opts.interpreter ?? simulatedInterpreter;
  const s = clone(prev);
  s.clock += 7;
  const log = (
    sourceSystem: SourceSystem,
    input: string,
    action: string,
    extra: Partial<EventLogEntry> = {},
  ) =>
    s.log.push({
      eventId: event.eventId,
      timestamp: stamp(s),
      sourceSystem,
      input,
      action,
      resultingState: summary(s),
      ...extra,
    });

  if (s.processedEventIds.includes(event.eventId)) {
    log("Rules", `Event ${event.eventId} re-delivered`, "Ignored duplicate event — no action taken", {
      error: "Duplicate event",
    });
    return s;
  }
  s.processedEventIds.push(event.eventId);
  const part = s.workOrder.requiredPartId;
  const dep = s.dependency;

  switch (event.type) {
    case "DETECT": {
      if (available(s, part) >= 1) {
        log("Inventory/ERP", `Read ${s.workOrder.id}`, "Part available — no blocker");
        break;
      }
      s.workOrder.status = "Blocked: Parts";
      dep.state = "Open";
      log("Inventory/ERP", `Read ${s.workOrder.id}; ${part} available = 0`, "Opened parts dependency DEP-7001");
      break;
    }
    case "COORDINATE": {
      if (dep.state !== "Open") {
        log("Rules", "Coordinate requested", "Rejected — dependency not open", { error: `Dependency is ${dep.state}` });
        break;
      }
      dep.owner = PEOPLE.purchasing;
      dep.deadline = "2026-10-26T15:00";
      dep.state = "Awaiting supplier";
      addTask(s, {
        kind: "supplier-response",
        dependencyId: dep.id,
        owner: PEOPLE.purchasing,
        title: `Obtain confirmed ship date for ${part} from ${dep.externalParty}`,
        deadline: dep.deadline,
        sourceEventId: event.eventId,
      });
      log("Agent", "Dependency DEP-7001 open", `Created supplier-response task; owner ${PEOPLE.purchasing}`);
      break;
    }
    case "SUPPLIER_EMAIL": {
      if (s.messages.some((m) => m.messageId === event.messageId)) {
        log("Supplier Email", `Message ${event.messageId}`, "Duplicate message — no new claim or task", {
          error: "Duplicate message",
        });
        break;
      }
      const linked = s.tasks.find((t) => t.kind === "supplier-response");
      s.messages.push({ messageId: event.messageId, from: event.from, body: event.body, linkedTaskId: linked?.id ?? null });
      const res = interpreter.interpret(event.body);
      if (!res.ok) {
        addTask(s, {
          kind: "interpretation-review",
          dependencyId: dep.id,
          owner: PEOPLE.coordinator,
          title: `Manually review supplier message ${event.messageId}`,
          deadline: null,
          sourceEventId: event.eventId,
        });
        log("Supplier Email", `Message ${event.messageId}`, "Interpretation failed — workflow not advanced", {
          error: res.error,
          humanReview: PEOPLE.coordinator,
        });
        break;
      }
      const claim = { ...res.claim, messageId: event.messageId };
      s.claims.push(claim);
      if (claim.partId !== part) {
        dep.state = "Needs review";
        addTask(s, {
          kind: "reconciliation",
          dependencyId: dep.id,
          owner: PEOPLE.purchasing,
          title: `Supplier quoted ${claim.partId}; ${part} required — confirm with supplier`,
          deadline: null,
          sourceEventId: event.eventId,
        });
        log("Supplier Email", `Claim: ${claim.quantity} × ${claim.partId}, ETA ${claim.eta}`, "Part mismatch — reconciliation task created", {
          error: `Expected ${part}`,
          humanReview: PEOPLE.purchasing,
        });
        break;
      }
      // A valid reply completes the communication task only. The parts blocker stays open.
      const commTask = s.tasks.find((t) => t.kind === "supplier-response");
      if (commTask) commTask.status = "Completed";
      dep.state = "Awaiting receipt";
      if (etaThreatensAppointment(claim.eta, s.workOrder.appointment)) {
        s.workOrder.status = "At Risk";
        addTask(s, {
          kind: "dispatcher-review",
          dependencyId: dep.id,
          owner: PEOPLE.dispatcher,
          title: `ETA ${claim.eta} threatens appointment ${s.workOrder.appointment} — decide on schedule`,
          deadline: "2026-10-26T17:00",
          sourceEventId: event.eventId,
        });
        log("Supplier Email", `Claim: ${claim.quantity} × ${claim.partId}, ETA ${claim.eta}`, "Flagged appointment at risk; appointment NOT changed", {
          humanReview: PEOPLE.dispatcher,
        });
        break;
      }
      log("Supplier Email", `Claim: ${claim.quantity} × ${claim.partId}, ETA ${claim.eta}`, "Recorded unverified claim; awaiting warehouse receipt");
      break;
    }
    case "GOODS_RECEIPT": {
      if (event.source !== "warehouse") {
        log("Rules", `Receipt ${event.receiptId} from ${event.source}`, "Rejected — not an authorized receipt source", {
          error: "Unauthorized source",
        });
        break;
      }
      if (s.receipts.some((r) => r.receiptId === event.receiptId)) {
        log("Inventory/ERP", `Receipt ${event.receiptId}`, "Duplicate receipt — stock unchanged", { error: "Duplicate receipt" });
        break;
      }
      s.receipts.push({ receiptId: event.receiptId, partId: event.partId, quantity: event.quantity, source: event.source });
      const item = s.inventory.find((i) => i.partId === event.partId);
      if (item) item.onHand += event.quantity;
      if (event.partId !== part || !isCompatible(s, event.partId)) {
        dep.state = "Needs review";
        addTask(s, {
          kind: "reconciliation",
          dependencyId: dep.id,
          owner: PEOPLE.inventoryLead,
          title: `Received ${event.partId}; ${part} required — reconcile with supplier`,
          deadline: null,
          sourceEventId: event.eventId,
        });
        log("Inventory/ERP", `GR ${event.receiptId}: ${event.quantity} × ${event.partId}`, "Wrong component — not allocated; blocker remains", {
          error: `Expected ${part}`,
          humanReview: PEOPLE.inventoryLead,
        });
        break;
      }
      if (dep.state === "Needs review") {
        log("Inventory/ERP", `GR ${event.receiptId}: ${event.quantity} × ${event.partId}`, "Stock recorded; dependency still under review");
        break;
      }
      dep.state = "Verified";
      log("Inventory/ERP", `GR ${event.receiptId}: ${event.quantity} × ${event.partId}`, "Verified ID, quantity, compatibility and stock");
      break;
    }
    case "RESUME": {
      const allocFailed = allocationGuards(s).filter((g) => !g.pass);
      if (allocFailed.length) {
        log("Rules", "Resume requested", "Blocked — allocation prerequisites not met", {
          error: allocFailed.map((f) => f.label).join("; "),
        });
        break;
      }
      // Idempotent allocation: stable ID per work order + part.
      const allocId = `ALC-${s.workOrder.id}-${part}`;
      if (!s.allocations.some((a) => a.id === allocId)) {
        const receipt = s.receipts.find((r) => r.partId === part)!;
        s.allocations.push({ id: allocId, partId: part, workOrderId: s.workOrder.id, receiptId: receipt.receiptId });
        s.inventory.find((i) => i.partId === part)!.allocated += 1;
      }
      const readyFailed = readinessGuards(s).filter((g) => !g.pass);
      if (readyFailed.length) {
        log("Rules", `Readiness check for ${s.workOrder.id}`, "Part allocated; blocker kept — requirements outstanding", {
          error: readyFailed.map((f) => f.label).join("; "),
          humanReview: PEOPLE.coordinator,
        });
        break;
      }
      dep.state = "Resolved";
      s.workOrder.status = "Logistics Ready";
      log("Field Service", `All readiness guards passed for ${s.workOrder.id}`, "Allocated part; status → Logistics Ready (repair & clinical release remain human)");
      break;
    }
  }
  return s;
}

export function runEvents(start: SimState, events: SimEvent[], opts?: EngineOptions) {
  return events.reduce((st, e) => applyEvent(st, e, opts), start);
}
