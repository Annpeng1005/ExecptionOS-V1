# ExceptionOS roadmap

- [x] Phase 1: engine, seed, interpreter, rules
  - [x] Supplier reply completes communication task only; blocker stays until verified + allocated
  - [x] Strengthened Logistics Ready guard (receipt, part, compatibility, stock, allocation, technician qualified/available, timing, downtime window); show outstanding requirements
  - [x] Idempotency for messages, receipts, tasks, allocations; full reset
  - [x] Interpreter failure leaves inventory + work order unchanged; B1 (email) and B2 (receipt) tested separately
- [x] Run happy-path + wrong-component tests before building UI

- Guided workflow must show per-step snapshot state, not final state retroactively (UI phase)
- [x] Phase 2: Client Brief (/), Live Workflow (/workflow), Deployment Lab (/lab)
  - Objective wording, 3 KPIs "Not measured — requires customer baseline", no hospital-cancellation claims
  - Purchasing-owned supplier follow-up; reply = unverified claim; no courier tracking
  - Three distinct milestones: supplier task completed / blocker resolved / Logistics Ready
  - Logistics Ready ≠ clinical sign-off; servicing, documentation, clinical release remain outstanding
  - Verify in browser: 5 steps, milestones, 6 scenarios, Reset
- [x] UX redesign: Agent Run (/), Business Case (/brief), Testing & Logs (/lab); one action at a time
- [ ] Final showcase: simplified workspace, explicit external-event pauses, concise Business Case, scenario evidence
- [ ] Verify 13 engine tests, both execution modes, wrong components, history, tab consistency and full reset
