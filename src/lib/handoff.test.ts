import { describe, expect, it } from "vitest";
import { scenarios, runScenario } from "@/engine/scenarios";
import { createSeed } from "@/engine/seed";
import { handoff, inventoryLines, operationalSummary, outcomeLabel } from "./handoff";

const final = (id: string) => runScenario(scenarios.find((s) => s.id === id)!).final;

describe("handoff reporting", () => {
  it("B2 handoff names Sam Whitfield and the mismatch", () => {
    expect(handoff(final("B2"))?.sentence).toBe(
      "Warehouse received P-USB-405, but P-USB-410 is required. Sam Whitfield, Inventory Lead must reconcile the mismatch. The work order remains blocked, and no component has been allocated.",
    );
  });
  it("B2 inventory lines identify each part", () => {
    expect(inventoryLines(final("B2")).map((l) => l.text)).toEqual([
      "Required part P-USB-410: 0 available, 0 allocated.",
      "Incorrect part P-USB-405: 1 received, 0 allocated.",
    ]);
  });
  it("B1 summary assigns Purchasing", () => {
    expect(operationalSummary(final("B1"), createSeed())).toBe(
      "Incorrect supplier component detected. Work order remains blocked, no allocation occurred, and Purchasing was assigned to reconcile the mismatch.",
    );
    expect(handoff(final("B1"))?.owner).toBe("Dana Ortiz, Purchasing");
  });
  it("labels distinguish safeguard, review and error", () => {
    expect(outcomeLabel(final("B2"))).toBe("Safeguard worked / Validation blocked");
    expect(outcomeLabel(final("C"))).toBe("Human review required");
    expect(outcomeLabel(final("E"))).toBe("Execution error");
    expect(outcomeLabel(final("A"))).toBe("Service logistics ready");
  });
});
