# Findings interchange (`seatrial-findings/1`)

Another tool, such as a build studio with its own quality gate, can consume an audit without re-reading the report prose. `export-findings.mjs` writes one JSON bundle from a gated audit. It gates a private snapshot first and prints nothing if the gate fails.

```bash
node .claude/skills/production-audit/scripts/export-findings.mjs audit/ --repo . --assurance /external/evidence/run-01 > findings.bundle.json
node .claude/skills/production-audit/scripts/export-findings.mjs --verify findings.bundle.json
```

`--legacy` exports a historical audit and marks every verified finding `self-reported`.

## Bundle

| Field | Content |
|---|---|
| `format` | `seatrial-findings/1` |
| `producer` | Gate result, gate warnings, `evidence_level` (`assurance-1`, `assurance-2` or `self-reported`), report mode |
| `source` | `manifest_sha256` and capture run id of the audited snapshot, file coverage counts, `partial`, lenses run and deferred |
| `report_sha256`, `ledger_sha256` | Hashes of the exact bytes the gate checked |
| `findings[]` | Each reported finding unchanged, plus `evidence_basis`, the gate's summary of its cited observations and `finding_sha256` |
| `dropped[]` | Id, reason and cited observations for every dropped finding |
| `unbound_observations[]` | Observations recorded for no finding |
| `limitations[]` | The report's named assessment limits |
| `bundle_sha256` | Seal over everything above |

## Rules for a consumer

1. Run `--verify` before reading. A changed severity, basis or id, or an added or removed finding, breaks a seal.
2. Compare `source.manifest_sha256` with the build under assessment. A bundle for another snapshot describes other code: treat it as not applicable, never as a pass.
3. Keep SeaTrails ids, severities, verification status and evidence basis as exported. Record the consumer's own triage, owner and fix status in a separate file keyed by finding id.
4. Keep the two finding sets apart. A consumer's own findings are not SeaTrails findings and are never written into the bundle; a SeaTrails finding is not a result of the consumer's gate.
5. The consumer's gate still runs in full. An empty `findings` array means these lenses reported nothing on the files examined. `partial: true`, deferred lenses, limitations and `unavailable` observations are open questions the consumer inherits.
6. Read `evidence_basis` before acting. `runtime-reproduction` shows behaviour tied to the cited file for one input. `source-quote` shows reviewed text. `self-reported` shows a claim.

## Limits

The seal detects edits; it does not authenticate the author. A party able to rewrite and reseal a bundle can forge one, so a consumer that needs authenticity re-runs the export from the audit directory and evidence it controls. The bundle carries observation summaries. Probes, outputs and artefacts stay in the evidence directory; re-running a probe against a later build is a new observation on a new capture.

A format change that alters the meaning of an existing field takes a new version string. Consumers reject versions they do not know.
