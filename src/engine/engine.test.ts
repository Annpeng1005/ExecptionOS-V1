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
    const s = runEvents(createSeed(), scenarios[0]!.events);
    expect(s).not.toEqual(createSeed());
    expect(createSeed()).toEqual(createSeed());
  });
});

describe("corrections", () => {
  it("valid supplier reply completes the task but the work order stays blocked", () => {
    const s = runEvents(createSeed(), [ev.detect(), ev.coordinate(), ev.email()]);
    expect(s.tasks.find((t) => t.kind === "supplier-response")!.status).toBe("Completed");
    expect(s.workOrder.status).toBe("Blocked: Parts");
    expect(s.dependency.state).toBe("Awaiting receipt");
  });

  it("missing technician availability keeps the blocker and names the requirement", () => {
    const seed = createSeed();
    seed.workOrder.technicianAvailable = false;
    const s = runEvents(seed, [ev.detect(), ev.coordinate(), ev.email(), ev.receipt(), ev.resume()]);
    expect(s.workOrder.status).toBe("Blocked: Parts");
    expect(s.log.at(-1)!.error).toContain("Technician available");
  });

  it("unconfirmed downtime window keeps the blocker", () => {
    const seed = createSeed();
    seed.workOrder.downtimeWindowConfirmed = false;
    const s = runEvents(seed, [ev.detect(), ev.coordinate(), ev.email(), ev.receipt(), ev.resume()]);
    expect(s.workOrder.status).toBe("Blocked: Parts");
  });

  it("repeated resume never allocates twice", () => {
    const s = runEvents(createSeed(), [ev.detect(), ev.coordinate(), ev.email(), ev.receipt(), ev.resume(1), ev.resume(2), ev.resume(3)]);
    expect(s.allocations).toHaveLength(1);
    expect(s.inventory.find((i) => i.partId === "P-USB-410")!.allocated).toBe(1);
  });
});
