import { beforeEach, describe, expect, it } from "vitest";
import { advanceGuided, guidedPause, injectGuided } from "./guided";
import { createSeed } from "./seed";
import { ev } from "./scenarios";
import { demo } from "@/lib/demo-store";

describe("Explicit guided execution boundaries", () => {
  beforeEach(() => demo.reset());
  it("automatic run pauses before a supplier reply without fabricating external records", () => {
    const snaps = advanceGuided([createSeed()], true);
    expect(snaps).toHaveLength(3);
    expect(snaps.at(-1)?.messages).toEqual([]);
    expect(snaps.at(-1)?.receipts).toEqual([]);
    expect(snaps.at(-1)?.tasks[0]?.status).toBe("Open");
  });
  it("valid supplier reply closes only communication and pauses for physical receipt", () => {
    const snaps = advanceGuided(injectGuided(advanceGuided([createSeed()], true), ev.email()), true);
    expect(snaps).toHaveLength(4);
    expect(snaps.at(-1)?.tasks[0]?.status).toBe("Completed");
    expect(snaps.at(-1)?.workOrder.status).toBe("Blocked: Parts");
    expect(snaps.at(-1)?.allocations).toEqual([]);
    expect(snaps.at(-1)?.receipts).toEqual([]);
  });
  it("explicit correct receipt allows resume and keeps immediate historical states", () => {
    let snaps = advanceGuided([createSeed()], true);
    snaps = injectGuided(snaps, ev.email());
    snaps = injectGuided(snaps, ev.receipt());
    snaps = advanceGuided(snaps, true);
    expect(snaps.at(-1)?.workOrder.status).toBe("Logistics Ready");
    expect(snaps.at(-1)?.allocations).toHaveLength(1);
    expect(snaps[3]?.receipts).toEqual([]);
    expect(snaps[4]?.allocations).toEqual([]);
    expect(snaps.at(-1)?.workOrder.repairStatus).toBe("Pending technician");
  });
  it("wrong supplier component pauses for human review without clearing the blocker", () => {
    const snaps = advanceGuided(injectGuided(advanceGuided([createSeed()], true), ev.email("P-USB-405")), true);
    const current = snaps.at(-1);
    expect(current?.workOrder.status).toBe("Blocked: Parts");
    expect(current?.allocations).toEqual([]);
    expect(current && guidedPause(current, snaps.length - 1)).toBe("human");
  });
  it("wrong receipt never allocates the missing component", () => {
    let snaps = injectGuided(advanceGuided([createSeed()], true), ev.email());
    snaps = advanceGuided(injectGuided(snaps, ev.receipt("P-USB-405")), true);
    expect(snaps.at(-1)?.workOrder.status).toBe("Blocked: Parts");
    expect(snaps.at(-1)?.allocations).toEqual([]);
  });
  it("Reset Demo restores the entire baseline and clears isolated test results", () => {
    demo.run(); demo.injectSupplier(); demo.injectReceipt(); demo.run(); demo.runTests(); demo.reset();
    expect(demo.get().snapshots).toEqual([createSeed()]);
    expect(demo.get().results).toEqual({});
  });
});