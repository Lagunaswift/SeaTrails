---
name: adversary-emulation
description: "Defensive threat-modelling lens: chains individual weaknesses into realistic attack paths against YOUR OWN codebase, mapped to MITRE ATT&CK tactics, then asks whether each path would be detected (blue team) and how to break it (purple team). Finds the chained exploits that lens-by-lens auditing misses. Trigger on: 'threat model', 'attack path', 'red team', 'adversary emulation', 'kill chain', 'how would someone break in', 'purple team', or when a production-audit selects this lens. STRICTLY DEFENSIVE — models attacks to harden the system you own, never to attack systems you don't."
---

# Adversary Emulation (defensive threat modelling)

## Scope and authorisation — the hard boundary

This lens exists to **harden your own application** by thinking like an attacker about it. It is the defensive practice of threat modelling and adversary emulation, applied to a codebase you own and are authorised to assess. It must stay inside that boundary:

- **In scope:** describing *attack paths* through this codebase (which weaknesses chain into which impact), mapping them to known tactics, identifying detection gaps, and prescribing fixes. This is what a threat model is.
- **Out of scope, always:** producing working exploit code or payloads, command-and-control tooling, malware, instructions for attacking third-party systems, techniques whose purpose is evading defenders maliciously, or anything aimed at a system the operator does not own. If a finding would only be useful to an attacker and not to the defender fixing it, it does not belong in the report.

The deliverable is a map of how the system could be breached and how to close each path — not a weapon. Keep every finding actionable *for the defender*.

## Why this lens exists: the gap it fills

Every other lens finds **atomic** flaws — this query is unbounded, that route lacks an ownership check, this email isn't verified. Each in isolation might be rated medium. But an attacker doesn't experience the app as a list of independent findings; they experience it as a **path to a goal**. Three "mediums" that chain — register without verification → call an export endpoint with no ownership check → receive another user's full health record — compose into a critical data breach that no single lens names, because each lens only saw its own slice. This lens is the synthesis that chains them.

It therefore runs **after** the atomic lenses AND after reconciliation (Stages 3–4), and **consumes the reconciled, verified finding set** — not the raw pre-merge/pre-drop ledger — as the raw material for chains. It is not a from-scratch re-scan; it is the step that asks "given everything the other lenses found *and the verifier confirmed*, what can an adversary actually achieve?"

**Why the reconciled set, not the raw ledger:** a chain built on a finding the verifier later refuted is built on a claim the audit no longer stands behind. If SEC-002 is refuted during Stage 4, a chain that references SEC-002 as a link is silently inflated — it asserts a path that doesn't exist. The pipeline ordering (reconcile → freeze → synthesise chains) prevents this. The harness enforces it: any `component_findings` id not in the reconciled reported set blocks report delivery, with a diagnostic naming whether the reference was dropped (re-synthesise the chain) or merged (rewrite to the surviving parent id).

## The team-colour model

This lens internalises the standard red/blue/purple/white roles and runs them as passes:

- **Red (attack):** emulate adversary objectives and trace kill chains through the code.
- **Blue (detect):** for each chain, would the system notice? Is there logging, alerting, rate-limiting, anomaly detection along the path?
- **Purple (synthesise):** combine them — each attack path paired with its detection gap and its fix. This is the value: defenders learning directly from the modelled attack.
- **White (rules of engagement):** the scope boundary above — keep the exercise defensive, owned-system-only, and non-destructive (model impact, don't execute it).
- **Yellow (builder awareness):** for each chain, did the developers know this was dangerous? Look for evidence of intentional security decisions vs blind spots in the code.
- **Orange (threat intel):** cross-reference chains against known real-world attack patterns (OWASP Top 10, common CVE classes, recent breach patterns) and priority-bump chains that match what attackers are actively exploiting.

## Passes

### Pass 1 (Red): define adversary objectives
Pick the goals a real attacker would have against *this specific app*. Derive them from what the app holds and does. Typical objectives:
- Account takeover (of a normal user; of an admin).
- Mass data exfiltration (especially special-category data — health, financial, PII).
- Privilege escalation (user → admin; tenant A → tenant B in multi-tenant).
- Financial abuse (bypass payment, abuse refunds, run up metered/AI costs on the operator's bill).
- Integrity attack (tamper with records, leaderboards, balances, audit logs).
- Denial of service / resource exhaustion (where reachable and cheap to trigger).

### Pass 2 (Red): trace kill chains, mapped to ATT&CK tactics
For each objective, build the path from entry to impact, drawing on ledger findings. Use the MITRE ATT&CK tactic sequence as the spine so chains are structured and comparable:
- **Initial Access** — how does the attacker get a foothold? (weak signup, exposed endpoint, leaked secret, SSRF)
- **Execution / Exploitation** — what flaw do they trigger? (injection, IDOR, logic flaw)
- **Persistence** — can they keep access? (token that never expires, self-granted role)
- **Privilege Escalation** — can they gain more rights? (missing authz, mass-assignment of a role field)
- **Defense Evasion** — would they avoid notice? (this links to the Blue pass)
- **Credential Access** — can they get others' credentials/tokens? (exposed JWTs, predictable resets)
- **Collection / Exfiltration** — what data can they pull out, and how much? (over-broad export, unbounded query)
- **Impact** — the realised damage (breach scope, financial loss, integrity loss).

Each chain references the component finding ids it's built from (`chain.component_findings`). A chain whose every link is a real, located finding is a real attack path. A chain that requires a step nobody found is a hypothesis — label it as `confidence_type: reasoning` and verify the missing link before rating it high.

### Pass 3 (Blue): detection and response coverage
For each attack path, walk it again asking "would we know?":
- Is each step logged with enough detail to reconstruct it?
- Would anything *alert* — rate-limit trips, anomaly detection, failed-auth spikes, unusual export volume?
- Is there an audit trail an incident responder could follow afterward?
- The detection gap goes in `chain.detection_gap`. A breach that is silent (no logs, no alerts) is worse than a noisy one — weight severity up when the path is undetectable.

### Pass 4 (Purple): synthesise path → gap → fix
For each chain, produce the defender's takeaway: the path, where detection is blind, and the **single cheapest link to break** (often one missing check defeats the whole chain — name it). Prefer fixes that break the chain early (at Initial Access or Execution) over deep mitigations.

### Pass 5 (Yellow): builder awareness
For each chain, check whether the developers appeared to understand the risk at each link:
- Is there intentional security code at the vulnerable point (input validation, auth checks, rate limits) that's incomplete or misconfigured? That's a near-miss — the team knew, they just got it wrong.
- Is there no security code at all — no validation, no auth check, no comment acknowledging the risk? That's a blind spot, and it's worse than a near-miss because there are probably no compensating controls elsewhere either.
- Are security-sensitive code paths covered by tests, or untested?
- Is auth/crypto code purpose-built for this app, or copy-pasted boilerplate with default config?

Record the assessment per chain as `chain.builder_awareness`: `intentional-gap` (team knew, mitigated partially), `blind-spot` (no sign the team considered this), or `tested` (risk is acknowledged and covered by tests/controls). Blind spots should weight severity up — an unknown risk has no compensating controls.

### Pass 6 (Orange): threat intel cross-reference
For each chain, check whether the attack pattern matches known, actively exploited vulnerability classes:
- Does the chain map to an OWASP Top 10 category? Which one?
- Does the chain follow a pattern seen in real breaches (mass IDOR scraping, chained SSRF-to-cloud-metadata, JWT confusion, OAuth redirect hijack, etc.)?
- Is the vulnerable component or pattern associated with known CVE classes?

Record as `chain.threat_intel`: the matched pattern name and why it matched. Chains that match actively exploited patterns get a priority bump — an IDOR chain in a health-data app maps directly to the pattern behind real regulatory fines. A chain with no known real-world analogue is still valid but is less urgent than one attackers have playbooks for.

### Pass 7 (White): scope hygiene check
Before reporting, re-read findings against the boundary above. Strip anything that reads as an exploit recipe rather than a defensive fix. Confirm every chain targets the owned system. Confirm impact is *modelled*, never executed against live data/users.

## What to produce

Findings in the canonical schema (`production-audit/references/finding-schema.md`), prefix `CHAIN`, category `attack-path`, with the `chain` block populated (objective, ATT&CK tactics, steps, `component_findings`, `detection_gap`). Severity is the **realised impact of the path**, not the max of its parts — chained mediums that yield data exfiltration are critical. Because chains are reasoning-heavy, set `confidence_type: reasoning` unless every link is an independently verified factual finding, and route every critical/high chain through Stage 4 verification — the verifier's job is to attack the chain (is every link real? is the path actually reachable in sequence?), and to break it (cap the severity) if any link doesn't hold.

A real, undetected path to mass exfiltration of special-category data is critical. A path to single-account takeover is high. A path requiring an unlikely precondition, or one with strong detection, is medium. A purely hypothetical chain with an unverified link cannot be high until the link is verified.

## Overlapping skills

- Every other lens feeds this one — it consumes their ledger findings as chain components and credits them in `component_findings`.
- `code-audit` / `ai-saas-security` own the atomic security flaws; this lens owns *composing* them into attack paths and assessing detection. It does not replace them — it runs after and builds on them.
- `scaling-audit` observability findings feed the Blue/detection pass.
