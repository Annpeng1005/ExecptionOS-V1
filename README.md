
### From operational blockers to verified service readiness

**ExceptionOS** is an interactive proof of concept exploring how a medical-equipment service provider could coordinate supplier follow-ups, inventory verification, and field-service operations.

The project translates a fictional customer problem into a working simulation, demonstrating how to coordinate responsibilities across existing systems, verify information before taking action, and route exceptions to the appropriate teams.

**Live Demo:** Coming soon  
**2-Minute Walkthrough:** Coming soon

![ExceptionOS workflow](https://github.com/user-attachments/assets/579990d7-d755-4d31-bca2-d79834d5e6c4)

> **Project scope:** Built with Lovable and AI-assisted development using fictional data, simulated enterprise systems, a TypeScript workflow engine, and deterministic business rules. Supplier-message interpretation is simulated; no live language model or customer integrations are connected.

## 1. The Business Problem

A hospital has a scheduled ultrasound service visit, but replacement component **P-USB-410** is unavailable.

Resolving this dependency may involve Purchasing, a supplier, warehouse staff, and service operations working across separate systems.

**Customer objective:** Reduce avoidable service delays and manual coordination while maintaining accurate service commitments.

**Hypothesis:** Better coordination and clearer ownership across these systems could improve service readiness.

This hypothesis requires validation with real customer data.

## 2. How ExceptionOS Works

The simulation follows one service request, **SR-2041**.

```text
Missing component detected
          ↓
Purchasing follow-up created
          ↓
Supplier response received
          ↓
Warehouse verifies physical receipt
          ↓
Component allocated after required checks
          ↓
Work order becomes Logistics Ready
```

The system also handles exceptions:

- **Wrong component:** Keep the work order blocked and assign a reconciliation task.
- **Delayed shipment:** Flag the appointment at risk for dispatcher review.
- **Duplicate update:** Prevent duplicate business actions.
- **Interpretation failure:** Preserve the work order state and request human review.

**Important distinction:** Supplier confirmation is not verified inventory. Logistics Ready does not mean repair completed or equipment authorized for clinical use.

## 3. Implementation

The prototype uses three simulated enterprise systems:

| System | Responsibility |
|---|---|
| Field Service | Work orders, appointments and technician assignments |
| Inventory / ERP | Stock, physical receipts and allocations |
| Supplier Email | Supplier communication and unverified delivery claims |

A TypeScript workflow engine coordinates the process using event-based state transitions and deterministic business rules.

The simulated message interpreter is replaceable with a real model in a future implementation.

The application includes three views:

- **Agent Run:** Interactive workflow demonstrating actions and verified outcomes.
- **Business Case:** Customer hypothesis, implementation rationale and pilot measures.
- **Testing & Logs:** Executable scenarios, expected-versus-actual checks and event history.

## 4. Testing and Reliability

The project includes 13 automated unit tests and six interactive scenario categories covering successful execution and exception handling.

Tests evaluate outcomes such as:
- Correct component allocation
- Work-order state transitions
- Human review and escalation
- Duplicate-event handling
- Preservation of business rules when interpretation fails

The tests exercise the simulated workflow; they do not establish reliability in a production environment.

## 5. Business Value and Pilot Approach

The prototype demonstrates the coordination mechanism, not measured business improvement.

With a real customer, I would first validate the operational bottleneck and establish baselines for:

| Proposed measure | Business question |
|---|---|
| Blocker resolution time | How quickly can dependencies be resolved? |
| Correct workflow completion rate | Does the automation complete eligible work accurately? |
| Human coordination effort | How much manual work remains per request? |

I'd also evaluate exception rates, review burden, implementation costs and whether the workflow offers enough value beyond simpler automation.

**Proposed approach:** Discover → Test → Pilot → Measure → Improve.

## 6. What I Learned

Building ExceptionOS reinforced three practical deployment lessons:

1. **Clear ownership matters.** Every open dependency needs a responsible person, next action and deadline.
2. **Reliable actions require trustworthy evidence.** An unverified supplier message must not automatically change inventory or advance a service request.
3. **A working workflow is not the same as proven business value.** Successful deployment requires customer discovery, representative testing and measurable operational outcomes.

## 7. Limitations and Next Steps

ExceptionOS is a proof of concept, not a production-ready enterprise agent.

A real deployment would require customer-specific discovery, secure integrations, access permissions, durable workflow execution, production monitoring, and evaluation using representative customer data.

Potential future work includes introducing live model-based interpretation, learning from human corrections through regression tests, and measuring successful completion of eligible workflows with minimal intervention.

---

**Built as an independent learning project using Lovable and AI-assisted development.** The case, organisations, records and operational
