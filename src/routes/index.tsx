import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, Check, ChevronDown, Circle, ClipboardList, Info, ListOrdered, MessageSquare, PackageCheck, Play, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, fmt } from "@/components/demo-ui";
import { STAGES, demo, milestones, stageVerified, stateChanges, useDemo } from "@/lib/demo-store";
import { readinessGuards } from "@/engine/rules";
import { PEOPLE } from "@/engine/seed";
import type { SimState } from "@/engine/types";
import { cn } from "@/lib/utils";
import { handoff, inventoryLines, outcomeLabel } from "@/lib/handoff";
import ultrasound from "@/assets/ultrasound.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Agent Run — ExceptionOS fictional simulation" },
    { name: "description", content: "Resolve a missing-component service dependency with explicit fictional evidence and verified logistics outcomes." },
    { property: "og:title", content: "Agent Run — ExceptionOS fictional simulation" },
    { property: "og:description", content: "Follow the evidence, supplier coordination, warehouse verification and safe service hand-off." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AgentRun,
});

function owner(s: SimState) {
  const open = s.tasks.find((t) => t.status === "Open" && t.kind !== "supplier-response");
  if (open) return open.owner;
  if (s.dependency.state === "Awaiting supplier") return PEOPLE.purchasing;
  if (s.dependency.state === "Awaiting receipt" || s.dependency.state === "Verified") return PEOPLE.inventoryLead;
  return s.dependency.state === "Resolved" ? s.workOrder.technician : PEOPLE.coordinator;
}
const icons = [Search, MessageSquare, ClipboardList, PackageCheck, Check];

function AgentRun() {
  const { resetVersion } = useDemo();
  return <AgentWorkspace key={resetVersion} />;
}
function AgentWorkspace() {
  const { snapshots, current, stepsRun, pause } = useDemo();
  const [inspect, setInspect] = useState<number | null>(null);
  const [mode, setMode] = useState<"automatic" | "step">("automatic");
  const [supplierPart, setSupplierPart] = useState("P-USB-410");
  const [receiptPart, setReceiptPart] = useState("P-USB-410");
  const activeInspect = stepsRun > 0 && inspect !== null && snapshots[inspect + 1] ? inspect : null;
  const next = STAGES[stepsRun];
  const m = milestones(current);
  const wo = current.workOrder;
  const part = current.inventory.find((i) => i.partId === wo.requiredPartId);
  const ho = handoff(current);
  const reviewTask = current.tasks.find((t) => t.status === "Open" && t.kind !== "supplier-response");
  const nextLabel = pause === "human" ? "Human review required" : pause === "supplier" ? "Supplier reply required" : pause === "warehouse" ? "Authorized warehouse receipt required" : pause === "complete" ? "Technician service visit" : next?.title ?? "Human review";
  const title = pause === "supplier" ? "Waiting for the supplier" : pause === "warehouse" ? "Waiting for physical receipt" : pause === "human" ? "Pause for human review" : pause === "complete" ? "The service visit can proceed" : next?.title;
  const Icon = icons[Math.min(stepsRun, 4)] ?? Search;
  const execute = (execution: "automatic" | "step") => { setInspect(null); setMode(execution); execution === "automatic" ? demo.run() : demo.next(); };
  const inject = (kind: "supplier" | "warehouse") => { setInspect(null); kind === "supplier" ? demo.injectSupplier(supplierPart) : demo.injectReceipt(receiptPart); if (mode === "automatic") demo.run(); };
  const evidence = stepsRun < 2 ? `${wo.requiredPartId}: ${part?.onHand ?? 0} on hand; ${current.receipts.length} warehouse receipts.` : pause === "supplier" ? `Purchasing task ${current.tasks.find((t) => t.kind === "supplier-response")?.id ?? ""} is open. No supplier message received.` : pause === "warehouse" ? `${current.claims[0]?.quantity ?? 0} × ${current.claims[0]?.partId ?? ""} promised. ETA ${fmt(current.claims[0]?.eta ?? null)}. No physical receipt yet.` : pause === "human" ? reviewTask?.title ?? current.log.at(-1)?.error ?? "Requirements remain outstanding." : `${current.receipts.length} warehouse receipt; ${current.allocations.length} work-order allocation. Component ${current.dependency.state.toLowerCase()}.`;

  return <div className="space-y-6">
    <div><div className="text-xs text-muted-foreground">Fictional simulation · {wo.id}</div><h1 className="mt-1 text-3xl font-semibold">{m.logisticsReady ? "Service logistics confirmed" : "Resolve a blocked service visit"}</h1><p className="mt-2 text-sm text-muted-foreground">Coordinate the missing component, verify receipt and allocation, and update the service request.</p></div>
    <section className="flex flex-wrap items-center gap-5 rounded-lg border bg-card p-4" aria-label="Customer issue">
      <img src={ultrasound} alt="Illustrative ultrasound service equipment" width={672} height={992} className="h-24 w-16 rounded object-cover" />
      <div className="min-w-40"><h2 className="font-semibold">{wo.id}</h2><p className="text-sm">Ultrasound system service</p><p className="text-xs text-muted-foreground">{wo.customer.replace(" (demo)", "")}</p></div>
      <Item icon={<CalendarDays />} label="Scheduled appointment" value={fmt(wo.appointment)} />
      <Item icon={<AlertTriangle />} label="Required component" value={wo.requiredPartId} />
      <Item icon={<UserRound />} label="Overall service coordinator" value={PEOPLE.coordinator.replace(" (demo)", "")} />
      <div className="ml-auto"><StatusBadge status={wo.status} /></div>
    </section>
    {stepsRun === 0 && <p className="text-xs text-muted-foreground">Field Service shows Scheduled because the inventory blocker has not yet been detected.</p>}
    <div className="grid items-start gap-5 lg:grid-cols-[180px_minmax(0,1fr)_240px]">
      <ol className="grid grid-cols-5 gap-1 lg:grid-cols-1 lg:gap-2" aria-label="Progress">
        {STAGES.map((st, i) => { const snap = snapshots[i + 1]; const ok = !!snap && stageVerified(st.key, snap); return <li key={st.key}><Button variant="ghost" disabled={!snap} onClick={() => setInspect(activeInspect === i ? null : i)} data-testid={`step-${st.key}`} data-state={snap ? ok ? "done" : "failed" : i === stepsRun ? "current" : "pending"} className={cn("h-auto w-full flex-col justify-start whitespace-normal px-1 py-3 text-center sm:flex-row sm:px-2 sm:text-left", i === stepsRun && "bg-accent text-accent-foreground", activeInspect === i && "ring-1 ring-ring")}><span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-xs", ok && "border-primary bg-primary text-primary-foreground", snap && !ok && "text-destructive")}>{ok ? <Check className="size-3" /> : i + 1}</span><span className="text-xs lg:text-sm">{st.label}</span></Button></li>; })}
      </ol>
      <div className="min-w-0 space-y-4">
        <section className="rounded-lg border border-primary/25 bg-accent/30 p-5" data-testid="action-panel">
          {activeInspect !== null ? <><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Historical state · after step {activeInspect + 1}</span><Button size="sm" variant="ghost" onClick={() => setInspect(null)}>Back to current action</Button></div><Result before={snapshots[activeInspect] ?? current} after={snapshots[activeInspect + 1] ?? current} i={activeInspect} /></> : <>
            <div className="flex gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent text-primary"><Icon className="size-6" /></span><div><div className="text-xs font-medium uppercase text-primary">{pause === "complete" ? "Verified outcome" : pause ? "Run paused" : `Step ${stepsRun + 1} of 5`}</div><h2 className="mt-1 text-xl font-semibold">{title}</h2></div></div>
            <p className="mt-3 text-sm text-muted-foreground">{pause === "supplier" ? "Purchasing owns the follow-up. A supplier response must arrive before interpretation can proceed." : pause === "warehouse" ? "A supplier promise is not stock. Only a warehouse receipt can verify the physical component." : pause === "human" ? "The simulation will not resolve this exception or change the appointment without a human decision." : pause === "complete" ? "Every logistics prerequisite passed. Servicing and clinical authorization remain with people." : next?.explain}</p>
            {pause === "human" && ho && <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-4" data-testid="handoff"><div className="flex items-center gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="size-4" />{outcomeLabel(current)}</div><p className="mt-2 text-sm font-medium" data-testid="handoff-sentence">{ho.sentence}</p><dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">{[["Why it stopped", ho.reason], ["Mismatch / missing evidence", ho.mismatch], ["Accountable next", ho.owner], ["Required action", ho.action.charAt(0).toUpperCase() + ho.action.slice(1)], ["Still blocked / unchanged", ho.blocked]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl><p className="mt-3 text-xs text-muted-foreground">Simulated handoff — resolution happens outside this demo.</p></div>}
            <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2"><div><h3 className="text-xs font-semibold">Why this matters</h3><p className="mt-1 text-xs text-muted-foreground">{stepsRun < 2 ? "Give the missing component an owner and prevent a service visit from remaining blocked without follow-up." : "Protect the service appointment without mistaking a supplier promise for verified availability."}</p></div><div><h3 className="text-xs font-semibold">Evidence · simulated records</h3><p className="mt-1 break-words text-xs text-muted-foreground" data-testid="action-evidence">{evidence}</p></div></div>
            {(pause === "supplier" || pause === "warehouse") ? <div className="mt-5 border-t pt-4"><label className="block text-xs font-medium" htmlFor="event-part">Fictional {pause === "supplier" ? "supplier reply" : "authorized warehouse receipt"} · quantity 1</label><div className="mt-2 flex flex-wrap gap-2"><select id="event-part" aria-label="Fictional component" className="min-w-0 rounded-md border bg-background px-3 py-2 text-sm" value={pause === "supplier" ? supplierPart : receiptPart} onChange={(e) => pause === "supplier" ? setSupplierPart(e.target.value) : setReceiptPart(e.target.value)}><option value="P-USB-410">P-USB-410 · correct component</option><option value="P-USB-405">P-USB-405 · wrong component</option></select><Button onClick={() => inject(pause)} data-testid="inject-event">{pause === "supplier" ? <MessageSquare /> : <PackageCheck />}{pause === "supplier" ? "Simulate supplier response" : "Simulate verified goods receipt"}</Button></div><p className="mt-2 text-xs text-muted-foreground">{pause === "supplier" ? "Simulated supplier email; interpreted as an unverified claim. No stock changes." : "Simulated authorized warehouse event; component must pass verification. Not a real delivery or authorization."}</p></div> : !pause ? <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => execute("automatic")} data-testid="primary-action"><Play />Run agent</Button><Button variant="outline" onClick={() => execute("step")}><ListOrdered />Step through manually</Button></div> : null}
            {current.tasks.some((t) => t.kind === "supplier-response") && <div className="mt-4 text-xs"><span className="text-muted-foreground">Purchasing follow-up owner · </span>{current.tasks.find((t) => t.kind === "supplier-response")?.owner.replace(" (demo)", "")}</div>}
            <div className="mt-4 border-t pt-3 text-xs"><span className="text-muted-foreground">Next dependency · </span><span data-testid="next-action">{nextLabel} — {owner(current).replace(" (demo)", "")}</span></div>
          </>}
        </section>
        {stepsRun > 0 && activeInspect === null && <section className="border-t pt-4"><div className="mb-2 text-xs font-semibold text-muted-foreground">Latest result</div><Result i={stepsRun - 1} before={snapshots[stepsRun - 1] ?? current} after={current} /></section>}
      </div>
      <aside className="space-y-4"><section className="rounded-lg border bg-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Current state</h2></div><dl className="space-y-3 text-xs">{[["Supplier response",current.messages.length ? `${current.messages.length} received` : "Not received"],["Warehouse receipt",current.receipts.length ? current.receipts.map(r=>r.partId).join(", ") : "Not received"],...inventoryLines(current).map((l) => [l.required ? `Required ${l.partId}` : `Incorrect ${l.partId}`, l.required ? `${l.available} available · ${l.allocated} allocated` : `${l.received} received · ${l.allocated} allocated`]),["Allocation",current.allocations.length ? "Allocated" : "Not allocated"],["Parts dependency",current.dependency.state]].map(([k,v])=><div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl></section><Details title="Readiness requirements"><ul className="space-y-2 text-xs">{readinessGuards(current).map(g=><li key={g.label} className="flex gap-2">{g.pass ? <Check className="size-4 shrink-0 text-success"/> : <Circle className="size-4 shrink-0 text-muted-foreground"/>}{g.label}</li>)}</ul></Details></aside>
    </div>
    <section className="border-t pt-4"><h2 className="mb-3 text-sm font-semibold">Verified outcomes</h2><div className="grid gap-3 sm:grid-cols-3"><Milestone n={1} done={m.supplierResponded} title="Supplier-response task completed" note="Communication complete. Claim remains unverified."/><Milestone n={2} done={m.blockerResolved} title="Missing-component blocker resolved" note={m.componentVerified && !m.blockerResolved ? "Correct component verified; allocation still required." : "Correct component verified and allocated."}/><Milestone n={3} done={m.logisticsReady} title="Field Service: Logistics Ready" note="All logistics prerequisites passed; visit can proceed."/></div></section>
    <div className="flex gap-3 rounded-md bg-secondary p-4 text-xs"><Info className="size-4 shrink-0 text-primary"/><div><strong>Logistics ready ≠ clinical release</strong><p className="mt-1 text-muted-foreground">Technician servicing — {wo.repairStatus}. Required documentation — outstanding. Clinical release — {wo.clinicalRelease}.</p></div></div>
    <Details title={`Activity log (${current.log.length})`}><ol className="space-y-3 text-xs" data-testid="history">{current.log.length ? current.log.map((e,k)=><li key={`${e.eventId}-${k}`}><div className="font-mono text-muted-foreground">{e.timestamp} · {e.sourceSystem} · {e.eventId}</div><div>{e.action}</div><div className="text-muted-foreground">{e.resultingState}</div>{e.humanReview && <div className="text-destructive">Human review: {e.humanReview}</div>}</li>) : <li>Nothing yet.</li>}</ol></Details>
  </div>;
}
function Result({ i, before, after }: { i:number; before:SimState; after:SimState }) {
  const stage = STAGES[i]; if (!stage) return null;
  const ok = stageVerified(stage.key, after);
  return <div data-testid="result" data-ok={ok}><div className="flex gap-2 text-sm">{ok ? <Check className="size-4 shrink-0 text-success"/> : <AlertTriangle className="size-4 shrink-0 text-destructive"/>}<div><span className={cn("text-xs font-semibold",ok ? "text-success" : "text-destructive")}>Step {i+1} · {ok ? "Verified" : "Human review required"}</span><p className="mt-1">{ok ? stage.success : after.log.at(-1)?.action}</p></div></div><Details title="Record changes"><ul className="space-y-2 text-xs">{stateChanges(before,after).map(c=><li key={c.label}><span className="text-muted-foreground">{c.system} · {c.label}: </span>{c.from} <ArrowRight className="inline size-3"/> <strong>{c.to}</strong></li>)}</ul><div className="mt-3 text-xs font-medium">Historical status: {after.workOrder.status} · dependency {after.dependency.state}</div></Details></div>;
}
function Item({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) { return <div className="flex min-w-0 items-center gap-2"><span className="text-primary [&_svg]:size-4">{icon}</span><div><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm font-medium">{value}</div></div></div>; }
function Milestone({n,done,title,note}:{n:number;done:boolean;title:string;note:string}) { return <div data-testid={`milestone-${n}`} data-done={done} className={cn("rounded-md border p-4",done ? "border-success/30 bg-success/5" : "bg-card")}><div className="flex gap-2 text-sm font-medium">{done ? <Check className="size-4 shrink-0 text-success"/> : <Circle className="size-4 shrink-0 text-muted-foreground"/>}{title}</div><p className="mt-2 text-xs text-muted-foreground">{note}</p></div>; }
function Details({title,children}:{title:string;children:React.ReactNode}) { return <details className="group mt-3 rounded-md border bg-card"><summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-medium">{title}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"/></summary><div className="border-t p-3">{children}</div></details>; }
