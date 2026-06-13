# Stage 3: Merge and deduplicate

Multiple lenses looking at the same app will independently find the same underlying issue, each describing it in its own terms. Reported separately, these inflate the count and scatter one real problem across several entries, making the report look larger and feel more confusing than the reality. Merging them into single findings that name every lens they touch is a core part of what makes the consolidated report clearer than the dozen-plus separate lens reports it replaces.

## Why the same issue surfaces in several lenses

The lenses overlap by design (each cross-references the others), so a single root issue legitimately appears through several:
- An **open email relay** is a security finding (`code-audit`/`ai-saas-security`: an abusable endpoint) and a deliverability finding (`email-deliverability`: domain reputation/blacklisting risk).
- **Incomplete account deletion** is a correctness finding (`code-audit`: orphaned data) and a data-privacy finding (`data-privacy`: right-to-erasure failure).
- A **client-rendered app crawlers see as blank** is an SEO finding (`seo-discoverability`: not indexable) and a performance finding (`performance`: slow first paint), and the fix (SSR/SSG) is shared.
- **A secret in the client bundle** is security (`ai-saas-security`/`code-audit`) and ops (`release-and-ops`: secrets handling).
- **PII in logs** is privacy (`data-privacy`), security (`ai-saas-security`), and ops (`release-and-ops`).
- **Missing/unannounced loading and error states** is frontend-robustness and accessibility (the states must be perceivable).
- **Fail-open limiters when env vars are unset** is security/abuse and ops (config).
- **Tiny tap targets / disabled zoom** is mobile and accessibility.

These are not separate problems; they are one problem with multiple consequences.

## How to merge

For each cluster of findings that share a root cause or the same code location:
- **Combine into one finding** describing the single underlying issue.
- **Name every lens it touches** (e.g. "Security + Deliverability", "Correctness + Data-privacy"), so the reader sees its full reach and the report credits each angle.
- **State all the consequences** (the relay both enables spam *and* risks blacklisting; the deletion gap both orphans data *and* breaches erasure law), so merging loses none of the severity the separate findings carried, often the combined consequence is what makes it high-priority.
- **Give one fix** that addresses the root cause (usually the lenses agree on the fix, or their fixes compose).
- **Take the highest severity** among the merged findings as the starting severity (calibrated in Stage 4), the issue is at least as severe as its most severe consequence.

## Merging is a recorded disposition, never a deletion

Merging operates *on the ledger* (`ledger-and-reconciliation.md`) and must leave a trail. When findings B and C merge into survivor A:
- A records the absorbed ids in `dedup.merged_from: ["B-id", "C-id"]` and lists every lens they came from in `dedup.also_seen_by_lenses`.
- B and C are **not** deleted from the ledger. Their ids live on, accounted for as "merged into A."

This is the structural guard against the failure that has actually happened here: a merge step that "consolidates for brevity" and quietly shrinks 60 findings to 45, taking real criticals down with it. Under this rule, every raw id ends in exactly one of three states — reported, merged (into a named survivor), or dropped (in Stage 4, with a reason).

### Merge must rewrite downstream references, not leave orphan ids

When finding B merges into survivor A, every subsequent structure that references B must be updated:
- **Chain `component_findings`:** if a chain listed B as a component, rewrite B → A. The claim B represented still exists (it is now part of A); the reference must follow it.
- **Chain steps / issue text:** if the chain's prose names B (e.g. "SEC-002 — path traversal…"), update the text to reference A.
- **Chain `severity_basis`:** if the chain's severity rested on B, rewrite to A (and re-evaluate whether the severity still holds under the merged finding's scope).
- **Other findings' cross-references:** if another finding's issue text names B as a related finding, update to A.

This produces two distinct kinds of chain-reference failure, each with a different fix:
- **Merge-orphan** (B merged into A, chain still says B): rewrite B → A. The underlying claim survives; only the id changed.
- **Refute-orphan** (B dropped/refuted, chain still says B): the underlying claim is gone. The chain must be re-synthesised without B, and its severity re-evaluated — it may downgrade if B was the link that made the chain critical.

The harness catches both: any `component_findings` id not in the reconciled reported set is a hard failure, with a diagnostic message naming whether it was merged (and into what) or dropped.

The reconciliation identity must hold:

```
raw  ==  reported  +  merged  +  dropped
```

The harness (`scripts/audit-check.mjs`) checks this arithmetic and names any raw id with no disposition. If you merged a finding, its id must appear in some survivor's `merged_from`; if it just disappeared, that is a lost finding and the build fails. Merge freely — but every merge is bookkeeping, not erasure.

## Distinguish genuine duplicates from distinct issues

Merge only when it is genuinely the same underlying issue. Two findings at the same file can be distinct problems (an endpoint with both an auth flaw and a missing rate limit, two separate findings sharing a location). And the same *category* in two places is not one finding (two different unscanned endpoints are two findings, even if both are "missing crisis scan"). Merge by shared root cause, not by superficial similarity. The test: would one fix resolve both? If yes, likely one finding; if they need separate fixes, keep them separate.

## Attack chains: collapse the re-narrated ones to root cause (don't double-count)

A `chain` finding (`category: attack-path`, from `adversary-emulation`) is **not** merged into its components — it is a distinct synthesis with its own block, and its `component_findings` are credited, not absorbed. But there is a second, subtler double-count to fix, and it is exactly the one that lets a client discover "3 criticals" were really 2 defects.

Some chains are **emergent**: several *distinct* defects compose into an impact none has alone (a phished admin password × no MFA × no audit trail × plaintext store → mass disclosure). That chain is its own finding and its own critical — it names a real, separate failure mode. Set `chain.root_cause_finding: null`.

Other chains are **re-narrated**: the chain's whole severity rests on **one** already-reported defect, and the chain is just the *attack story around that same defect*. A critical "a breach after erasure still exposes crisis data" whose entire weight is the already-reported critical "account deletion misses subcollections" is **one defect told twice** — once atomically (the deletion gap) and once as a path (the breach narrative). Same root cause, same fix. For these, set `chain.root_cause_finding` to that finding's id (which must also be in `component_findings`).

The test, the same one as for merging: **would one fix resolve both?** If fixing the single named defect makes the chain disappear, it is re-narrated — set `root_cause_finding`. If the chain survives any single component fix because it is the *composition* that bites, it is emergent — leave it `null`.

Why this is a disposition, not a deletion: like merging, **the ledger keeps both records** — the chain and its root cause both stay in `report.json.findings`, nothing is lost. What changes is the *client-facing presentation and the counts*: a re-narrated chain is folded into its root-cause finding's entry as supporting attack-path evidence (steps + detection gap + "also surfaced as an attack path"), and it is **excluded from the severity-tier count**, so the headline reports **distinct defects**, not findings. The renderer does this automatically from `root_cause_finding`; the harness checks the id is a real, reported component. This is the chain-level form of the cardinal principle: one problem seen two ways is one problem.

## What to produce from this stage
The raw findings list collapsed: cross-lens duplicates merged into single multi-lens findings (with combined consequences, a starting severity, and `dedup.merged_from` recording every absorbed id), genuinely distinct findings kept separate, and each attack chain marked emergent (`root_cause_finding: null`) or re-narrated (`root_cause_finding` set to its single root defect). The count drops but nothing is lost — every absorbed id is accounted for in a survivor, and every chain still lives in the ledger. This consolidated-but-not-yet-verified list goes to Stage 4, and the merged-count must reconcile against the ledger.

## The honest framing
The same problem seen through three lenses is one problem, not three. Merge findings that share a root cause into single entries that name every lens they touch and state every consequence, so the report reflects reality (one issue, several impacts) rather than inflating the count and scattering attention. Be careful to merge only true duplicates, same root cause, one fix, and keep distinct issues distinct even when they share a location or a category. This is half of why the consolidated report is clearer than the sum of the lenses; the other half is verification.

## Connection to other stages
Operates on Stage 2's lens-tagged findings (the tags are what reveal the cross-lens duplicates). Feeds Stage 4, where the merged findings' combined severity is calibrated. The multi-lens labelling carries through to the final report (report-format.md), where each finding names its owning lens(es).
