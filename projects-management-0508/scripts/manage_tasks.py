#!/usr/bin/env python3
"""Agent-friendly task manager for projects-management-0508/data/tasks.json."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "tasks.json"
PROFILE_FILE = ROOT / "config" / "journal_profiles.json"
GROUP_ORDER = ["eng", "journal", "science", "packaging"]
DEFAULT_JOURNAL = "PRD"

ALLOWED_FIELDS = {
    "projectName",
    "discoveryDate",
    "status",
    "statusReason",
    "ideas",
    "notes",
    "materials",
    "assignedResearcher",
    "tags",
    "targetJournal",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_profiles() -> dict[str, Any]:
    with PROFILE_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if "journals" not in data or not isinstance(data["journals"], dict):
        raise ValueError("journal_profiles.json must contain a top-level 'journals' object")
    return data


def journal_codes(profiles: dict[str, Any]) -> list[str]:
    return list(profiles.get("journals", {}).keys())


def normalize_journal(code: str, profiles: dict[str, Any]) -> str:
    codes = journal_codes(profiles)
    if code in codes:
        return code
    if DEFAULT_JOURNAL in codes:
        return DEFAULT_JOURNAL
    if codes:
        return codes[0]
    raise ValueError("No journal profiles available")


def create_done_template(journal: str, profiles: dict[str, Any]) -> dict[str, dict[str, bool]]:
    journal_code = normalize_journal(journal, profiles)
    gates = profiles["journals"][journal_code].get("gates", {})
    done: dict[str, dict[str, bool]] = {group: {} for group in GROUP_ORDER}
    for group in GROUP_ORDER:
        for item in gates.get(group, []):
            key = item.get("key")
            if key:
                done[group][key] = False
    return done


def normalize_done(done: Any, journal: str, profiles: dict[str, Any]) -> dict[str, dict[str, bool]]:
    base = create_done_template(journal, profiles)
    source = done if isinstance(done, dict) else {}

    for group in GROUP_ORDER:
        source_group = source.get(group, {}) if isinstance(source.get(group, {}), dict) else {}
        normalized: dict[str, bool] = {}

        for key in base[group]:
            normalized[key] = bool(source_group.get(key, False))

        for key, value in source_group.items():
            if key not in normalized:
                normalized[key] = bool(value)

        base[group] = normalized

    return base


def normalize_task(task: dict[str, Any], profiles: dict[str, Any]) -> dict[str, Any]:
    journal = normalize_journal(str(task.get("targetJournal", DEFAULT_JOURNAL)), profiles)
    task["targetJournal"] = journal
    task["materials"] = task.get("materials") if isinstance(task.get("materials"), list) else []
    task["tags"] = task.get("tags") if isinstance(task.get("tags"), list) else []
    task["done"] = normalize_done(task.get("done"), journal, profiles)
    return task


def load_data(profiles: dict[str, Any]) -> dict[str, Any]:
    with DATA_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if "tasks" not in data or not isinstance(data["tasks"], list):
        raise ValueError("tasks.json must contain a top-level 'tasks' list")
    if "meta" not in data or not isinstance(data["meta"], dict):
        data["meta"] = {}

    data["tasks"] = [normalize_task(task, profiles) for task in data["tasks"]]
    return data


def save_data(data: dict[str, Any]) -> None:
    data["meta"]["updatedAt"] = utc_now()
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def normalize_tags(text: str) -> list[str]:
    return [x.strip() for x in text.split(",") if x.strip()]


def parse_materials(raw: str) -> list[dict[str, str]]:
    materials: list[dict[str, str]] = []
    for chunk in [x.strip() for x in raw.split(";") if x.strip()]:
        if "|" in chunk:
            label, url = chunk.split("|", 1)
            label = label.strip()
            url = url.strip()
            if url:
                materials.append({"label": label or url, "url": url})
            else:
                materials.append({"label": label or "material"})
        else:
            materials.append({"label": chunk})
    return materials


def parse_bool(raw: str) -> bool:
    lowered = raw.strip().lower()
    if lowered in {"1", "true", "yes", "y", "on"}:
        return True
    if lowered in {"0", "false", "no", "n", "off"}:
        return False
    raise ValueError(f"Expected boolean value, got: {raw}")


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "task"


def find_task(data: dict[str, Any], task_id: str) -> dict[str, Any]:
    for task in data["tasks"]:
        if task.get("id") == task_id:
            return task
    raise KeyError(f"Task not found: {task_id}")


def compute_done_progress(task: dict[str, Any], profiles: dict[str, Any]) -> tuple[int, int, dict[str, list[str]]]:
    journal = normalize_journal(str(task.get("targetJournal", DEFAULT_JOURNAL)), profiles)
    profile = profiles["journals"][journal]
    gates = profile.get("gates", {})
    done = task.get("done", {}) if isinstance(task.get("done", {}), dict) else {}

    total = 0
    completed = 0
    missing_by_group: dict[str, list[str]] = {group: [] for group in GROUP_ORDER}

    for group in GROUP_ORDER:
        group_items = gates.get(group, [])
        group_done = done.get(group, {}) if isinstance(done.get(group, {}), dict) else {}
        for item in group_items:
            key = item.get("key")
            if not key:
                continue
            total += 1
            if bool(group_done.get(key, False)):
                completed += 1
            else:
                label = item.get("label", key)
                missing_by_group[group].append(f"{key} ({label})")

    return completed, total, missing_by_group


def apply_set(task: dict[str, Any], key: str, raw_value: str, profiles: dict[str, Any]) -> None:
    if key in ALLOWED_FIELDS:
        if key == "tags":
            task[key] = normalize_tags(raw_value)
            return
        if key == "materials":
            task[key] = parse_materials(raw_value)
            return
        if key == "targetJournal":
            journal = normalize_journal(raw_value, profiles)
            task["targetJournal"] = journal
            task["done"] = normalize_done(task.get("done"), journal, profiles)
            return

        task[key] = raw_value
        return

    if key.startswith("done."):
        parts = key.split(".")
        if len(parts) != 3:
            raise ValueError("done update key must be done.<group>.<gate>")

        _, group, gate_key = parts
        if group not in GROUP_ORDER:
            raise ValueError(f"Unknown done group: {group}")

        if "done" not in task or not isinstance(task["done"], dict):
            task["done"] = create_done_template(task.get("targetJournal", DEFAULT_JOURNAL), profiles)
        if group not in task["done"] or not isinstance(task["done"][group], dict):
            task["done"][group] = {}

        task["done"][group][gate_key] = parse_bool(raw_value)
        return

    raise ValueError(f"Unsupported field: {key}")


def parse_gate_payload_text(text: str) -> dict[str, Any]:
    payload = json.loads(text)
    if not isinstance(payload, dict):
        raise ValueError("Gate payload must be a JSON object")

    if "done" in payload:
        done_obj = payload.get("done")
        if not isinstance(done_obj, dict):
            raise ValueError("payload.done must be an object")
        payload = done_obj

    result: dict[str, Any] = {}
    for group in GROUP_ORDER:
        if group in payload:
            group_obj = payload[group]
            if not isinstance(group_obj, dict):
                raise ValueError(f"payload.{group} must be an object")
            result[group] = group_obj
    return result


def apply_gate_payload(
    task: dict[str, Any], payload: dict[str, Any], profiles: dict[str, Any], mode: str = "merge"
) -> None:
    if mode not in {"merge", "replace"}:
        raise ValueError("mode must be merge or replace")

    journal = normalize_journal(str(task.get("targetJournal", DEFAULT_JOURNAL)), profiles)

    if mode == "replace":
        task["done"] = create_done_template(journal, profiles)
    else:
        task["done"] = normalize_done(task.get("done"), journal, profiles)

    for group in GROUP_ORDER:
        if group not in payload:
            continue
        group_obj = payload[group]
        for gate_key, gate_value in group_obj.items():
            if isinstance(gate_value, bool):
                parsed = gate_value
            elif isinstance(gate_value, str):
                parsed = parse_bool(gate_value)
            elif isinstance(gate_value, (int, float)):
                parsed = bool(gate_value)
            else:
                raise ValueError(f"Unsupported value for {group}.{gate_key}: {gate_value!r}")
            task["done"][group][gate_key] = parsed

    task["done"] = normalize_done(task["done"], journal, profiles)


def cmd_list(args: argparse.Namespace) -> int:
    profiles = load_profiles()
    data = load_data(profiles)
    for task in data["tasks"]:
        completed, total, _ = compute_done_progress(task, profiles)
        pct = 0 if total == 0 else round(completed * 100 / total)
        print(
            f"{task.get('id')}\t{task.get('status')}\t{task.get('targetJournal')}\t"
            f"DONE:{completed}/{total}({pct}%)\t{task.get('projectName')}"
        )
    return 0


def cmd_add(args: argparse.Namespace) -> int:
    profiles = load_profiles()
    data = load_data(profiles)
    now = utc_now()
    task_id = args.id or f"{slugify(args.project_name)}-{int(datetime.now(timezone.utc).timestamp())}"

    if any(task.get("id") == task_id for task in data["tasks"]):
        raise ValueError(f"Task id already exists: {task_id}")

    target_journal = normalize_journal(args.target_journal or DEFAULT_JOURNAL, profiles)

    task = {
        "id": task_id,
        "projectName": args.project_name,
        "discoveryDate": args.discovery_date or "",
        "status": args.status or "Backlog",
        "statusReason": args.status_reason or "",
        "ideas": args.ideas or "",
        "notes": args.notes or "",
        "materials": parse_materials(args.materials or ""),
        "assignedResearcher": args.assigned_researcher or "",
        "tags": normalize_tags(args.tags or ""),
        "targetJournal": target_journal,
        "done": create_done_template(target_journal, profiles),
        "createdAt": now,
        "updatedAt": now,
    }
    data["tasks"].insert(0, task)
    save_data(data)
    print(f"Added task: {task_id}")
    return 0


def cmd_delete(args: argparse.Namespace) -> int:
    profiles = load_profiles()
    data = load_data(profiles)
    before = len(data["tasks"])
    data["tasks"] = [task for task in data["tasks"] if task.get("id") != args.id]
    after = len(data["tasks"])

    if before == after:
        raise KeyError(f"Task not found: {args.id}")

    save_data(data)
    print(f"Deleted task: {args.id}")
    return 0


def cmd_update(args: argparse.Namespace) -> int:
    profiles = load_profiles()
    data = load_data(profiles)
    task = find_task(data, args.id)

    for set_item in args.set_values:
        if "=" not in set_item:
            raise ValueError(f"Invalid --set format: {set_item}. Use key=value")
        key, value = set_item.split("=", 1)
        apply_set(task, key.strip(), value.strip(), profiles)

    task["updatedAt"] = utc_now()
    save_data(data)
    print(f"Updated task: {args.id}")
    return 0


def cmd_apply_gates(args: argparse.Namespace) -> int:
    profiles = load_profiles()
    data = load_data(profiles)
    task = find_task(data, args.id)

    if bool(args.file) == bool(args.json):
        raise ValueError("Use exactly one of --file or --json")

    if args.file:
        text = Path(args.file).read_text(encoding="utf-8")
    else:
        text = args.json

    payload = parse_gate_payload_text(text)
    if not payload:
        raise ValueError("Gate payload does not contain any of eng/journal/science/packaging")

    apply_gate_payload(task, payload, profiles, mode=args.mode)
    completed, total, _ = compute_done_progress(task, profiles)

    if args.auto_status:
        task["status"] = "Done" if total > 0 and completed == total else "In Progress"

    task["updatedAt"] = utc_now()
    save_data(data)

    pct = 0 if total == 0 else round(completed * 100 / total)
    print(f"Applied gates for {args.id}: DONE {completed}/{total} ({pct}%)")
    return 0


def format_done_report(data: dict[str, Any], profiles: dict[str, Any]) -> str:
    lines = [
        "# DONE Compliance Report",
        "",
        f"Generated at: {utc_now()}",
        "",
    ]

    for task in data["tasks"]:
        completed, total, missing = compute_done_progress(task, profiles)
        pct = 0 if total == 0 else round(completed * 100 / total)
        lines.append(f"## {task.get('projectName', 'Untitled')} ({task.get('id', '-')})")
        lines.append("")
        lines.append(f"- status: {task.get('status', '-')}")
        lines.append(f"- target_journal: {task.get('targetJournal', '-')}")
        lines.append(f"- done: {completed}/{total} ({pct}%)")
        for group in GROUP_ORDER:
            missing_items = missing.get(group, [])
            if not missing_items:
                lines.append(f"- {group}: all gates complete")
            else:
                lines.append(f"- {group}: missing {len(missing_items)}")
                for item in missing_items:
                    lines.append(f"  - {item}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def cmd_done_report(args: argparse.Namespace) -> int:
    profiles = load_profiles()
    data = load_data(profiles)
    report = format_done_report(data, profiles)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(report, encoding="utf-8")
        print(f"Wrote report: {output_path}")
    else:
        print(report, end="")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage tasks for projects-management-0508")
    sub = parser.add_subparsers(dest="command", required=True)

    list_parser = sub.add_parser("list", help="List all tasks")
    list_parser.set_defaults(func=cmd_list)

    add_parser = sub.add_parser("add", help="Add a new task")
    add_parser.add_argument("--id", help="Optional task id")
    add_parser.add_argument("--project-name", required=True)
    add_parser.add_argument("--discovery-date")
    add_parser.add_argument("--status")
    add_parser.add_argument("--status-reason")
    add_parser.add_argument("--ideas")
    add_parser.add_argument("--notes")
    add_parser.add_argument("--materials", help="Semicolon list: label|url;label|url")
    add_parser.add_argument("--assigned-researcher")
    add_parser.add_argument("--tags", help="Comma-separated tags")
    add_parser.add_argument("--target-journal", help="PRL|PRX|PRD|JHEP|SciPost|CQG")
    add_parser.set_defaults(func=cmd_add)

    delete_parser = sub.add_parser("delete", help="Delete a task by id")
    delete_parser.add_argument("--id", required=True)
    delete_parser.set_defaults(func=cmd_delete)

    update_parser = sub.add_parser("update", help="Update fields for one task")
    update_parser.add_argument("--id", required=True)
    update_parser.add_argument(
        "--set",
        dest="set_values",
        action="append",
        required=True,
        help="Set field value with key=value. Use done.<group>.<gate>=true|false for gates.",
    )
    update_parser.set_defaults(func=cmd_update)

    apply_parser = sub.add_parser(
        "apply-gates",
        help="Apply gate results in batch from JSON payload for one task",
    )
    apply_parser.add_argument("--id", required=True)
    apply_parser.add_argument("--file", help="Path to JSON payload")
    apply_parser.add_argument("--json", help="Inline JSON payload")
    apply_parser.add_argument(
        "--mode",
        choices=["merge", "replace"],
        default="merge",
        help="merge: patch provided keys, replace: reset template then apply",
    )
    apply_parser.add_argument(
        "--auto-status",
        action="store_true",
        help="Set status to Done only when all gates are complete, else In Progress",
    )
    apply_parser.set_defaults(func=cmd_apply_gates)

    report_parser = sub.add_parser("done-report", help="Print DONE compliance report")
    report_parser.add_argument("--output", help="Optional markdown output path")
    report_parser.set_defaults(func=cmd_done_report)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return args.func(args)
    except Exception as exc:  # noqa: BLE001
        parser.error(str(exc))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
