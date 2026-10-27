<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All workflow logic lives in pure TypeScript under src/engine (reducer `applyEvent`); UI and scenario tests must call it, never reimplement it — one source of truth for every view.
- Interpreter output is only ever a SupplierClaim; only authorized warehouse goods receipts change stock — keeps AI out of authoritative records.
- Business-changing records use stable IDs (task per kind+dependency, allocation per work order+part, message/receipt IDs) — guarantees idempotency.
