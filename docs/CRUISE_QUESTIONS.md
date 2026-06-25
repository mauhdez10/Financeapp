# CRUISE_QUESTIONS.md — unattended-tick questions for the owner

> The cron failsafe tick appends yes/no questions here (with a recommendation) when it
> hits something it should not decide alone, then moves on. Newest on top.

## 2026-06-24 — cron tick

### Q1 (BLOCKER for all pushes) — review & approve the held v0.83.1 to unblock the queue
`origin/main` is still at **v0.83.0** (`179ef52`). The local `main` is **5 commits ahead**, all held:

| commit | ver | what | push-safety |
|---|---|---|---|
| `8659934` | v0.83.1 | gate advisor save-success toast on save result | **THE genuine hold** — touches the live save path; the failure branch can't be reproduced headlessly |
| `3572400` | v0.83.2 | server RPC restores advisor reminders (No-Contact + High-DSR + Debt-Rising) | additive + fully verified (RPC already live in DB) |
| `636a8b5` | v0.83.3 | export-all/Backup pages full blobs + Backup-page import fix | additive + fully verified |
| `eba9180` | v0.83.4 | gaLoadClientSummaries pages past the 1000-row cap | load path; <1000 verified no-regression, >1000 not E2E-able |
| `2abf047` | v0.83.5 | Compare-tab `<tbody>` whitespace React-warning fix (this tick) | cosmetic + additive + fully verified |

**Because the held v0.83.1 sits between origin and HEAD, NO `git push origin main` is possible without
shipping v0.83.1 to production.** That is why this tick committed v0.83.5 LOCAL and pushed nothing —
the PUSH DISCIPLINE ("never break the live save path") overrides the heartbeat-push step.

**Recommendation:** review v0.83.1's one-line change (gate the green "Client saved" toast on
`gaSaveClient`'s boolean, so a failed save no longer shows success — see memory `scale-data-layer.md`
TASK 1). If you accept it, a single `git push origin main` ships all five (v0.83.1–v0.83.5). If you'd
rather hold v0.83.1 longer, cherry-pick `3572400`+`636a8b5`+`2abf047` (the three fully-verified additive
ones) onto `origin/main` and push those. **Yes = approve v0.83.1 and push the lot? (recommended)**

### Q2 (infra) — the CRUISE orchestration files don't exist
The cron task instructs "read `docs/CRUISE_MODE.md` … and follow it EXACTLY" and runs a heartbeat
handshake against `docs/CRUISE_HEARTBEAT.md`, but **none of `CRUISE_MODE.md`, `CRUISE_HEARTBEAT.md`,
or `CRUISE_QUESTIONS.md` existed** in the repo at tick time (this file was created now). The tick fell
back to the named source-of-truth chain (memory `scale-data-layer.md` Follow-ups → `REVIEW_QUEUE.md` →
`docs/BACKLOG.md`), which worked. The heartbeat handshake was also a no-op (no file = no other worker
to collide with) and was NOT committed/pushed (push is blocked per Q1 anyway).

**Recommendation:** either (a) add `docs/CRUISE_MODE.md` with the real ordered map + create an empty
`docs/CRUISE_HEARTBEAT.md`, or (b) update the scheduled-task prompt to point at the actual
source-of-truth chain and drop the heartbeat handshake. **Which: (a) author the infra files, or (b)
fix the task prompt?**
