# Observation contract (`seatrial-observation/1`)

A quotation shows that text exists. It cannot show that a guard is absent elsewhere, or that the code misbehaves when run. An observation is a recorded search or probe run against the captured snapshot, stored so the gate can re-derive its conclusion. Use it with the capture protocol in `evidence-assurance.md`; the report declares `assurance_version: 2`.

The audit stays read-only. Probes run in a temporary copy of the tracked files. The audited repository is compared with its manifest before and after every observation, and a run that changed it is discarded.

## Evidence kinds

Each verified finding names one basis in `verification.basis`. The gate checks the claim against the records. Claiming less than the records support is allowed; claiming more fails.

| Basis | What was done | What it shows | What it does not show |
|---|---|---|---|
| `source-quote` (default) | Exact lines quoted and independently reviewed | The text exists at that location | Behaviour; absence of a guard elsewhere |
| `static-search` | A regular-expression scan over the inventory, replayed by the gate | The pattern is present or absent in the scanned files | That the pattern was the right one to search for |
| `runtime-observation` | A probe executed snapshot code and a step deviated from the contract | The behaviour occurred for that input | That the cited lines cause it |
| `runtime-reproduction` | The same, and the deviation disappeared when the cited file was replaced with a control version | The behaviour occurs and depends on the cited file | Behaviour for other inputs; exploitability in production |
| `simulated-test` | A probe ran a model or stand-in, not the snapshot code | The reasoning is executable | Anything about the real code |

Fidelity is declared per probe: `real`, `stubbed` (name every stub in `stubs`) or `simulated`. The tool cannot tell a faithful stub from a convenient one. The reviewer states that judgement in `observation_review`.

## Recording an observation

The controller runs the tool. Workers write specifications and probes; they do not write to the evidence directory.

```bash
node .claude/skills/production-audit/scripts/observe.mjs <repo> <evidence-dir> <spec.json>
```

Common specification fields: `kind` (`search` or `execution`), `actor`, `subject`, `claim`, `targets`. The subject is the ledger finding id the observation tests, a website topic or feature id, or a label such as `exploratory`. Targets are inventoried files the observation concerns. Ids are assigned in order: `OBS-001`, `OBS-002`.

### Search

```json
{ "kind": "search", "actor": "reviewer-1", "subject": "SEC-004",
  "claim": "No ownership comparison exists on the record path.",
  "targets": ["src/records.js"],
  "search": { "pattern": "owner|userId\\s*===", "flags": "i", "include": ["src/"], "expect": "absent" } }
```

The scan is line-based over tracked, non-excluded text files whose path starts with an `include` prefix (all files when omitted). Flags are limited to `i` and `u`; patterns to 300 characters. Lines beyond 4,000 characters are truncated and counted. Binary files are skipped and counted. The record stores the match count, up to 500 locations and a digest of all of them. `holds` is true when the count agrees with `expect`.

Record the search that could refute the claim, across the whole inventory. A zero-match search for a pattern nobody would write proves nothing; the reviewer assesses pattern choice.

### Execution

```json
{ "kind": "execution", "surface": "process", "fidelity": "real",
  "actor": "reviewer-1", "subject": "SEC-001",
  "claim": "A backslash path leaves the application origin.",
  "targets": ["src/redirect.js"],
  "probe": { "files": ["probe.mjs"], "command": ["node", "{probe}/probe.mjs"] },
  "control": { "replace": [{ "file": "src/redirect.js", "with": "redirect.control.js" }] },
  "links": ["node_modules"], "env": { "NODE_ENV": "test" }, "timeout_ms": 60000 }
```

Probe and control paths are relative to the specification file. The command is an argument array run without a shell, with `{probe}` and `{snapshot}` substituted. The working directory is the snapshot copy. `links` symlinks untracked dependency directories from the repository into the copy; tracked paths are refused.

The probe receives a scrubbed environment: `PATH`, a temporary `HOME`, the declared `env` values and four variables.

| Variable | Use |
|---|---|
| `SEATRIAL_SNAPSHOT` | Root of the snapshot copy. Import or start the target from here. |
| `SEATRIAL_PROBE` | Directory holding the probe files. |
| `SEATRIAL_STEPS` | Append one JSON object per line: `{"action", "expected", "observed"}`. |
| `SEATRIAL_ARTEFACTS` | Write screenshots, traces or logs here (20 files, 5 MB each). |

A step states the action taken with its exact input, the outcome the application's contract requires, and the outcome seen. The tool compares `expected` with `observed`; the probe does not announce a verdict. Results:

- `deviation`: the probe exited zero and at least one step differed.
- `conforms`: the probe exited zero and every step matched.
- `error`: non-zero exit, timeout, no steps or malformed steps. A crash after a deviating step is still an error.
- `unavailable`: recorded with `"unavailable": "<reason>"` in place of `probe` when the environment cannot run the check. It supports nothing and appears under what could not be assessed.

The control is a full replacement for one or more inventoried files, usually the smallest change that should remove the defect. It runs only after a deviation, in a second copy, with the same probe bytes. Control status: `discriminating` (the deviation disappeared), `non_discriminating` (it remained, so the probe does not depend on that code), `failed`, `absent` or `not_run`. The replacement is never applied to the audited repository and is not a fix recommendation.

## What the report declares

- `assurance_version: 2` and `coverage.observation_head`: the last record's `receipt_sha256`, or the manifest hash when there are none.
- `verification.basis` and `verification.observations` on findings. A survivor cites observations recorded for the findings merged into it.
- `observations` on a dropped entry.
- `observation` on a website evidence entry. Under version 2, `interactive` and `rendered` evidence must name a completed `web` observation whose subject is that topic or feature id.
- `coverage.other_observations`: ids recorded for no finding, such as exploratory searches.
- `observation_review` on the review record of any verified finding that cites an observation: what was run or searched, how it exercises the cited code, what it cannot show.

## Gate rules

`audit-check.mjs --repo <repo> --assurance <evidence-dir>` re-derives rather than trusts. It fails when:

- the observation chain is broken, reordered, from another run or differs from `coverage.observation_head`;
- records exist and the report declares version 1, or a legacy report cites observation-backed evidence;
- a stored specification, probe, output, step record, artefact or control replacement differs from its recorded hash;
- a replayed search returns a different result, or a recorded probe result disagrees with its stored steps;
- any observation is unaccounted for. Each is cited exactly once, on the disposition of its subject. A failed attempt cannot be left out;
- a cited observation was recorded for a different subject, or its targets do not include the finding's location;
- the basis claims more than the records support, including a reproduction whose control does not change the finding's file;
- a verified finding has a real probe that conformed and no reproduction with a discriminating control, without `verification.observation_conflict_note` (at least 20 characters; rendered as a warning). An uncontrolled deviation does not cancel a conforming run;
- a dropped finding has a reproduction with a discriminating control. Report it at the severity its consequence supports;
- the source changed after capture. Restart capture; observations do not carry across snapshots.

The gate replays searches and re-hashes artefacts. It never executes a probe.

## Limits

- The tool is not a sandbox. It scrubs the environment and isolates the file tree; it does not block the network or contain a hostile target. Run probes only where executing the target is acceptable, never against a production service, real accounts or paid APIs.
- Hash chains detect change relative to the declared head. An actor who can rewrite the whole evidence directory can forge a consistent one. Controller isolation is still required.
- A probe that reads source text and pattern-matches it will pass a control without executing anything. That is a static check; record it as a search. The reviewer's `observation_review` is the control against this.
- A conforming probe shows that one input conformed. It does not show the defect is absent.
- Timing-dependent probes can differ between runs. State the dependence in the claim, or record the non-determinism as a limitation.

## Adapters

An adapter is a probe convention. The record format does not change. A new surface needs only a probe that writes steps and artefacts.

- **`process`**: import or start the target from `SEATRIAL_SNAPSHOT` and call it. Implemented and tested.
- **`web`**: the probe serves the snapshot on a loopback port, drives a browser, writes one step per user action with the expected and observed page state, and saves screenshots or traces as artefacts. The browser library belongs to the controller's environment and never to this repository. `fixtures/observation/web-journey/` holds a working example.
- **`game`**: the probe launches a headless or scripted build, feeds an input script, and writes one step per checkpoint: expected and observed state, frame or tick, with captures as artefacts. No example ships yet. Record `unavailable` with the reason until a build can run.

Surface names are a closed list in `observation.mjs` (`SURFACES`). Adding one is a contract change: bump the format version if any record field changes meaning.

## Handing findings to another tool

`export-findings.mjs` writes a `seatrial-findings/1` bundle from a gated audit. See `findings-interchange.md`.
