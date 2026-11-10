# Evidence assurance and detection measurement

Use this protocol for new audits. Historical reports can still be checked structurally; rendering them requires explicit `--legacy` and labels their evidence limits.

## Trust boundary

The controller owns the evidence directory and assigns stable worker identities. Workers receive source bytes and submit review judgements; they must not have write access to the manifest, receipt log, or other workers' review records. Store the directory outside the audited repository. Run capture calls serially. Import reviewer responses through the controller, retaining their original session/tool transcript for provenance.

The CLI does **not** provision OS isolation, authenticate agent identities or sign receipts. Hash chains detect changed, missing or reordered records relative to the supplied head; an actor who can rewrite every artifact can forge them. Configure your executor's write permissions before claiming independent observation. This is an adapter protocol for an orchestrator, not a security sandbox.

A delivery receipt proves that the capture tool supplied a whole file to its caller. It cannot prove the recipient understood it. An exact quotation proves text alignment. Its relevance to a defect is a separate review judgement, with counterevidence and preconditions recorded for inspection. A supported review is not a mathematical proof. Reproduce runtime claims where practical and retain the command, output and source revision in the review rationale; the gate never executes report-supplied code.

## Capture before auditing

```bash
node .claude/skills/production-audit/scripts/capture-source.mjs init . /external/evidence/run-01
node .claude/skills/production-audit/scripts/capture-source.mjs read . /external/evidence/run-01 auditor-1 audit code-audit src/route.js
node .claude/skills/production-audit/scripts/capture-source.mjs read . /external/evidence/run-01 reviewer-1 review code-audit src/route.js
```

Use a stable Git working tree and the repository root. The manifest inventories every tracked file with its SHA-256, including documentation and configuration. Untracked/ignored files are outside this denominator; stage intended source files before initialisation. Submodules must be audited separately: a tracked directory is rejected. Binary files need a controller-approved exclusion or a separate inspection tool; this capture tool reads text.

Before the first read, the controller may add `exclusions: [{file, reason}]` to `manifest.json`. The exclusion must name an inventoried file and have a reason; all exclusions appear in the report. Do not change the manifest after capture starts. Any changed tracked file, new tracked file, removed file or altered manifest invalidates the run. Restart capture against the new snapshot.

`read` writes source bytes to stdout and a receipt to stderr, then appends that receipt to `reads.jsonl`. Route stdout to the specified worker. An I/O failure must abort the controller run. Do not truncate large files in transit and then count them as delivered. Chunked or binary-tool capture is not supported by this first version.

Set these fields in the final report:

- `assurance_version: 1`.
- `coverage.receipt_head`: the last receipt's `receipt_sha256`, or the canonical manifest hash for zero reads.
- `coverage.files_total`: manifest files minus exclusions.
- `coverage.files_examined`: unique non-excluded files delivered with role `audit` to run lenses. Reviewer reads do not increase audit coverage.
- Each run lens's matrix row is an object with `lens` and `files`, the exact unique delivered file paths, plus its normal area assessment. A delivery records source availability; the area assessment remains a judgement.

## Review each supported finding and every dropped finding

Freeze finding fields before review. Ask a separate reviewer to attempt to refute the claim, inspect callers and guards, and state the preconditions under which it holds. The controller writes their response to `reviews.json`, an array of records:

```json
{
  "finding_id": "SEC-001",
  "finding_sha256": "SHA-256 of canonical final finding",
  "manifest_sha256": "SHA-256 of canonical manifest",
  "auditor": "auditor-1",
  "reviewer": "reviewer-1",
  "verdict": "supported",
  "claim": "Specific alleged defect",
  "preconditions": "Reachability, attacker capabilities and required runtime state",
  "data_flow": "Input through guards and calls to the affected operation",
  "counterevidence": "Guards and callers inspected; strongest alternative explanation",
  "rationale": "Why the quoted code supports or refutes the claim; remaining uncertainty",
  "citations": [{"file":"src/route.js", "start":1, "end":2, "quote":"exact source lines"}]
}
```

Use `findingHash(finding)` and `hash(canonical(manifest))` exported by `scripts/assurance.mjs`; do not hash pretty-printed JSON. Quotation ranges are inclusive, one-based and exact, including whitespace and CRLF characters. At least one quotation must name the finding's primary source file. The reviewer must have a captured delivery for every quoted file; the auditor must have one for the primary location.

`verified` findings require `supported`. Dropped findings require `refuted` and bind to their raw ledger finding. Optional reviews for other reported statuses use `inconclusive`; retain the existing severity caps. Reviewer and auditor identities must differ. The gate checks record integrity and disposition consistency; it does not decide whether a written argument is sound. Never promote a finding because its quote merely matches.

## Record observations where a quotation cannot settle the claim

`observe.mjs` records a replayable search or an executed probe against the captured snapshot. Declare `assurance_version: 2` and `coverage.observation_head`, name each verified finding's `verification.basis`, and cite every observation on the disposition of its subject. `observation-contract.md` specifies the records, the gate rules and the limits. Version 1 reports remain valid when no observation was recorded.

## Validate and render together

```bash
node .claude/skills/production-audit/scripts/render-report.mjs audit/ --repo . --assurance /external/evidence/run-01 > audit/report.md
```

The renderer snapshots ledger and report bytes, invokes the gate against those bytes, then renders that same report. It prints no report on failure. Gate diagnostics go to stderr. Warnings, exclusions and assurance limits remain visible. Shell redirection may create an empty output file on failure; delivery must check the exit code.

For machine consumers, use `audit-check.mjs audit/ --repo . --assurance /external/evidence/run-01 --json`. The existing JSON result gains nullable `assurance` details. Reports declaring an assurance version cannot silently fall back to legacy checking.

## Detection benchmark

`benchmark.mjs prepare <new-directory>` exports source cases and the audit task without evaluator labels. Give only that directory and the required skills to a fresh worker. Keep `benchmark/corpus.json` and scorer code outside that worker's readable context. Use a separate evaluator to adjudicate unexpected findings before scoring; never silently alter ground truth to improve a score.

Return a results JSON object with `corpus_sha256`, `model`, `model_version`, `skills_commit`, `prompt_sha256`, `run_id`, `started_at`, `blind` and `cases`. Each case has `id`, `status: "complete"`, and `findings: [{weakness, line, explanation}]`. Empty findings are explicit negative results. Record unknown metadata as unavailable rather than inventing it. Freeze model/version/settings and the exact task prompt for comparisons. Run:

```bash
node .claude/skills/production-audit/scripts/benchmark.mjs score results.json
```

Scoring matches case, CWE and defect line, counting each defect once. Duplicate and unmatched findings count as false positives; undetected defects count as false negatives. False-positive rate is the fraction of negative cases with any reported finding. Precision is null when no findings were emitted. Missing, failed or duplicated cases reject the run rather than disappearing from the denominator.

### Corpus v2: split packets, two tasks, two arms

Corpus v1 shows a worker both members of each pair in a fixed order, and current models score 4/4 on it. `corpus-v2.json` holds twelve pairs of 12–45 line modules; each pair shares one contract and one executable oracle, and `test-benchmark.mjs` asserts every label against that oracle.

```bash
node .claude/skills/production-audit/scripts/benchmark.mjs prepare-v2 <packet> --key <file outside the packet> --seed <text> --split A|B [--task detect|verify] [--arm read-only|observe --tools <directory>]
node .claude/skills/production-audit/scripts/benchmark.mjs score-v2 <results.json> --key <file> [--evidence <directory>] [--adjudications benchmark/adjudications-v2.json]
node .claude/skills/production-audit/scripts/benchmark.mjs compare-v2 <scored.json> <scored.json> [...]
```

A packet holds one member of each pair under an opaque id, so a worker cannot diff a pair or read a label from an id. Splits A and B together cover the corpus. `detect` asks which modules violate their contract; `verify` gives one concrete claim per case (`claims-v2.json`), true of the defective member only. The `observe` arm adds the observation tool; the `read-only` arm forbids execution. Results add `arm` and optional `effort` (`tokens`, `tool_calls`, `duration_ms`) to the v1 metadata. `compare-v2` reports each arm's rates, agreement between repeats and a paired count per case.

Adjudicate before trusting a false-positive figure. A separate adjudicator, told neither arm nor model, executes each finding that disagrees with a label and rules against the contract text. Rulings go in `adjudications-v2.json` with an executable check and are applied only with `--adjudications`; a scored run states whether they were. Never edit the corpus to match a run.

`benchmark/v2-2026-11-10/` holds the first twenty runs with their keys and observation logs (`summary.json` has the scored comparison). What they showed, for two model tiers on this corpus:

- **Detection, read-only against observe: no difference.** Recall and false-positive rate were identical per model in both arms; the observe arm cost 6% (larger model) to 20% (smaller model) more tokens. Workers probed what they already believed and seldom probed code they judged sound.
- **Verification of a concrete claim: 24/24 in every arm**, with or without execution.
- **The labels were wrong before the workers were.** All ten adjudicated disputes went the workers' way: four members labelled sound hold a real contract violation the oracle never tested, and three were location disputes over the same defect. After adjudication no finding in 86 was false.
- **Independent runs disagree usefully.** Single-run recall on the sixteen adjudicated defects was 13/16 and 14.5/16 by model; the union of all runs reached 16/16. This is a post hoc count on small numbers.
- **Every finding in the observe arm cited an observation that the log confirms** (43 of 43), and a third of the recorded observations were never cited by the worker that recorded them. The gate's accounting rule exists for that omission.

These runs do not show that observations improve detection. They show that on short single-module code a current model's reading matches execution, and that executed records make a disputed finding cheap to settle. Multi-file, stateful or browser-dependent defects are untested. Isolation was by instruction only, and model versions were unavailable.

### Corpus v1

The initial corpus has four vulnerable/fixed pairs: object ownership, lexical path traversal, external redirect and SQL parameter separation. Executable probes confirm each labelled behaviour and legitimate boundary. It is a small synthetic security calibration, not a real-world accuracy estimate, and does not measure the other audit lenses. Add independently adjudicated real-repository cases, multiple seeds and repeated blinded model runs before making general detection claims. Test-suite pass counts are never detection results.
