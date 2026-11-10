# Web journey example

A worked `web` observation for `references/observation-contract.md`. `site/index.html` is the audited page: it accepts a second submission while the first is in flight. `probe.mjs` serves the snapshot on a loopback port, drives a browser through the journey and records one step per action. `index.control.html` is the control: the same page with the button disabled on submit.

```json
{ "kind": "execution", "surface": "web", "fidelity": "real",
  "actor": "reviewer-1", "subject": "FE-001",
  "claim": "A double click places two orders.",
  "targets": ["site/index.html"],
  "probe": { "files": ["probe.mjs"], "command": ["node", "{probe}/probe.mjs"] },
  "control": { "replace": [{ "file": "site/index.html", "with": "index.control.html" }] },
  "env": { "NODE_PATH": "<where the controller's browser library lives>",
           "PLAYWRIGHT_BROWSERS_PATH": "<where its browsers live>" } }
```

Expected record: `deviation` on the snapshot (the status reads two orders), `discriminating` control, one screenshot artefact. `test-observation.mjs` runs this end to end when a browser library resolves and skips it otherwise.

The probe environment is scrubbed, so the two variables are passed explicitly. The browser library is the controller's; this repository stays dependency-free.
