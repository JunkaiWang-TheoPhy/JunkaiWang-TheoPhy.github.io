# Agent Guide: projects-management-0508

This folder powers the sub-site:

- URL: `/projects-management-0508`
- UI entry: `projects-management-0508/index.html`
- Canonical data: `projects-management-0508/data/tasks.json`

## Data contract

`tasks.json` format:

```json
{
  "meta": {
    "title": "Research Projects",
    "updatedAt": "2026-02-26T00:00:00Z"
  },
  "tasks": [
    {
      "id": "unique-task-id",
      "projectName": "...",
      "discoveryDate": "YYYY-MM-DD",
      "status": "Backlog|In Progress|Blocked|Done",
      "statusReason": "...",
      "ideas": "...",
      "notes": "...",
      "materials": [{ "label": "paper", "url": "https://..." }],
      "assignedResearcher": "...",
      "tags": ["tag1", "tag2"],
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

## CLI operations for automation

Use the helper script:

```bash
python3 projects-management-0508/scripts/manage_tasks.py list
python3 projects-management-0508/scripts/manage_tasks.py add \
  --project-name "AI for Physics" \
  --status "Backlog" \
  --notes "Draft scope" \
  --tags "AI,physics"
python3 projects-management-0508/scripts/manage_tasks.py update \
  --id "ai-for-physics-1700000000" \
  --set status="In Progress" \
  --set assignedResearcher="Thomas"
python3 projects-management-0508/scripts/manage_tasks.py delete --id "ai-for-physics-1700000000"
```

## Browser workflow

- `+ New Task`: create task
- `Delete`: remove task
- `Export JSON`: download current board state
- `Import JSON`: load batch updates
- `Save to GitHub`: push current board state to target repo/path via GitHub API
- `Restore Repo Version`: discard browser draft and reload `data/tasks.json`

`Save to GitHub` details:
- Provide `owner`, `repo`, `branch`, `path` and a PAT with `contents: write`.
- The UI fetches current file SHA then commits updated JSON via `PUT /repos/{owner}/{repo}/contents/{path}`.
- Token is not saved to repository files.

Note: browser edits are stored in local draft unless you explicitly save to GitHub or update `data/tasks.json` in git.
