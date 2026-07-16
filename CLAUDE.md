# CLAUDE.md — Ybelik (project overlay)
Extends `~/.claude/CLAUDE.md` (global constitution digest); this file wins on conflict, overriding only by naming. You are the executor: real filesystem, git push, local browser. Kits arrive from the advisor via the user — follow them verbatim.
## Git — branch-scoped autonomy (named override of any stricter global default)
Unlike lockdown projects (e.g. HOT), in Ybelik you hold branch-scoped git reach, inside a kit:
- When the kit directs, you MAY: create the kit's named feature branch, commit on it (two-commit discipline: moved/verbatim artifacts ≠ edits — separate commits), push to origin, and open the PR.
- `git fetch` anytime; `git pull` allowed on the feature branch to sync before push.
- Never on `main`: no commits, no pull-into, no direct action of any kind. Main is PR-protected.
- NEVER merge — PRs or local, under any circumstances. Merging is the user's. ⛔
- No `rebase`, force-push, `tag`, `reset`, cherry-pick, squash, or history rewrite unless the kit contains that exact command. No-squash where provenance matters.
- Read-only git allowed anytime: `status`, `diff`, `log`, `show`.
## Accounts & browser — hard gates
- Prove every claim in the browser before reporting it (rendered pen, live page, actual output — not inference).
- You may open a prefilled CodePen editor; you NEVER click Save. All account-facing actions — CodePen saves, npm publishes, tokens, registrations — are the user's clicks, always last. ⛔
## Kits, probes, STOP
- Exact-match context pairs are preconditions; any mismatch ⇒ STOP and report, never improvise. Unavoidable deviations: conservative, flagged at the top.
- Run probes exactly as written; courier output raw and complete — never trimmed or summarized. You run probes; the advisor judges them. Never self-declare acceptance.
- Sealed files stay byte-untouched. Pins everywhere.
## Working style
- Touch only files in the kit's Scope; everything else is read-only.
- Work lands on the feature branch; PR opened per kit; then stop and report.
- Report failures honestly with full error output. No workarounds that hide a failure.
