# ExceptionOS — Build Plan

An interactive deployment case study: one work order (SR-2041) blocked by a missing part (P-USB-410), coordinated by a simulated agent across three mock systems. Frontend-only, deterministic, fully testable. No backend, no live LLM.

## 1. Architecture

```text
src/engine/            pure TypeScript, no React
  types.ts             shared typed data model + state enums
  seed.ts              baseline mock data (fictional, labeled demo)
  interpreter.ts       SimulatedMessageInterpreter (replaceable interface)
  rules.ts             deterministic guards (allocation, transitions, ETA risk)
  engine.ts            reducer: (state, event) -> { state, logEntry }
  scenarios.ts         Scenario A–E as event sequences + expected-state checks
  engine.test.ts       vitest suite running the same scenarios
src/store/             one React context wrapping the reducer (shared by all tabs)
src/routes/            index (Client Brief), workflow, lab
```

Data flow (the demo story): **AI interpretation -> verified business records -> deterministic rules -> authorized action.** The interpreter only produces a `SupplierClaim`; it cannot write inventory. Only a `GoodsReceiptEvent` from the warehouse source creates verified stock.

## 2. Shared data model (summary)

- `WorkOrder` { id SR-2041, customer, equipment, appointment, status, dependencyIds }
  - status: `Open -> Blocked:Parts -> AtRisk -> LogisticsReady` (repair/clinical states exist but are **human-only**: `RepairCompleted`, `ClinicalRelease` never set by agent)
- `Dependency` { id, type, requiredOutcome, owner|`Unassigned`, externalParty, deadline, escalationOwner, evidenceRequired, state: `Open | AwaitingSupplier | ClaimReceived | AwaitingReceipt | Verified | Resolved | NeedsReview` }
- `Task` { id, dependencyId, owner, kind: supplier-response | reconciliation | dispatcher-review | interpretation-review, sourceEventId }
- `SupplierMessage` { messageId, body, linkedTaskId } -> `SupplierClaim` { partId, qty, eta, confidence } (unverified)
- `GoodsReceipt` { receiptId, partId, qty, source: "warehouse" }
- `InventoryItem` { partId, onHand, allocated, compatibleWith[] }
- `Allocation` { id, partId, workOrderId, receiptId }
- `EventLogEntry` { eventId, timestamp, sourceSystem, input, action, resultingState, error?, humanReview? }
- `processedEventIds: Set` for idempotency

## 3. Source-of-truth ownership

| Data | Authoritative system | Agent may |
|---|---|---|
| Work orders, appointments, bookings | Mock Field Service | Set Blocked/AtRisk/LogisticsReady; never reschedule |
| Stock, goods receipts, allocations | Mock Inventory/ERP | Allocate only after verified receipt passes rules |
| Supplier communications | Mock Supplier Email | Read + interpret; output is a claim, never stock |
| Repair completion, clinical release | Human (technician / biomed) | Nothing — displayed as pending human action |

## 4. State transitions

Happy path (A):
```text
Detect:     WO Open -> Blocked:Parts; Dep Open (inventory onHand=0)
Coordinate: Task created (owner Purchasing, deadline, supplier contact); Dep AwaitingSupplier
Interpret:  Email -> Claim{P-USB-410, 1, ETA Mon}; Dep ClaimReceived -> AwaitingReceipt (stock unchanged)
Verify:     Receipt{P-USB-410, 1, warehouse} -> onHand=1, compatible; Dep Verified
Resume:     Allocation created; Dep Resolved; WO LogisticsReady (repair + clinical still pending human)
```

Wrong component (B):
```text
Interpret/Verify: claim or receipt part = P-USB-405
Rule: partId != required -> no allocation; Dep NeedsReview; reconciliation Task (owner Inventory lead)
WO stays Blocked:Parts
```

Others: C (ETA after appointment -> WO AtRisk + dispatcher-review task, appointment unchanged); D (same messageId twice -> second logged as duplicate, no new task/claim); E (interpreter returns error/invalid -> no state advance, interpretation-review task, logged).

## 5. Wireframes

```text
[Header: ExceptionOS · Client Brief | Live Workflow | Deployment Lab · Reset Demo]

Client Brief:  objective banner | hypothesis | why this approach (AI vs rules vs humans)
               assumptions | questions to investigate | 3 pilot measures ("Not measured")
               Discover->...->Expand strip | [Explore Workflow]

Live Workflow: left: SR-2041 card (customer, equipment, appt, status, missing part,
               impact, owner, supplier, next action, deadline, done / waiting)
               right: 5-stage stepper; each stage = trigger, agent action, system,
               resulting state, next action; [Run stage] executes real reducer step;
               "Completed" only when post-condition check passes.
               footer: Repair + Clinical release = "Human action required"

Deployment Lab: 3 system panels (live state) | scenario runner A–E with
               expected vs actual table + Run all | compact event log table
```

## 6. Tests

Vitest suite in `engine.test.ts` executes each scenario from a fresh seed and asserts:
- A reaches LogisticsReady with exactly 1 allocation; clinical release never set.
- Email alone never changes `onHand`.
- B: 0 allocations, WO still Blocked, reconciliation task exists.
- C: WO AtRisk, appointment time unchanged, dispatcher task exists.
- D: task/claim/allocation counts identical after duplicate.
- E: state unchanged except log + review task.
- Reset equals seed (deep equal).
The Lab scenario runner calls the same `runScenario()` + check functions in-browser, so displayed pass/fail is computed, never hardcoded.

## 7. Ambiguities / decisions

- "Tabs" implemented as three routes (`/`, `/workflow`, `/lab`) with a shared tab bar; state lives in one in-memory store so it stays consistent across views. State resets on page reload (acceptable for a demo; no backend per brief).
- Scenario runs in the Lab use an isolated copy of state so they don't disturb the Live Workflow; a "Load into live view" option is not included to keep scope tight.
- Scenario B covers both variants (wrong part in email, wrong part in receipt) as two checks.
- Dates are fixed relative to a demo "today" so ETA risk is deterministic.

## 8. Build phases

1. Engine + seed + interpreter + rules. 2. Scenarios A/B, event log, reset, tests. 3. Three views. 4. Scenarios C–E + in-app test report. 5. Visual polish (neutral + restrained teal, distinctive serif/sans pairing) and a short README section with summary/limitations/pilot needs.
