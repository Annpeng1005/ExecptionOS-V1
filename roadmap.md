# ExceptionOS roadmap

- [ ] Phase 1: engine, seed, interpreter, rules
  - [ ] Supplier reply completes communication task only; blocker stays until verified + allocated
  - [ ] Strengthened Logistics Ready guard (receipt, part, compatibility, stock, allocation, technician qualified/available, timing, downtime window); show outstanding requirements
  - [ ] Idempotency for messages, receipts, tasks, allocations; full reset
  - [ ] Interpreter failure leaves inventory + work order unchanged; B1 (email) and B2 (receipt) tested separately
- [ ] Run happy-path + wrong-component tests before building UI
- [ ] Phase 2–5 (UI, remaining scenarios, polish) — awaiting user go-ahead after Phase 1
- Guided workflow must show per-step snapshot state, not final state retroactively (UI phase)
