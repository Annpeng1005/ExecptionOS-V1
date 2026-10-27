import { describe, expect, it } from "vitest";
import { applyEvent, runEvents } from "./engine";
import { createSeed } from "./seed";
import { ev, runScenario, scenarios } from "./scenarios";

describe("ExceptionOS engine", () => {
  for (const sc of scenarios) {
    it(`Scenario ${sc.id}: ${sc.title}`, () => {
      const r = runScenario(sc);
      for (const c of r.checks) expect(c.actual, c.label).toBe(c.expected);
    });
  }

  it("a supplier email alone never changes verified stock", () => {
    const s = runEvents(createSeed(), [ev.detect(), ev.coordinate(), ev.email()]);
    expect(s.inventory.find((i) => i.partId === "P-USB-410")!.onHand).toBe(0);
    expect(applyEvent(s, ev.resume()).allocations).toHaveLength(0);
  });

  it("receipts from a non-warehouse source are rejected", () => {
    const s = runEvents(createSeed(), [
      ev.detect(), ev.coordinate(), ev.email(),
      { type: "GOODS_RECEIPT", eventId: "X", receiptId: "GR-X", partId: "P-USB-410", quantity: 1, source: "supplier-email" },
      ev.resume(),
    ]);
    expect(s.receipts).toHaveLength(0);
    expect(s.workOrder.status).toBe("Blocked: Parts");
  });

  it("reset returns to the same baseline", () => {
    const s = runEvents(createSeed(), scenarios[0].events);
    expect(s).not.toEqual(createSeed());
    expect(createSeed()).toEqual(createSeed());
  });
});
