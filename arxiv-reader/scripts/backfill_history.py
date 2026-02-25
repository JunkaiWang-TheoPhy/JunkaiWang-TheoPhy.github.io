#!/usr/bin/env python3
"""Backfill historical arXiv papers into this static site format.

This script fetches recent papers from arXiv, filters by categories,
then writes:
1) data/YYYY-MM-DD.jsonl
2) data/YYYY-MM-DD_AI_enhanced_<LANGUAGE>.jsonl
3) assets/file-list.txt

The AI section is generated with deterministic stub text so the site
can display content before an LLM key is configured.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

import arxiv


CATEGORY_ALIASES = {
    "hepth": "hep-th",
    "hep-th": "hep-th",
    "hepex": "hep-ex",
    "hep-ex": "hep-ex",
    "grqc": "gr-qc",
    "gr-qc": "gr-qc",
    "mathph": "math-ph",
    "math-ph": "math-ph",
    "cmt": "cond-mat",
    "cond-mat": "cond-mat",
    "cond-mat.*": "cond-mat.*",
}


def clean_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def normalize_category(raw: str) -> str:
    value = (raw or "").strip().lower().replace("_", "-")
    if not value:
        return ""
    compact = value.replace("-", "")
    if value in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[value]
    if compact in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[compact]
    return value


def build_query_and_matchers(raw_categories: str) -> tuple[str, set[str], tuple[str, ...]]:
    terms: list[str] = []
    exact_match: set[str] = set()
    prefix_match: list[str] = []

    for cat in raw_categories.split(","):
        normalized = normalize_category(cat)
        if not normalized:
            continue

        if normalized == "cond-mat":
            terms.append("cat:cond-mat.*")
            prefix_match.append("cond-mat.")
            exact_match.add("cond-mat")
        elif normalized.endswith(".*"):
            terms.append(f"cat:{normalized}")
            prefix_match.append(normalized[:-1])
        else:
            terms.append(f"cat:{normalized}")
            exact_match.add(normalized)

    # Keep original order while deduplicating.
    seen = set()
    ordered_terms = []
    for term in terms:
        if term not in seen:
            ordered_terms.append(term)
            seen.add(term)

    if not ordered_terms:
        raise ValueError("No valid categories after normalization.")

    return " OR ".join(ordered_terms), exact_match, tuple(prefix_match)


def is_target_category(category: str, exact_match: set[str], prefix_match: tuple[str, ...]) -> bool:
    cat = normalize_category(category)
    if cat in exact_match:
        return True
    for prefix in prefix_match:
        if cat.startswith(prefix):
            return True
    return False


def make_stub_ai(summary: str, title: str, language: str) -> dict[str, str]:
    snippet = clean_text(summary)
    if len(snippet) > 260:
        snippet = snippet[:257].rstrip() + "..."

    if language.lower().startswith("ch"):
        return {
            "tldr": snippet or f"论文《{title}》需要阅读全文获取准确摘要。",
            "motivation": f"论文围绕《{title}》关注的问题展开，目标是回应该方向的核心需求。",
            "method": f"根据摘要，作者主要方法可概括为：{snippet or '请查看原文方法部分。'}",
            "result": "摘要层面未包含完整实验细节，建议结合论文正文中的结果章节阅读。",
            "conclusion": "该工作提供了新的研究线索，具体有效性与边界条件以原文为准。",
        }

    return {
        "tldr": snippet or f"The paper '{title}' needs full-text reading for an accurate summary.",
        "motivation": f"The paper focuses on the problem in '{title}' and addresses core needs in this area.",
        "method": f"From the abstract, the method can be summarized as: {snippet or 'See the method section in the paper.'}",
        "result": "The abstract does not include full experimental details; check the main paper for quantitative results.",
        "conclusion": "The work offers a useful direction; verify effectiveness and limits in the full text.",
    }


def select_display_categories(
    categories: list[str], exact_match: set[str], prefix_match: tuple[str, ...], primary: str | None
) -> list[str]:
    matched = []
    for cat in categories:
        normalized = normalize_category(cat)
        if normalized and is_target_category(normalized, exact_match, prefix_match):
            matched.append(normalized)

    if not matched:
        return []

    # Deduplicate while preserving order.
    seen = set()
    unique_matched = []
    for cat in matched:
        if cat not in seen:
            unique_matched.append(cat)
            seen.add(cat)

    primary_norm = normalize_category(primary or "")
    if primary_norm in seen:
        first = primary_norm
    else:
        first = unique_matched[0]

    ordered = [first] + [cat for cat in unique_matched if cat != first]
    return ordered


def fetch_backfill(
    query: str,
    days: int,
    max_results: int,
    page_size: int,
    delay_seconds: float,
    exact_match: set[str],
    prefix_match: tuple[str, ...],
    language: str,
) -> tuple[dict[str, list[dict]], dict[str, list[dict]]]:
    cutoff_date = datetime.now(timezone.utc).date() - timedelta(days=max(1, days) - 1)

    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending,
    )
    client = arxiv.Client(page_size=page_size, delay_seconds=delay_seconds, num_retries=3)

    raw_by_date: dict[str, dict[str, dict]] = defaultdict(dict)
    ai_by_date: dict[str, dict[str, dict]] = defaultdict(dict)

    for result in client.results(search):
        published_date = result.published.date()
        if published_date < cutoff_date:
            break

        categories = [clean_text(cat) for cat in (result.categories or [])]
        display_categories = select_display_categories(
            categories,
            exact_match=exact_match,
            prefix_match=prefix_match,
            primary=result.primary_category,
        )
        if not display_categories:
            continue

        short_id = clean_text(result.get_short_id()).split("v")[0]
        title = clean_text(result.title)
        summary = clean_text(result.summary)
        authors = [clean_text(author.name) for author in (result.authors or []) if clean_text(author.name)]

        raw_item = {
            "id": short_id,
            "categories": display_categories,
            "pdf": f"https://arxiv.org/pdf/{short_id}",
            "abs": f"https://arxiv.org/abs/{short_id}",
            "authors": authors,
            "title": title,
            "comment": clean_text(getattr(result, "comment", "")),
            "summary": summary,
        }
        ai_item = dict(raw_item)
        ai_item["AI"] = make_stub_ai(summary=summary, title=title, language=language)

        date_key = published_date.isoformat()
        # Use id as key for deduplication inside the same date.
        raw_by_date[date_key][short_id] = raw_item
        ai_by_date[date_key][short_id] = ai_item

    raw_output = {date: list(items.values()) for date, items in raw_by_date.items()}
    ai_output = {date: list(items.values()) for date, items in ai_by_date.items()}
    return raw_output, ai_output


def write_jsonl(records: list[dict], output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as handle:
        for item in records:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")


def update_file_list(data_dir: Path, file_list_path: Path) -> int:
    entries = sorted(path.name for path in data_dir.glob("*.jsonl"))
    content = "\n".join(entries)
    if content:
        content += "\n"
    file_list_path.write_text(content, encoding="utf-8")
    return len(entries)


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Backfill historical arXiv data for the static archive.")
    parser.add_argument(
        "--categories",
        default="hepth,cmt,gr-qc,hepex,math-ph",
        help="Comma-separated categories (aliases supported: hepth, cmt, gr-qc, hepex, math-ph).",
    )
    parser.add_argument("--days", type=int, default=14, help="How many recent days to backfill.")
    parser.add_argument("--max-results", type=int, default=1500, help="Maximum records requested from arXiv API.")
    parser.add_argument("--page-size", type=int, default=200, help="Page size for arXiv API client.")
    parser.add_argument(
        "--delay-seconds",
        type=float,
        default=1.0,
        help="Delay between arXiv API page requests.",
    )
    parser.add_argument("--language", default="Chinese", help="Language token used in output filename.")
    parser.add_argument("--data-dir", default=str(project_root / "data"), help="Directory for output JSONL files.")
    parser.add_argument(
        "--file-list",
        default=str(project_root / "assets" / "file-list.txt"),
        help="Path to assets/file-list.txt.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    data_dir = Path(args.data_dir).resolve()
    file_list_path = Path(args.file_list).resolve()
    data_dir.mkdir(parents=True, exist_ok=True)
    file_list_path.parent.mkdir(parents=True, exist_ok=True)

    query, exact_match, prefix_match = build_query_and_matchers(args.categories)
    print(f"Query: {query}")
    print(f"Target exact categories: {sorted(exact_match)}")
    print(f"Target prefix categories: {sorted(prefix_match)}")

    raw_by_date, ai_by_date = fetch_backfill(
        query=query,
        days=args.days,
        max_results=args.max_results,
        page_size=args.page_size,
        delay_seconds=args.delay_seconds,
        exact_match=exact_match,
        prefix_match=prefix_match,
        language=args.language,
    )

    if not ai_by_date:
        print("No data fetched for the requested settings.")
        return

    dates = sorted(ai_by_date.keys(), reverse=True)
    total_records = 0

    for date in dates:
        raw_path = data_dir / f"{date}.jsonl"
        ai_path = data_dir / f"{date}_AI_enhanced_{args.language}.jsonl"

        raw_records = raw_by_date.get(date, [])
        ai_records = ai_by_date.get(date, [])
        total_records += len(ai_records)

        write_jsonl(raw_records, raw_path)
        write_jsonl(ai_records, ai_path)
        print(f"Wrote {len(ai_records):4d} papers for {date} -> {ai_path.name}")

    listed = update_file_list(data_dir=data_dir, file_list_path=file_list_path)
    print(f"Updated file list with {listed} jsonl files: {file_list_path}")
    print(f"Backfill complete: {len(dates)} day(s), {total_records} paper(s).")


if __name__ == "__main__":
    main()
