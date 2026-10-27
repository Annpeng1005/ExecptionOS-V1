import type { SupplierClaim } from "./types";

export type InterpretResult =
  | { ok: true; claim: Omit<SupplierClaim, "messageId"> }
  | { ok: false; error: string };

/**
 * Replaceable interface. A real deployment could implement this with an LLM
 * behind a secure server function; the engine treats any output as an unverified claim.
 */
export interface MessageInterpreter {
  name: string;
  interpret(body: string): InterpretResult;
}

/** Simulated message interpreter — deterministic pattern extraction, NOT a live LLM. */
export const simulatedInterpreter: MessageInterpreter = {
  name: "Simulated message interpreter",
  interpret(body) {
    const part = body.match(/\bP-[A-Z]{3}-\d{3}\b/);
    const qty = body.match(/\b(?:qty|quantity)[:\s]*(\d+)\b/i) ?? body.match(/\b(\d+)\s*(?:unit|pc)/i);
    const eta = body.match(/\b(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})\b/);
    if (!part || !qty || !eta) {
      return { ok: false, error: "Could not extract part, quantity and ETA with confidence" };
    }
    return {
      ok: true,
      claim: { partId: part[0], quantity: Number(qty[1]), eta: `${eta[1]}T${eta[2]}` },
    };
  },
};

/** Used by Scenario E: interpretation service is unavailable. */
export const unavailableInterpreter: MessageInterpreter = {
  name: "Unavailable interpreter",
  interpret() {
    return { ok: false, error: "Interpretation service unavailable (simulated outage)" };
  },
};
