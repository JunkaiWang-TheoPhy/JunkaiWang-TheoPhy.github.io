# Agent Guide: projects-management-0508

This folder powers the sub-site:

- URL: `/projects-management-0508`
- UI entry: `projects-management-0508/index.html`
- Canonical data: `projects-management-0508/data/tasks.json`
- Journal profiles: `projects-management-0508/config/journal_profiles.json`
- Batch gate payload example: `projects-management-0508/config/gate_payload.example.json`

## DONE contract

Global predicate:

```
DONE(PR) = G_eng ∧ G_journal ∧ G_science ∧ G_packaging
```

Each task must declare `targetJournal` in:

- `PRL`
- `PRX`
- `PRD`
- `JHEP`
- `SciPost`
- `CQG`

Gate keys are journal-specific and are defined in `config/journal_profiles.json`.
Prompt constraints for auto-agents are also stored per journal in:

- `journals.<code>.promptPolicy.judge`
- `journals.<code>.promptPolicy.writer`
- `journals.<code>.metrics`

Chinese LaTeX policy (global):

- If Chinese text is present in manuscript sources, use `\usepackage{ctex}`.
- `xeCJK`, `CJK`, and `CJKutf8` are forbidden in this workflow.
- Track this with gate key: `done.eng.chinese_requires_ctex`.

Chat output policy (global):

- Do not paste raw `.tex` source in chat replies.
- Agents should edit or generate `.tex` files directly in repository paths, then report file paths and change summaries.
- Track this with gate key: `done.eng.no_raw_tex_in_chat`.

Language policy (journal + review):

- Default drafting/review language is Chinese (`zh`) across journal profiles.
- Chinese is allowed, but writing quality must still meet target-journal scholarly standards (topic framing, structure, terminology, and tone).
- Switch to English only when explicitly requested by user/task.
- Track with journal gates:
  - `done.journal.zh_journal_quality`
  - `done.journal.english_on_request`
- Shared review-level language policy is stored in `config/journal_profiles.json` under `reviewProfile`.
- Shared prompt-injection contract is under `reviewProfile.promptInjectionPlaceholder` and `reviewProfile.judgeRequiredOutputs` / `writerRequiredOutputs`.

PRL strengthening highlights:

- Added hard-style gates for abstract/body/headings/DAS formatting:
  - `done.journal.abstract_one_paragraph`
  - `done.journal.abstract_no_numbered_refs`
  - `done.journal.abstract_no_display_eq_or_tables`
  - `done.journal.runin_or_none_headings`
  - `done.journal.das_runin_format`
- Added positioning and literature gates:
  - `done.journal.positioning_known_gap_increment`
  - `done.journal.core_claims_priorwork_anchor`
  - `done.journal.recent_research_refs_min`
  - `done.journal.research_refs_ratio`
- Added derivation-closure gates:
  - `done.science.derivation_conditions_stated`
  - `done.science.new_criteria_defined_scoped`
  - `done.science.symbol_definition_coverage`
  - `done.science.assumptions_and_omitted_terms`
- Added presentation blacklist gate:
  - `done.journal.banned_process_language_main_text`

## Data contract

`tasks.json` format:

```json
{
  "meta": {
    "title": "Research Projects",
    "doneContract": "DONE(PR)=G_eng AND G_journal AND G_science AND G_packaging",
    "updatedAt": "2026-02-26T00:00:00Z"
  },
  "tasks": [
    {
      "id": "unique-task-id",
      "projectName": "...",
      "status": "Backlog|In Progress|Blocked|Done",
      "targetJournal": "PRD",
      "done": {
        "eng": { "compile": false },
        "journal": { "title_sentence_case": false },
        "science": { "claims_evidence_trace": false },
        "packaging": { "main_pdf": false }
      }
    }
  ]
}
```

## CLI operations for automation

Use the helper script:

```bash
python3 projects-management-0508/scripts/manage_tasks.py list

python3 projects-management-0508/scripts/manage_tasks.py add \
  --project-name "Weak Gravity Conjecture Update" \
  --target-journal "PRD" \
  --status "Backlog" \
  --tags "swampland,gravity"

python3 projects-management-0508/scripts/manage_tasks.py update \
  --id "weak-gravity-conjecture-update-1700000000" \
  --set targetJournal=JHEP \
  --set status="In Progress" \
  --set done.eng.compile=true \
  --set done.journal.jheppub_class=true

# Batch apply gate results (recommended for full-auto agents)
python3 projects-management-0508/scripts/manage_tasks.py apply-gates \
  --id "weak-gravity-conjecture-update-1700000000" \
  --file projects-management-0508/config/gate_payload.example.json \
  --mode merge \
  --auto-status

# Inline JSON payload is also supported
python3 projects-management-0508/scripts/manage_tasks.py apply-gates \
  --id "weak-gravity-conjecture-update-1700000000" \
  --json '{"eng":{"compile":true},"journal":{"title_case_jhep":true}}'

python3 projects-management-0508/scripts/manage_tasks.py done-report
python3 projects-management-0508/scripts/manage_tasks.py done-report \
  --output projects-management-0508/reports/journal_compliance_report.md
```

## Browser workflow

- `+ New Task`: create task with `targetJournal`
- Card-level `target_journal` selector: switch profile and gates
- Gate checkboxes: mark each requirement in `G_eng/G_journal/G_science/G_packaging`
- `Delete`: remove task
- `Export JSON`: download current board state
- `Import JSON`: load batch updates
- `Save to GitHub`: push current board state to target repo/path via GitHub API
- `Restore Repo Version`: discard browser draft and reload `data/tasks.json`

`Save to GitHub` details:

- Provide `owner`, `repo`, `branch`, `path` and a PAT with `contents: write`.
- UI fetches file SHA then commits updated JSON via `PUT /repos/{owner}/{repo}/contents/{path}`.
- Token is not saved into repository files.

Note: browser edits stay local unless you explicitly save to GitHub or commit updated data file in git.
