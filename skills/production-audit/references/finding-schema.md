# The canonical finding schema

This is the single source of truth for the shape of a finding. Every lens emits findings in this exact shape; the merge, verification, reconciliation, report, and the `audit-check.mjs` harness all read it. "Standard format" everywhere else in this skill means **this** schema. Do not restate it loosely — point here.

A finding that does not conform to this schema is not a valid finding. The harness rejects non-conforming records, which is the point: it makes "I followed the format" machine-checkable instead of a claim.

## The record

Each finding is one JSON object. The raw findings ledger (`ledger-and-reconciliation.md`) is one such object per line (JSONL). The final report's findings array is the same objects after merge and verification.

```jsonc
{
  "id": "SEC-001",                  // <LENS-PREFIX>-<3+ digits>, unique across the whole run. See prefix table.
  "lens": "code-audit",             // which lens produced it (enum below)
  "pass": "security",               // the sub-pass within that lens (free text, e.g. "Pass 3: deletion")
  "title": "Account deletion skips workouts subcollection",
  "category": "privacy",            // enum below — the dimension, independent of which lens found it
  "location": {
    "file": "src/app/api/account/delete/route.ts",
    "line": 42,                     // integer, or null if genuinely not line-specific (config-wide, missing-file)
    "others": ["firestore.rules:88"] // optional secondary sites, "file:line" strings
  },
  "issue": "The deletion handler purges users/{uid} but never deletes users/{uid}/workouts/*.",
  "consequence": "Personal health data survives a GDPR erasure request; the user is told it was deleted.",
  "severity": "high",               // critical | high | medium | low | info
  "confidence_type": "factual",     // factual | reasoning — see below, this drives how much to trust it
  "verification": {
    "status": "unverified",         // unverified | verified | refuted | capped
    "evidence": "",                 // for status=verified: a real quote of the code read. Harness requires ≥12 chars AND a file:line ref or a `backtick-quoted` span — "x" or "checked" will hard-fail.
    "verifier_disagreed": false,    // did Stage 4 change the severity or reachability the lens claimed?
    "note": ""                      // why this status; for capped, why it could not be verified
  },
  "fix": "Enumerate and batch-delete all users/{uid} subcollections in the deletion handler; add a test asserting zero residual docs.",
  "dedup": {
    "merged_from": [],              // raw ids folded into this one during Stage 3 (this id is the survivor)
    "also_seen_by_lenses": ["data-privacy"] // other lenses that independently found the same issue
  },
  "added_post_verification": false  // true ONLY if surfaced after Stage 4 ran; such findings are capped at medium until re-verified
}
```

### Optional block: attack-path findings (adversary-emulation lens only)

A `chain` finding ties several atomic findings into one exploit path. It carries an extra block and uses category `attack-path`:

```jsonc
{
  "id": "CHAIN-001",
  "lens": "adversary-emulation",
  "category": "attack-path",
  "severity": "critical",
  "chain": {
    "objective": "Exfiltrate every user's health data",
    "att_ck_tactics": ["Initial Access", "Privilege Escalation", "Collection", "Exfiltration"],
    "steps": [
      "Register with an unverified email (FE-012 — no verification gate on this route)",
      "Call the export endpoint for an arbitrary uid (SEC-004 — IDOR, no ownership check)",
      "Export returns full dailyCheckIns including HRV and bodyweight (PRIV-002 — over-broad export)"
    ],
    "component_findings": ["FE-012", "SEC-004", "PRIV-002"],
    "root_cause_finding": null,        // see below — the one already-reported defect this chain re-narrates, or null if emergent
    "severity_basis": ["FE-012", "SEC-004"],  // constituent ids this chain's severity rests on (for recomputation if a constituent is dropped/merged)
    "detection_gap": "No logging or alerting on cross-user export; the blue-team pass found no audit trail (OPS-009)."
  },
  // ...all the normal fields still apply (location points to the entry-point site, fix describes the chain break)
}
```

A chain's severity is governed by its realised impact, not the max of its parts — three mediums that compose into full data exfiltration is a critical. The chain's `component_findings` must all exist in the ledger; the harness checks this.

### `root_cause_finding` — emergent chain vs. re-narrated single defect

Two kinds of chain look identical in the schema but must be counted differently in the client-facing verdict:

- **Emergent** — several *distinct* defects compose into an impact none has alone (three mediums → a critical exfiltration path; "phished admin password × no MFA × no audit trail × plaintext store" → mass disclosure). The chain is its own finding and its own critical; set `root_cause_finding: null`.
- **Re-narrated** — the chain's severity rests entirely on **one** already-reported defect; the chain is the *attack story around that same defect*, not a new one. (A critical "a breach after erasure still exposes crisis data" whose whole weight is the already-reported critical "deletion misses subcollections" — same fix, same root cause, one lens telling it atomically and one telling it as a path.) Set `root_cause_finding` to that finding's id. It **must** be one of `component_findings` and **must** itself be a reported finding (the harness checks both).

Why it matters: the ledger keeps both records (no loss — see `ledger-and-reconciliation.md`), but a re-narrated chain and its root cause are **one defect, not two**, in the report's counts and severity tiers. Counting both is double-counting — it inflates the critical tally and lets a client discover that "3 criticals" were really 2 underlying defects, which dents the audit's honesty. When `root_cause_finding` is set, the renderer folds the chain's attack-path narrative and detection gap *into* the root-cause finding's entry (as supporting cross-lens evidence) and excludes the chain from the tier count; the headline counts **distinct defects**, not findings. Leave it `null` only when the chain is genuinely emergent. `merge-and-deduplicate.md` covers how to decide.

## Enums

**`lens`** — `code-audit` · `ai-saas-security` · `scaling-audit` · `release-and-ops` · `data-privacy` · `frontend-robustness` · `performance` · `accessibility` · `email-deliverability` · `soc2-compliance` · `adversary-emulation` · `seo-discoverability` · `mobile-and-responsive` · `analytics-and-instrumentation` · `internationalisation` · `anti-slop-writing`

**`category`** — `security` · `correctness` · `scaling` · `ops` · `privacy` · `performance` · `accessibility` · `email` · `frontend` · `seo` · `mobile` · `analytics` · `i18n` · `compliance` · `attack-path` · `design-aesthetic` · `content`

> **`design-aesthetic` is special — and deliberately narrow. Cap by consequence, not by lens.** It is for **purely visual / polish** findings whose worst realistic outcome is "it looks unprofessional or generated": colour, spacing, typographic hierarchy, brand consistency, anti-AI-slop aesthetics (default gradients, dashboard skeletons, template fonts, one-radius-everything), microcopy *tone*. These carry `category: design-aesthetic`, report in their own "Design quality & distinctiveness" section, and the harness **hard-caps them at medium** (critical/high fails the build) because generic aesthetics are a credibility/conversion risk, not a safety one — and letting them sit beside security findings dilutes the report.
>
> **It is NOT a bucket for everything the UX/design lens surfaces.** Interaction and robustness failures often arrive through the same lens but have real user impact and can legitimately be high or critical: a missing error state that shows a blank screen on API failure, a destructive action with no confirmation or undo, a double-submit with no guard, a keyboard trap that locks a user out. Categorise these by their **consequence**, never by the lens that found them — an interaction/robustness failure is `frontend` (and is owned by `frontend-robustness`); an access barrier is `accessibility`. Both keep their real severity. Reserve `design-aesthetic` for findings where the worst case is genuinely "it looks bad," never "it breaks, loses data, or locks someone out." When in doubt, it is not `design-aesthetic`.

> **`content` is the copy/writing twin of `design-aesthetic` — same cap, same narrowness.** It is for **user-facing copy quality** (the words, not the pixels): AI-slop writing in landing/marketing pages, onboarding, microcopy, button labels, empty/error-state wording, notification and transactional-email copy — banned-phrase tells, the correctio, hollow intensifiers, performative warmth, off-brand or generic voice. Owned by the `anti-slop-writing` lens, prefix `COPY`. The harness **hard-caps it at medium** and it reports in the **"Design & copy quality"** section, because the worst realistic outcome is "the copy reads as generated / off-brand / fails to convert" — a credibility risk, not a safety one. **Cap by consequence, not by lens:** copy whose worst case is a *real failure* — a misleading legal disclaimer, instructions that cause data loss, an error message so wrong it breaks a flow — is owned by that consequence (`compliance` / `correctness` / `frontend`) and keeps its real severity. Reserve `content` for "the worst case is it reads badly." It audits the app's *own* user-facing text, never code comments, logs, or machine-to-machine API output.

**`severity`** — `critical` · `high` · `medium` · `low` · `info`

**`confidence_type`** — `factual` · `reasoning`

**`verification.status`** — `unverified` · `verified` · `refuted` · `capped`

## ID prefix table

Each lens owns one or more prefixes so reconciliation can trace findings back to their source. IDs are stable for the whole run — once assigned, an id is never reused or renumbered (merge records the loser in the survivor's `merged_from`; it does not delete the id).

| Lens | Prefix(es) |
|---|---|
| code-audit | `SEC` (security), `COR` (correctness), `DBG` (debug probe), `TST` (tests), `STR` (structure), `UIUX` (ui/ux) |
| ai-saas-security | `AI` |
| scaling-audit | `SCALE` |
| release-and-ops | `OPS` |
| data-privacy | `PRIV` |
| frontend-robustness | `FE` |
| performance | `PERF` |
| accessibility | `A11Y` |
| email-deliverability | `EMAIL` |
| soc2-compliance | `SOC2` |
| adversary-emulation | `CHAIN` |
| seo-discoverability | `SEO` |
| mobile-and-responsive | `MOB` |
| analytics-and-instrumentation | `ANL` |
| internationalisation | `I18N` |
| anti-slop-writing | `COPY` |

## `confidence_type`: the factual / reasoning distinction

This field exists because the two kinds of finding warrant different trust, and the reader (and the fixer) must be able to tell them apart at a glance.

- **`factual`** — a locational, grep-level claim about what the code does or does not contain: "there is no `.limit()` on this query," "this route has no auth check," "no `loading.tsx` exists in this directory." These are reliable; if the citation is correct, the finding is correct. The verifier confirms the citation and moves on.
- **`reasoning`** — a consequence chain built on top of a factual observation: "because this query is unbounded, a malicious user can exhaust the read quota and run up the bill." The factual base (unbounded query) may be solid while the consequence (reachable by an attacker, actually costly) is an inference that can be wrong. **Reasoning findings at critical or high must be confirmed against the code by a human before they are acted on**, and the verification note must say so. The verifier's job on a reasoning finding is to attack the inference, not just the citation.

The harness does not auto-cap reasoning findings, but the report must visibly distinguish them, and `verification-and-severity.md` requires the verifier to apply extra scrutiny to reasoning-typed criticals and highs.

## The one hard invariant the harness enforces on this schema

**No finding may sit at `critical` or `high` severity unless its `verification.status` is `verified` (with non-empty `evidence`) or `capped`.** A critical/high with `status: unverified` is a hard failure — the harness exits non-zero and the audit is not shippable until it is resolved (verify it, or cap it at medium). This is the structural form of the rule in `verification-and-severity.md`: it can no longer be merely claimed, because a script checks it.
