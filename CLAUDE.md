# CLAUDE.md — Master Schedule

Single-page weekly master-schedule editor for Rippner Tennis facilities (SATC, Pharr, Wilco). One HTML file (`public/index.html`), two Cloudflare Pages Functions, **shares the `rippner-scheduling` D1 database** with its own namespaced keys.

## Run locally

```powershell
npx wrangler@3 pages dev public --port 8789 --d1 DB=rippner-scheduling
# seed keys (only needed once — safe to re-run):
npx wrangler@3 d1 execute rippner-scheduling --local  --file schema.sql
# remote (production):
npx wrangler@3 d1 execute rippner-scheduling --remote --file schema.sql
```

Deploy: this needs to be registered as its own Cloudflare Pages project pointed at `master-schedule/`. The D1 binding (`DB` → `rippner-scheduling`) is locked in `wrangler.toml`.

## Storage

Four KV keys in the shared `kv` table:

| key | shape |
|---|---|
| `master_satc`     | `{ blocks: [Block] }` |
| `master_pharr`    | `{ blocks: [Block] }` |
| `master_wilco`    | `{ blocks: [Block] }` |
| `master_programs` | `[]` (reserved for a future program catalog) |

`Block = { id, day (0=Mon..6=Sun), start "HH:MM", end "HH:MM", title, semester:bool, notes, color }`

## UI notes

- Grid: 06:00–22:00, 30-minute rows (32 slots × 30px).
- Mon–Thu rows 9:30–12:30 render a dotted "SUMMER CAMP ZONE" band overlay; pointer-events are disabled so clicks pass through to the slots below.
- Semester blocks render with a dashed white inner border + navy outer ring + small `SEM` badge.
- All writes are debounced 300ms, single PUT per facility. Sync indicator in the header.
- No auth — same trust model as the scheduling app. Move behind Cloudflare Access when needed.
