# Coverage measurement: giving "all issues" a denominator

The goal is "show all issues." You can never *prove* you found every issue — but you can make coverage **measurable and visible**, so the reader knows what was actually examined and what was not. Without this, "comprehensive audit" is an unfalsifiable claim; with it, the report states "lens X examined these N of M source files" and the gaps are explicit. An audit that admits "I did not look at the `/jobs` worker code" is more trustworthy than one that silently never looked and implies full coverage.

## Build the file inventory first (the denominator)

During Stage 0/1, enumerate the source files in scope and record the count. This is the denominator. Exclude vendored/generated paths (`node_modules`, `vendor`, `dist`, `build`, `.next`, lockfiles, `__generated__`) — count the code a human wrote and owns. Record:

```jsonc
"coverage": {
  "files_total": 142,        // owned source files in scope
  "files_examined": 138,     // files at least one lens actually opened/grepped
  "areas_total": 9,          // logical areas (see below)
  "matrix": [ ... ]          // lens × area, below
}
```

`files_examined` counts files that at least one lens actually read or searched — not files that merely exist. If a lens subagent reports it never reached a directory, those files are not examined, and the difference between `files_total` and `files_examined` is the unaudited remainder that must be named in "what could not be assessed."

## The lens × area matrix

Decompose the app into logical **areas** (not just folders — functional surfaces). Typical areas: `auth`, `api-routes`, `data-layer`, `ui-pages`, `components`, `background-jobs`, `config-and-env`, `third-party-integrations`, `infra-and-deploy`. Then record, for each lens that ran, which areas it actually covered:

| Lens \ Area | auth | api | data | ui | jobs | config | integrations |
|---|---|---|---|---|---|---|---|
| code-audit | ✓ | ✓ | ✓ | ✓ | partial | ✓ | ✓ |
| scaling-audit | — | ✓ | ✓ | — | ✗ | ✓ | ✓ |
| data-privacy | ✓ | ✓ | ✓ | partial | ✗ | ✓ | ✓ |
| accessibility | — | — | — | ✓ | — | — | — |

Legend: `✓` covered · `partial` partially covered (say what was skipped) · `✗` in scope but **not reached** (a real gap — the dangerous one) · `—` not applicable to this lens.

The cells that matter most are `✗`: a lens that *should* have covered an area but ran out of room. Every `✗` is an explicit coverage gap that the report's "what could not be assessed" section must list. `partial` cells need a one-line note on what was left out.

## How this connects to the harness and the report

- The harness (`audit-check.mjs`) **hard-fails** when `coverage` is missing, when `files_total`/`files_examined` are absent, or when `files_examined < files_total` without `scope.partial=true` — under-coverage that is neither complete nor acknowledged as partial blocks the audit.
- The report (`report-format.md`) renders the matrix and derives the "what could not be assessed" section from the `✗` and `partial` cells, so honesty about gaps is generated from data, not from the author remembering to be honest.

## On staged / interrupted runs

A full sweep often will not finish in one session (see the budgeting section in `SKILL.md`). When that happens, the matrix is how a partial run stays honest: lenses that have not run yet are whole empty rows, visibly distinct from lenses that ran and covered everything. A reader glancing at the matrix sees immediately that the audit is one-third done — which is the point. A partial audit that says so plainly is useful; one that looks complete is dangerous.
