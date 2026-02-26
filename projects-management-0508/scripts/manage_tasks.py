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
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_data() -> dict[str, Any]:
    with DATA_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if "tasks" not in data or not isinstance(data["tasks"], list):
        raise ValueError("tasks.json must contain a top-level 'tasks' list")
    if "meta" not in data or not isinstance(data["meta"], dict):
        data["meta"] = {}
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


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "task"


def find_task(data: dict[str, Any], task_id: str) -> dict[str, Any]:
    for task in data["tasks"]:
        if task.get("id") == task_id:
            return task
    raise KeyError(f"Task not found: {task_id}")


def cmd_list(args: argparse.Namespace) -> int:
    data = load_data()
    for task in data["tasks"]:
        print(f"{task.get('id')}\t{task.get('status')}\t{task.get('projectName')}")
    return 0


def cmd_add(args: argparse.Namespace) -> int:
    data = load_data()
    now = utc_now()
    task_id = args.id or f"{slugify(args.project_name)}-{int(datetime.now(timezone.utc).timestamp())}"

    if any(task.get("id") == task_id for task in data["tasks"]):
        raise ValueError(f"Task id already exists: {task_id}")

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
        "createdAt": now,
        "updatedAt": now,
    }
    data["tasks"].insert(0, task)
    save_data(data)
    print(f"Added task: {task_id}")
    return 0


def cmd_delete(args: argparse.Namespace) -> int:
    data = load_data()
    before = len(data["tasks"])
    data["tasks"] = [task for task in data["tasks"] if task.get("id") != args.id]
    after = len(data["tasks"])

    if before == after:
        raise KeyError(f"Task not found: {args.id}")

    save_data(data)
    print(f"Deleted task: {args.id}")
    return 0


def convert_update_value(key: str, raw: str) -> Any:
    if key == "tags":
        return normalize_tags(raw)
    if key == "materials":
        return parse_materials(raw)
    return raw


def cmd_update(args: argparse.Namespace) -> int:
    data = load_data()
    task = find_task(data, args.id)

    for set_item in args.set_values:
        if "=" not in set_item:
            raise ValueError(f"Invalid --set format: {set_item}. Use key=value")
        key, value = set_item.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key not in ALLOWED_FIELDS:
            raise ValueError(f"Unsupported field: {key}")
        task[key] = convert_update_value(key, value)

    task["updatedAt"] = utc_now()
    save_data(data)
    print(f"Updated task: {args.id}")
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
        help="Set field value with key=value. Repeatable.",
    )
    update_parser.set_defaults(func=cmd_update)

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
