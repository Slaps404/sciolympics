# Project status

Single source of truth for build phase. Update this file when a layer ships.

| Area | Status |
|------|--------|
| L0 schema + RLS + seed | ✅ Done (remote DB linked, events seeded) |
| Auth (signup/login/callback/logout, profile trigger) | ✅ Done |
| Auth UX polish (back link, password confirm, callback hardening) | ✅ Done |
| Init manual steps | See [`docs/finish-init-checklist.md`](finish-init-checklist.md) |
| **L1 resources** — event pages + link submission | 🔄 In progress |
| L3 Practice / L4 Ghost-race | ⏳ Future |

## Known v2 items

- A resource can be approved and then undone by deleting the matching `(event_id, url)` live row. This is deterministic because live resources now enforce unique `(event_id, url)`, but later provenance fields would make undo safer for mixed human/AI submissions.
