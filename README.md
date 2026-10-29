# ExceptionOS

**From disconnected service updates to verified service readiness.**

An interactive proof of concept exploring how a medical-equipment service provider could coordinate supplier follow-ups, inventory verification and field-service operations.

[Watch the video walkthrough](https://www.loom.com/share/f0bf98ca3eba408982d6932ded4f8c77) · **Interactive demo:** Add published application link

*Independent project built with Lovable and AI-assisted development. All customer scenarios and operational records are fictional.*

## 1. Why I Built This

In 2024, I waited six hours in an emergency department for a chest X-ray. When I asked about the delay, a nurse told me the X-ray machine was broken and needed servicing.

That experience stayed with me.

Later, while researching medical-equipment availability in Canada, I found that a national imaging inventory reported an average of **87.5 hours of annual unplanned CT downtime** among 166 responding sites in 2022–2023. One British Columbia site also reported prolonged downtime associated with delayed replacement-part delivery.

[Source: Canadian Medical Imaging Inventory 2022–2023 — CT, published 2024](https://www.ncbi.nlm.nih.gov/books/NBK607343/)

My hospital experience and these CT findings concern different equipment and situations; neither establishes that coordination caused the delays.

But they raised a question:

**When equipment needs servicing, how much of the work happens between existing systems—and could some of that coordination be made more reliable?**

ExceptionOS explores one potential answer.

## 2. The Customer Problem

Imagine a medical-equipment service provider supporting hospitals and clinics.

At Lakeshore General Hospital, an ultrasound service visit is scheduled for Tuesday at 1:00 p.m., but replacement component **P-USB-410** is missing.

Multiple teams are involved:

- **Purchasing:** Obtains supplier updates.
- **Supplier:** Communicates availability and delivery information.
- **Warehouse:** Confirms physical receipt and correct component identity.
- **Service Operations:** Tracks readiness and coordinates the visit.

The company may already have software for each responsibility. The opportunity lies in coordinating the dependencies between them.

### Illustrative Current Workflow

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/d7c8355f-fa4f-45b6-8295-664b8efa350c" />


**What we are hypothesizing:** The coordinator may need to chase updates, reconcile information across systems and determine who should act next.

This is an illustrative operating process, not a verified description of any specific provider. A real deployment would begin by mapping the customer's actual workflow.

### Proposed ExceptionOS Workflow

*Insert proposed-workflow diagram here.*

ExceptionOS models a shared workflow that:

1. Detects a missing component.
2. Creates a named Purchasing follow-up.
3. Records the supplier's response.
4. Verifies authorized warehouse evidence before changing inventory status.
5. Updates service logistics when required conditions are satisfied.

**Core design decision:** A supplier saying a part has shipped is not the same as a warehouse confirming the correct part is available.

The workflow preserves that distinction.

## 3. Watch the Workflow Run

[Watch the demonstration](https://www.loom.com/share/f0bf98ca3eba408982d6932ded4f8c77)

### Successful Scenario

*Insert actual Agent Run screenshot showing Logistics Ready.*

The simulation follows work order **SR-2041** through supplier follow-up, warehouse verification, component allocation and service-readiness confirmation.

**Logistics Ready** means the simulated logistics requirements are satisfied. It does not mean the equipment has been repaired or cleared for clinical use.

### When Something Goes Wrong

*Insert actual B1 testing screenshot.*

If the supplier confirms component **P-USB-405** instead of **P-USB-410**, the workflow:

- Keeps the request blocked.
- Prevents incorrect allocation.
- Creates a reconciliation action for Purchasing.

The purpose is not just to complete a workflow, but to ensure that it behaves appropriately when the information is wrong or incomplete.

## 4. What Could the Business Gain?

The potential value for a medical-equipment service provider is less manual coordination, clearer ownership and more dependable service-readiness information.

### Proposed Pilot Measures

| Measure | Business question |
|---|---|
| Manual coordination minutes per request | Are teams spending less time chasing and reconciling updates? |
| Blocker resolution time | Are parts-related dependencies resolved sooner? |
| Correct completion rate | Does the workflow reach the appropriate outcome without unauthorized actions? |
| Human intervention rate | Which requests can proceed automatically, and where is review needed? |

### Illustrative Financial Opportunity

Suppose a service provider handles **500 eligible requests per month**, and an improved workflow saves **20 net minutes per request**, at a loaded labour cost of **CAD $40/hour**.

That represents:

**500 × 20 ÷ 60 × $40 × 12 = CAD $80,000 in annual gross capacity value.**

This is a hypothetical scenario, not a measured result or cash-savings forecast. Actual returns would depend on request volume, time saved, implementation costs, review burden and other operational factors.

**The pilot decision:** Can we achieve meaningful improvements in coordination effort and completion reliability without increasing operational risk or cost disproportionately?

## 5. How It Works Technically

ExceptionOS uses three simulated enterprise systems:

| System | Responsibility |
|---|---|
| Field Service | Work orders, appointments and technician assignments |
| Inventory / ERP | Parts, receipts and allocations |
| Supplier Email | Supplier communication and delivery claims |

The application uses a TypeScript workflow engine, event-based transitions, deterministic business rules and simulated supplier-message interpretation.

The interface has three views:

- **Agent Run:** Execute and inspect the workflow.
- **Testing & Logs:** Run scenarios and inspect expected versus observed behavior.
- **Business Case:** Explore the customer hypothesis, operating measures and potential value.

The prototype is not connected to live enterprise systems or a live language model.

## 6. Testing and Reliability

The project includes 13 automated unit tests and six interactive scenario categories:

| Scenario | Expected behavior |
|---|---|
| Correct component received | Advance to Logistics Ready when requirements are met |
| Wrong supplier component | Block allocation and request Purchasing review |
| Wrong warehouse receipt | Block allocation and request Inventory review |
| Delayed delivery | Flag the visit as at risk for Dispatch review |
| Duplicate event | Avoid duplicate business actions |
| Interpretation failure | Preserve state and route for human review |

These are simulated workflow tests, not production agent evaluations.

A future model-based implementation would require separate evaluations of extraction accuracy, correct actions, unsafe-action prevention and autonomous completion.

## 7. From Prototype to Customer Deployment

I would approach a real deployment in five steps:

**Discover:** Interview service coordinators, Purchasing, warehouse and Dispatch teams. Map the actual process, systems, exceptions and baseline performance.

**Prioritize:** Identify the handoff with the highest potential customer value. Check whether existing software or simpler automation already addresses it.

**Pilot:** Implement a narrow workflow with clear data sources, business rules, permissions and human-review conditions.

**Evaluate:** Measure correct completion, manual effort, blocker resolution and failure cases. Review representative agent outputs and errors.

**Improve and reuse:** Work with the customer and engineering team to resolve issues, update tests and identify components that can accelerate subsequent deployments.

## 8. Limitations and Lessons

ExceptionOS is a proof of concept, not a production-ready enterprise agent.

Live deployment would require secure integrations, persistent execution, access controls, monitoring, real-model evaluations and validation with customer data.

Three lessons guided the project:

1. **Automation starts with understanding the work.** An agent cannot reliably coordinate responsibilities that haven't been defined.
2. **Action requires trustworthy evidence.** Unverified messages should not automatically change authoritative business records.
3. **Technical success is only one part of deployment success.** The workflow must solve a customer problem and demonstrate value against an agreed performance bar.

---

*Built independently using Lovable and AI-assisted development. The scenario, organizations and records are fictional.*
