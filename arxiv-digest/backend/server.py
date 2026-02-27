#!/usr/bin/env python3
"""Local arXiv digest workstation server.

Run:
  python3 arxiv-digest/backend/server.py --host 127.0.0.1 --port 8502
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sqlite3
import threading
import time
import traceback
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
DB_PATH = ROOT_DIR / "backend" / "arxiv_digest.db"
DEFAULT_CATEGORIES = ["cs.CL", "cs.AI", "cs.LG", "cs.CV"]
ARXIV_API_URL = "https://export.arxiv.org/api/query"
ATOM_NS = "{http://www.w3.org/2005/Atom}"
ARXIV_NS = "{http://arxiv.org/schemas/atom}"
USER_AGENT = "arxiv-digest/1.0 (+https://junkaiwang-theophy.github.io/arxiv-digest)"

CATEGORY_LABELS = {
    "cs.CL": "NLP",
    "cs.AI": "AI",
    "cs.LG": "ML",
    "cs.CV": "CV",
    "cs.SE": "SE",
    "cs.HC": "HCI",
    "cs.IR": "IR",
}

KEYWORD_THEMES = {
    "agent": ("Agent", 1.9),
    "gui": ("GUI Agent", 1.8),
    "swe-bench": ("SWE-bench", 2.2),
    "rlhf": ("RLHF", 1.7),
    "rlvr": ("RLVR", 2.0),
    "chain-of-thought": ("CoT", 1.3),
    "reasoning": ("Reasoning", 1.3),
    "distillation": ("Distillation", 1.4),
    "alignment": ("Alignment", 1.3),
    "multimodal": ("Multimodal", 1.2),
    "code": ("Code", 1.0),
    "benchmark": ("Benchmark", 1.2),
    "sft": ("SFT", 1.1),
    "long context": ("Long Context", 1.1),
    "lora": ("LoRA", 1.0),
    "mixture of experts": ("MoE", 1.2),
}

RELATED_WORK_HINTS = {
    "swe-bench": "软件工程代理评测基准",
    "mmlu": "通用知识与推理评测",
    "gsm8k": "数学推理评测",
    "human-eval": "代码生成评测",
    "mt-bench": "多轮对话评测",
    "alpaca": "指令微调数据范式",
    "fugatto": "多模态生成模型",
    "llm": "通用大模型基线",
}


def utc_now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def compact_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def split_arxiv_identifier(raw_id: str) -> tuple[str, int]:
    match = re.search(r"(\d{4}\.\d{4,5})(v(\d+))?", raw_id)
    if not match:
        cleaned = raw_id.rsplit("/", 1)[-1].strip()
        return cleaned, 1
    version = int(match.group(3) or "1")
    return match.group(1), version


def safe_json_load(raw: str | None, fallback: Any) -> Any:
    if not raw:
        return fallback
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return fallback


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def parse_int(value: str | None, default: int, low: int | None = None, high: int | None = None) -> int:
    try:
        parsed = int(value or "")
    except ValueError:
        parsed = default
    if low is not None:
        parsed = max(low, parsed)
    if high is not None:
        parsed = min(high, parsed)
    return parsed


def extract_json_object(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if not text:
        return None

    # First try direct parse.
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    # Fallback: extract from fenced block or nearest object boundary.
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.S)
    candidate = fence_match.group(1) if fence_match else None
    if candidate is None:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = text[start : end + 1]

    if not candidate:
        return None

    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


class HeuristicAnalyzer:
    def __init__(self, interest_profile: str):
        self.interest_profile = interest_profile

    def _extract_tags(self, text: str, categories: list[str]) -> tuple[list[str], float]:
        lowered = text.lower()
        tags: list[str] = []
        weight_total = 0.0
        for needle, (tag, weight) in KEYWORD_THEMES.items():
            if needle in lowered:
                tags.append(tag)
                weight_total += weight

        for cat in categories:
            mapped = CATEGORY_LABELS.get(cat)
            if mapped and mapped not in tags:
                tags.append(mapped)

        ordered = []
        seen = set()
        for item in tags:
            if item not in seen:
                seen.add(item)
                ordered.append(item)

        return ordered[:8], weight_total

    def _estimate_score(self, paper: dict[str, Any], keyword_weight: float) -> float:
        title = paper["title"]
        summary = paper["summary"]
        published_raw = paper["published"]

        bonus = 0.0
        try:
            published_dt = dt.datetime.fromisoformat(published_raw.replace("Z", "+00:00"))
            age_hours = (dt.datetime.now(dt.timezone.utc) - published_dt).total_seconds() / 3600.0
            if age_hours <= 24:
                bonus += 2.0
            elif age_hours <= 72:
                bonus += 1.0
        except ValueError:
            pass

        if paper["primary_category"] in {"cs.CL", "cs.AI", "cs.LG"}:
            bonus += 0.5

        novelty = 0.0
        lowered = f"{title} {summary}".lower()
        for token in ["first", "novel", "new", "unified", "efficient", "robust", "scaling"]:
            if token in lowered:
                novelty += 0.12

        keyword_signal = min(3.4, keyword_weight * 0.65)
        score = 2.8 + keyword_signal + bonus + novelty
        return round(clamp(score, 1.0, 10.0), 1)

    def _research_route(self, text: str) -> str:
        lowered = text.lower()
        has_agent = any(token in lowered for token in ["agent", "tool", "planning", "act"])
        has_rl = any(token in lowered for token in ["reinforcement", "rl", "reward"])
        has_eval = any(token in lowered for token in ["benchmark", "evaluation", "swe-bench", "mmlu", "gsm8k"])
        has_theory = any(token in lowered for token in ["theorem", "bound", "proof", "convergence"])

        if has_agent and has_rl:
            return "混合路线：Agent 任务编排 + 强化学习反馈"
        if has_eval:
            return "基准驱动路线：以 benchmark 迭代为主轴"
        if has_theory:
            return "理论分析路线：从可证性质约束方法设计"
        return "工程优化路线：围绕效率、稳定性和可部署性推进"

    def _related_work(self, text: str) -> list[dict[str, str]]:
        lowered = text.lower()
        rows: list[dict[str, str]] = []
        for needle, desc in RELATED_WORK_HINTS.items():
            if needle in lowered:
                rows.append({"work": needle, "relation": desc})
        if not rows:
            rows.append({"work": "通用 LLM 基线", "relation": "摘要未显式点名，建议补读同任务主流 baseline"})
        return rows[:4]

    def analyze(self, paper: dict[str, Any]) -> dict[str, Any]:
        combo_text = f"{paper['title']} {paper['summary']}"
        tags, keyword_weight = self._extract_tags(combo_text, paper["categories"])
        score = self._estimate_score(paper, keyword_weight)

        summary_first = compact_text(paper["summary"])[:260]
        direction = CATEGORY_LABELS.get(paper["primary_category"], paper["primary_category"])

        features = [
            f"问题定义：{compact_text(paper['title'])[:88]}",
            f"核心方法：{summary_first}",
            f"关注方向：{direction} 与 {', '.join(tags[:3]) if tags else '通用模型能力'}",
        ]

        risks = [
            "需要核验实验设置和数据分布是否与目标场景匹配",
            "若仅在单一 benchmark 提升，泛化稳定性仍需观察",
        ]

        analysis = {
            "source": "heuristic",
            "one_line_summary": summary_first,
            "research_features": features,
            "research_direction": f"{direction} 方向，偏向 {', '.join(tags[:2]) if tags else '基础能力'}",
            "research_route": self._research_route(combo_text),
            "related_work": self._related_work(combo_text),
            "opportunities": [
                "把方法迁移到你的任务数据上做小规模复现实验",
                "拆分论文中的关键变量做对照组，验证增益来源",
            ],
            "risks": risks,
            "topic_tags": tags,
            "confidence": 0.45,
            "score": score,
        }
        return analysis


class DeepSeekAnalyzer:
    def __init__(self):
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
        self.api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat").strip() or "deepseek-chat"
        self.timeout_seconds = parse_int(os.getenv("DEEPSEEK_TIMEOUT", "45"), 45, low=10, high=120)

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def analyze(self, paper: dict[str, Any], interest_profile: str) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        endpoint = f"{self.base_url}/chat/completions"
        system_prompt = (
            "你是资深 AI 研究助手。请只输出 JSON，不要输出额外解释。"
            "JSON 必须包含字段: one_line_summary, research_features, research_direction, "
            "research_route, related_work, opportunities, risks, topic_tags, confidence。"
            "其中 related_work 为数组，每项包含 work 和 relation。"
            "research_features/opportunities/risks/topic_tags 均为字符串数组。"
            "confidence 为 0 到 1 的小数。"
        )
        user_prompt = (
            "请分析下面这篇 arXiv 论文，按研究笔记风格输出结构化结论。\n"
            f"用户关注方向: {interest_profile}\n"
            f"arXiv ID: {paper['arxiv_id']}\n"
            f"标题: {paper['title']}\n"
            f"类别: {', '.join(paper['categories'])}\n"
            f"摘要: {paper['summary']}\n"
            "输出要求:\n"
            "1) 用中文输出。\n"
            "2) related_work 至少给 2 项；若摘要信息不足可标注‘待补证据’。\n"
            "3) research_route 用一句话明确是工程、理论、基准驱动或混合路线。\n"
            "4) topic_tags 最多 8 项。\n"
        )

        payload = {
            "model": self.model,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }

        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": USER_AGENT,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                response_text = resp.read().decode("utf-8")
        except Exception:
            return None

        try:
            response_json = json.loads(response_text)
            content = response_json["choices"][0]["message"]["content"]
        except (KeyError, IndexError, json.JSONDecodeError, TypeError):
            return None

        parsed = extract_json_object(content)
        if not parsed:
            return None

        normalized = {
            "source": "llm",
            "one_line_summary": compact_text(str(parsed.get("one_line_summary", ""))),
            "research_features": [compact_text(str(x)) for x in parsed.get("research_features", []) if str(x).strip()],
            "research_direction": compact_text(str(parsed.get("research_direction", ""))),
            "research_route": compact_text(str(parsed.get("research_route", ""))),
            "related_work": [],
            "opportunities": [compact_text(str(x)) for x in parsed.get("opportunities", []) if str(x).strip()],
            "risks": [compact_text(str(x)) for x in parsed.get("risks", []) if str(x).strip()],
            "topic_tags": [compact_text(str(x)) for x in parsed.get("topic_tags", []) if str(x).strip()],
            "confidence": float(parsed.get("confidence", 0.55) or 0.55),
        }

        for row in parsed.get("related_work", []):
            if not isinstance(row, dict):
                continue
            work = compact_text(str(row.get("work", "")))
            relation = compact_text(str(row.get("relation", "")))
            if work or relation:
                normalized["related_work"].append({"work": work or "待补充", "relation": relation or "待补证据"})

        normalized["confidence"] = clamp(normalized["confidence"], 0.0, 1.0)
        normalized["research_features"] = normalized["research_features"][:6] or ["LLM 未返回明确条目，建议手动补充。"]
        normalized["opportunities"] = normalized["opportunities"][:5]
        normalized["risks"] = normalized["risks"][:5]
        normalized["topic_tags"] = normalized["topic_tags"][:8]
        normalized["related_work"] = normalized["related_work"][:6] or [
            {"work": "待补充", "relation": "未解析到显式 related work"}
        ]
        if not normalized["one_line_summary"]:
            normalized["one_line_summary"] = compact_text(paper["summary"])[:220]
        if not normalized["research_direction"]:
            normalized["research_direction"] = "方向待补充"
        if not normalized["research_route"]:
            normalized["research_route"] = "路线待补充"
        return normalized


class ArxivDigestStore:
    def __init__(self, db_path: Path, categories: list[str], max_results: int):
        self.db_path = db_path
        self.categories = categories
        self.max_results = max_results
        self.db_lock = threading.Lock()
        self.interest_profile = os.getenv(
            "ARXIV_DIGEST_INTEREST",
            "LLM Agent, 推理, 强化学习反馈, 代码智能, 可验证奖励, 低成本高效训练",
        )
        self.heuristic = HeuristicAnalyzer(self.interest_profile)
        self.llm = DeepSeekAnalyzer()
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_schema(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS papers (
                    arxiv_id TEXT PRIMARY KEY,
                    version INTEGER NOT NULL DEFAULT 1,
                    title TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    authors_json TEXT NOT NULL,
                    categories_json TEXT NOT NULL,
                    primary_category TEXT NOT NULL,
                    published TEXT NOT NULL,
                    updated TEXT NOT NULL,
                    link_abs TEXT NOT NULL,
                    link_pdf TEXT NOT NULL,
                    score REAL NOT NULL DEFAULT 0,
                    analysis_json TEXT NOT NULL,
                    llm_analysis_json TEXT,
                    llm_analyzed_at TEXT,
                    fetched_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS notes (
                    arxiv_id TEXT PRIMARY KEY,
                    references_text TEXT NOT NULL DEFAULT '',
                    ideas_text TEXT NOT NULL DEFAULT '',
                    questions_text TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS ideas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_papers_published ON papers(published DESC);
                CREATE INDEX IF NOT EXISTS idx_papers_primary_category ON papers(primary_category);
                CREATE INDEX IF NOT EXISTS idx_papers_score ON papers(score DESC);
                """
            )

    def _set_meta(self, key: str, value: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, value),
            )

    def _get_meta(self, key: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else None

    def fetch_from_arxiv(self, categories: list[str], max_results: int) -> list[dict[str, Any]]:
        query = " OR ".join([f"cat:{cat}" for cat in categories])
        params = {
            "search_query": query,
            "start": 0,
            "max_results": max_results,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
        }
        url = f"{ARXIV_API_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

        with urllib.request.urlopen(req, timeout=45) as resp:
            xml_payload = resp.read()

        root = ET.fromstring(xml_payload)
        entries: list[dict[str, Any]] = []
        for entry in root.findall(f"{ATOM_NS}entry"):
            entry_id = compact_text(entry.findtext(f"{ATOM_NS}id", ""))
            arxiv_id, version = split_arxiv_identifier(entry_id)

            title = compact_text(entry.findtext(f"{ATOM_NS}title", ""))
            summary = compact_text(entry.findtext(f"{ATOM_NS}summary", ""))
            published = compact_text(entry.findtext(f"{ATOM_NS}published", ""))
            updated = compact_text(entry.findtext(f"{ATOM_NS}updated", ""))

            authors = [
                compact_text(node.text or "")
                for node in entry.findall(f"{ATOM_NS}author/{ATOM_NS}name")
                if compact_text(node.text or "")
            ]

            categories = []
            for node in entry.findall(f"{ATOM_NS}category"):
                term = compact_text(node.attrib.get("term", ""))
                if term:
                    categories.append(term)

            primary_node = entry.find(f"{ARXIV_NS}primary_category")
            primary_category = (
                compact_text(primary_node.attrib.get("term", "")) if primary_node is not None else (categories[0] if categories else "unknown")
            )

            pdf_link = ""
            abs_link = entry_id
            for link in entry.findall(f"{ATOM_NS}link"):
                href = compact_text(link.attrib.get("href", ""))
                if not href:
                    continue
                title_tag = (link.attrib.get("title", "") or "").lower()
                rel = (link.attrib.get("rel", "") or "").lower()
                if title_tag == "pdf" or href.endswith(".pdf"):
                    pdf_link = href
                if rel == "alternate" and "/abs/" in href:
                    abs_link = href

            if not pdf_link and abs_link:
                pdf_link = abs_link.replace("/abs/", "/pdf/")

            paper = {
                "arxiv_id": arxiv_id,
                "version": version,
                "title": title,
                "summary": summary,
                "authors": authors,
                "categories": categories,
                "primary_category": primary_category,
                "published": published,
                "updated": updated,
                "link_abs": abs_link,
                "link_pdf": pdf_link,
            }
            if paper["arxiv_id"] and paper["title"]:
                entries.append(paper)

        return entries

    def refresh(
        self,
        categories: list[str] | None = None,
        max_results: int | None = None,
        auto_llm_top_k: int = 3,
    ) -> dict[str, Any]:
        categories = categories or self.categories
        max_results = max_results or self.max_results

        fetched_entries = self.fetch_from_arxiv(categories, max_results)
        now = utc_now_iso()

        inserted = 0
        updated = 0
        llm_candidates: list[tuple[str, float]] = []

        with self.db_lock:
            with self._connect() as conn:
                for paper in fetched_entries:
                    analysis = self.heuristic.analyze(paper)
                    score = float(analysis.get("score", 0))
                    llm_candidates.append((paper["arxiv_id"], score))

                    old = conn.execute(
                        "SELECT arxiv_id, version, updated FROM papers WHERE arxiv_id = ?",
                        (paper["arxiv_id"],),
                    ).fetchone()

                    conn.execute(
                        """
                        INSERT INTO papers (
                            arxiv_id, version, title, summary, authors_json, categories_json, primary_category,
                            published, updated, link_abs, link_pdf, score, analysis_json, fetched_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(arxiv_id) DO UPDATE SET
                            version = excluded.version,
                            title = excluded.title,
                            summary = excluded.summary,
                            authors_json = excluded.authors_json,
                            categories_json = excluded.categories_json,
                            primary_category = excluded.primary_category,
                            published = excluded.published,
                            updated = excluded.updated,
                            link_abs = excluded.link_abs,
                            link_pdf = excluded.link_pdf,
                            score = excluded.score,
                            analysis_json = excluded.analysis_json,
                            fetched_at = excluded.fetched_at
                        """,
                        (
                            paper["arxiv_id"],
                            paper["version"],
                            paper["title"],
                            paper["summary"],
                            json.dumps(paper["authors"], ensure_ascii=False),
                            json.dumps(paper["categories"], ensure_ascii=False),
                            paper["primary_category"],
                            paper["published"],
                            paper["updated"],
                            paper["link_abs"],
                            paper["link_pdf"],
                            score,
                            json.dumps(analysis, ensure_ascii=False),
                            now,
                        ),
                    )

                    if old is None:
                        inserted += 1
                    elif old["version"] != paper["version"] or old["updated"] != paper["updated"]:
                        updated += 1

                conn.execute(
                    "INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    ("last_refresh", now),
                )
                conn.execute(
                    "INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    ("last_refresh_count", str(len(fetched_entries))),
                )

        llm_enriched = 0
        if self.llm.enabled and auto_llm_top_k > 0:
            ranked = sorted(llm_candidates, key=lambda item: item[1], reverse=True)[:auto_llm_top_k]
            for arxiv_id, _ in ranked:
                if self.analyze_with_llm(arxiv_id, force=False):
                    llm_enriched += 1

        return {
            "ok": True,
            "fetched": len(fetched_entries),
            "inserted": inserted,
            "updated": updated,
            "llm_enriched": llm_enriched,
            "timestamp": now,
            "categories": categories,
        }

    def _row_to_paper(self, row: sqlite3.Row, include_summary: bool = True) -> dict[str, Any]:
        heuristic_analysis = safe_json_load(row["analysis_json"], {})
        llm_analysis = safe_json_load(row["llm_analysis_json"], None)
        analysis = llm_analysis or heuristic_analysis

        paper = {
            "arxiv_id": row["arxiv_id"],
            "version": row["version"],
            "title": row["title"],
            "summary": row["summary"] if include_summary else compact_text(row["summary"])[:180],
            "authors": safe_json_load(row["authors_json"], []),
            "categories": safe_json_load(row["categories_json"], []),
            "primary_category": row["primary_category"],
            "published": row["published"],
            "updated": row["updated"],
            "link_abs": row["link_abs"],
            "link_pdf": row["link_pdf"],
            "score": float(row["score"]),
            "analysis": analysis,
            "llm_ready": llm_analysis is not None,
            "llm_analyzed_at": row["llm_analyzed_at"],
        }
        return paper

    def list_papers(
        self,
        limit: int = 80,
        category: str = "all",
        search: str = "",
        date: str = "",
        include_summary: bool = False,
    ) -> list[dict[str, Any]]:
        conditions = []
        params: list[Any] = []

        if category and category != "all":
            conditions.append("categories_json LIKE ?")
            params.append(f'%"{category}"%')

        if search:
            conditions.append("(LOWER(title) LIKE ? OR LOWER(summary) LIKE ?)")
            keyword = f"%{search.lower()}%"
            params.extend([keyword, keyword])

        if date:
            conditions.append("substr(published, 1, 10) = ?")
            params.append(date)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"""
            SELECT * FROM papers
            {where_clause}
            ORDER BY score DESC, published DESC
            LIMIT ?
        """
        params.append(limit)

        with self._connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [self._row_to_paper(row, include_summary=include_summary) for row in rows]

    def get_paper(self, arxiv_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM papers WHERE arxiv_id = ?", (arxiv_id,)).fetchone()
        return self._row_to_paper(row, include_summary=True) if row else None

    def analyze_with_llm(self, arxiv_id: str, force: bool = False) -> bool:
        if not self.llm.enabled:
            return False

        with self.db_lock:
            with self._connect() as conn:
                row = conn.execute("SELECT * FROM papers WHERE arxiv_id = ?", (arxiv_id,)).fetchone()
                if not row:
                    return False

                if row["llm_analysis_json"] and not force:
                    return True

                paper = self._row_to_paper(row, include_summary=True)

            llm_analysis = self.llm.analyze(paper, self.interest_profile)
            if not llm_analysis:
                return False

            llm_analysis["score"] = float(row["score"])
            now = utc_now_iso()

            with self._connect() as conn:
                conn.execute(
                    """
                    UPDATE papers
                    SET llm_analysis_json = ?, llm_analyzed_at = ?
                    WHERE arxiv_id = ?
                    """,
                    (json.dumps(llm_analysis, ensure_ascii=False), now, arxiv_id),
                )
        return True

    def get_notes(self, arxiv_id: str) -> dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM notes WHERE arxiv_id = ?", (arxiv_id,)).fetchone()
        if not row:
            return {
                "arxiv_id": arxiv_id,
                "references_text": "",
                "ideas_text": "",
                "questions_text": "",
                "updated_at": None,
            }
        return {
            "arxiv_id": row["arxiv_id"],
            "references_text": row["references_text"],
            "ideas_text": row["ideas_text"],
            "questions_text": row["questions_text"],
            "updated_at": row["updated_at"],
        }

    def save_notes(self, arxiv_id: str, references_text: str, ideas_text: str, questions_text: str) -> dict[str, Any]:
        now = utc_now_iso()
        with self.db_lock:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO notes(arxiv_id, references_text, ideas_text, questions_text, updated_at)
                    VALUES(?, ?, ?, ?, ?)
                    ON CONFLICT(arxiv_id) DO UPDATE SET
                        references_text = excluded.references_text,
                        ideas_text = excluded.ideas_text,
                        questions_text = excluded.questions_text,
                        updated_at = excluded.updated_at
                    """,
                    (arxiv_id, references_text, ideas_text, questions_text, now),
                )
        return self.get_notes(arxiv_id)

    def list_ideas(self, limit: int = 40) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT id, content, created_at FROM ideas ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [
            {"id": int(row["id"]), "content": row["content"], "created_at": row["created_at"]}
            for row in rows
        ]

    def add_idea(self, content: str) -> dict[str, Any]:
        now = utc_now_iso()
        with self.db_lock:
            with self._connect() as conn:
                cursor = conn.execute(
                    "INSERT INTO ideas(content, created_at) VALUES(?, ?)",
                    (content, now),
                )
                idea_id = cursor.lastrowid
        return {"id": idea_id, "content": content, "created_at": now}

    def digest(self, date: str = "") -> dict[str, Any]:
        papers = self.list_papers(limit=200, include_summary=True)
        if not papers:
            return {
                "date": date or dt.date.today().isoformat(),
                "hot_count": 0,
                "focus_count": 0,
                "read_later_count": 0,
                "topic_tags": [],
                "summary_blocks": [],
                "highlight_cards": [],
            }

        if not date:
            date = papers[0]["published"][:10]

        daily = [paper for paper in papers if paper["published"].startswith(date)]
        target = daily if daily else papers[: min(60, len(papers))]

        tag_counter: Counter[str] = Counter()
        category_counter: Counter[str] = Counter()

        for paper in target:
            for tag in paper.get("analysis", {}).get("topic_tags", []):
                tag_counter[tag] += 1
            category_counter[paper["primary_category"]] += 1

        hot_count = sum(1 for paper in target if paper["score"] >= 8.0)
        focus_count = sum(1 for paper in target if 6.5 <= paper["score"] < 8.0)
        read_later_count = max(0, len(target) - hot_count - focus_count)

        top_tags = [tag for tag, _ in tag_counter.most_common(8)]
        top_categories = ", ".join(
            [f"{CATEGORY_LABELS.get(cat, cat)} {count}" for cat, count in category_counter.most_common(4)]
        )
        top_papers = sorted(target, key=lambda item: item["score"], reverse=True)[:5]

        summary_blocks = [
            {
                "title": "今天有什么值得看？",
                "content": (
                    f"{date} 共收录 {len(target)} 篇关注论文。"
                    f"热点主要分布在 {top_categories or '多个方向'}，"
                    f"其中高优先级 {hot_count} 篇，建议先看带火焰标记的条目。"
                ),
            },
            {
                "title": "推荐阅读顺序",
                "content": "先读高分新作确认方法范式，再沿 related work 回溯两层，最后写可复现实验 TODO。",
            },
        ]

        highlight_cards = [
            {
                "arxiv_id": paper["arxiv_id"],
                "title": paper["title"],
                "score": paper["score"],
                "reason": paper.get("analysis", {}).get("research_route", "值得关注"),
            }
            for paper in top_papers
        ]

        return {
            "date": date,
            "hot_count": hot_count,
            "focus_count": focus_count,
            "read_later_count": read_later_count,
            "topic_tags": top_tags,
            "summary_blocks": summary_blocks,
            "highlight_cards": highlight_cards,
        }

    def status(self) -> dict[str, Any]:
        with self._connect() as conn:
            total_papers = conn.execute("SELECT COUNT(*) AS count FROM papers").fetchone()["count"]
            llm_count = conn.execute("SELECT COUNT(*) AS count FROM papers WHERE llm_analysis_json IS NOT NULL").fetchone()["count"]
            total_notes = conn.execute("SELECT COUNT(*) AS count FROM notes").fetchone()["count"]
            total_ideas = conn.execute("SELECT COUNT(*) AS count FROM ideas").fetchone()["count"]

        return {
            "total_papers": int(total_papers),
            "llm_analyzed_papers": int(llm_count),
            "total_notes": int(total_notes),
            "total_ideas": int(total_ideas),
            "last_refresh": self._get_meta("last_refresh"),
            "llm_enabled": self.llm.enabled,
            "llm_model": self.llm.model,
            "interest_profile": self.interest_profile,
        }


class PollingWorker(threading.Thread):
    def __init__(self, store: ArxivDigestStore, interval_minutes: int, auto_llm_top_k: int):
        super().__init__(daemon=True)
        self.store = store
        self.interval_seconds = max(60, interval_minutes * 60)
        self.auto_llm_top_k = max(0, auto_llm_top_k)
        self._stop_event = threading.Event()

    def stop(self) -> None:
        self._stop_event.set()

    def run(self) -> None:
        while not self._stop_event.is_set():
            try:
                self.store.refresh(auto_llm_top_k=self.auto_llm_top_k)
            except Exception:
                traceback.print_exc()
            self._stop_event.wait(self.interval_seconds)


class DigestHandler(BaseHTTPRequestHandler):
    server: "DigestHTTPServer"

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
        self.end_headers()
        self.wfile.write(encoded)

    def _send_error(self, status: int, message: str) -> None:
        self._send_json(status, {"ok": False, "error": message})

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        try:
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}

    def _normalize_api_path(self, path: str) -> str:
        if path.startswith("/arxiv-digest/api/"):
            return "/api/" + path[len("/arxiv-digest/api/") :]
        return path

    def _is_api_request(self, path: str) -> bool:
        return path.startswith("/api/") or path.startswith("/arxiv-digest/api/")

    def _serve_static(self, raw_path: str, send_body: bool = True) -> None:
        static_root = self.server.static_root.resolve()

        if raw_path in {"/", ""}:
            rel = "index.html"
        elif raw_path in {"/arxiv-digest", "/arxiv-digest/"}:
            rel = "index.html"
        else:
            rel = raw_path.lstrip("/")
            if rel.startswith("arxiv-digest/"):
                rel = rel[len("arxiv-digest/") :]
            if not rel:
                rel = "index.html"

        target = (static_root / rel).resolve()
        if not target.exists() or not target.is_file() or static_root not in target.parents and target != static_root / "index.html":
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return

        mime = "text/plain; charset=utf-8"
        if target.suffix == ".html":
            mime = "text/html; charset=utf-8"
        elif target.suffix == ".css":
            mime = "text/css; charset=utf-8"
        elif target.suffix == ".js":
            mime = "application/javascript; charset=utf-8"
        elif target.suffix == ".json":
            mime = "application/json; charset=utf-8"
        elif target.suffix == ".svg":
            mime = "image/svg+xml"
        elif target.suffix in {".png", ".jpg", ".jpeg", ".webp"}:
            mime = f"image/{target.suffix.lstrip('.')}"

        payload = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if send_body:
            self.wfile.write(payload)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
        self.end_headers()

    def do_HEAD(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if self._is_api_request(parsed.path):
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
            self.end_headers()
            return
        self._serve_static(parsed.path, send_body=False)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if not self._is_api_request(parsed.path):
            self._serve_static(parsed.path)
            return

        api_path = self._normalize_api_path(parsed.path)
        query = urllib.parse.parse_qs(parsed.query)
        store = self.server.store

        if api_path == "/api/bootstrap":
            limit = parse_int(query.get("limit", ["80"])[0], 80, low=5, high=200)
            date = (query.get("date", [""])[0] or "").strip()
            category = (query.get("category", ["all"])[0] or "all").strip()
            search = (query.get("search", [""])[0] or "").strip()

            papers = store.list_papers(limit=limit, category=category, search=search, date=date)
            digest = store.digest(date=date)
            ideas = store.list_ideas(limit=40)
            self._send_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "mode": "live",
                    "generated_at": utc_now_iso(),
                    "llm_enabled": store.llm.enabled,
                    "llm_model": store.llm.model,
                    "papers": papers,
                    "digest": digest,
                    "ideas": ideas,
                    "selected_id": papers[0]["arxiv_id"] if papers else None,
                },
            )
            return

        if api_path == "/api/papers":
            limit = parse_int(query.get("limit", ["80"])[0], 80, low=5, high=300)
            category = (query.get("category", ["all"])[0] or "all").strip()
            search = (query.get("search", [""])[0] or "").strip()
            date = (query.get("date", [""])[0] or "").strip()
            papers = store.list_papers(limit=limit, category=category, search=search, date=date)
            self._send_json(HTTPStatus.OK, {"ok": True, "papers": papers})
            return

        if api_path.startswith("/api/papers/"):
            tail = api_path[len("/api/papers/") :].strip("/")
            if not tail:
                self._send_error(HTTPStatus.BAD_REQUEST, "Missing paper id")
                return
            paper = store.get_paper(tail)
            if not paper:
                self._send_error(HTTPStatus.NOT_FOUND, f"Paper not found: {tail}")
                return
            notes = store.get_notes(tail)
            self._send_json(HTTPStatus.OK, {"ok": True, "paper": paper, "notes": notes})
            return

        if api_path == "/api/ideas":
            self._send_json(HTTPStatus.OK, {"ok": True, "ideas": store.list_ideas(limit=80)})
            return

        if api_path.startswith("/api/notes/"):
            arxiv_id = api_path[len("/api/notes/") :].strip("/")
            if not arxiv_id:
                self._send_error(HTTPStatus.BAD_REQUEST, "Missing paper id")
                return
            self._send_json(HTTPStatus.OK, {"ok": True, "notes": store.get_notes(arxiv_id)})
            return

        if api_path == "/api/digest":
            date = (query.get("date", [""])[0] or "").strip()
            self._send_json(HTTPStatus.OK, {"ok": True, "digest": store.digest(date=date)})
            return

        if api_path == "/api/status":
            self._send_json(HTTPStatus.OK, {"ok": True, "status": store.status()})
            return

        self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def do_POST(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if not self._is_api_request(parsed.path):
            self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
            return

        api_path = self._normalize_api_path(parsed.path)
        body = self._read_json_body()
        store = self.server.store

        if api_path == "/api/refresh":
            categories_raw = body.get("categories")
            if isinstance(categories_raw, str):
                categories = [part.strip() for part in categories_raw.split(",") if part.strip()]
            elif isinstance(categories_raw, list):
                categories = [str(part).strip() for part in categories_raw if str(part).strip()]
            else:
                categories = None

            max_results = parse_int(str(body.get("max_results", "") or ""), store.max_results, low=10, high=300)
            auto_llm_top_k = parse_int(str(body.get("auto_llm_top_k", "3") or "3"), 3, low=0, high=20)

            try:
                result = store.refresh(categories=categories, max_results=max_results, auto_llm_top_k=auto_llm_top_k)
                self._send_json(HTTPStatus.OK, result)
            except Exception as exc:
                self._send_error(HTTPStatus.BAD_GATEWAY, f"Refresh failed: {exc}")
            return

        if api_path.startswith("/api/papers/") and api_path.endswith("/analyze"):
            arxiv_id = api_path[len("/api/papers/") : -len("/analyze")].strip("/")
            if not arxiv_id:
                self._send_error(HTTPStatus.BAD_REQUEST, "Missing paper id")
                return

            force = bool(body.get("force", False))
            ok = store.analyze_with_llm(arxiv_id, force=force)
            if not ok:
                self._send_error(
                    HTTPStatus.BAD_GATEWAY,
                    "LLM analysis failed. Check DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL / DEEPSEEK_MODEL.",
                )
                return
            paper = store.get_paper(arxiv_id)
            self._send_json(HTTPStatus.OK, {"ok": True, "paper": paper})
            return

        if api_path == "/api/ideas":
            content = compact_text(str(body.get("content", "")))
            if not content:
                self._send_error(HTTPStatus.BAD_REQUEST, "content is required")
                return
            idea = store.add_idea(content)
            self._send_json(HTTPStatus.CREATED, {"ok": True, "idea": idea})
            return

        self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def do_PUT(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if not self._is_api_request(parsed.path):
            self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
            return

        api_path = self._normalize_api_path(parsed.path)
        if not api_path.startswith("/api/notes/"):
            self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
            return

        arxiv_id = api_path[len("/api/notes/") :].strip("/")
        if not arxiv_id:
            self._send_error(HTTPStatus.BAD_REQUEST, "Missing paper id")
            return

        body = self._read_json_body()
        notes = self.server.store.save_notes(
            arxiv_id=arxiv_id,
            references_text=str(body.get("references_text", "")),
            ideas_text=str(body.get("ideas_text", "")),
            questions_text=str(body.get("questions_text", "")),
        )
        self._send_json(HTTPStatus.OK, {"ok": True, "notes": notes})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        # Keep stdout clean but still provide request visibility.
        print(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}")


class DigestHTTPServer(ThreadingHTTPServer):
    def __init__(self, server_address: tuple[str, int], handler_cls, store: ArxivDigestStore, static_root: Path):
        super().__init__(server_address, handler_cls)
        self.store = store
        self.static_root = static_root


def parse_categories(raw: str) -> list[str]:
    values = [item.strip() for item in raw.split(",") if item.strip()]
    return values or DEFAULT_CATEGORIES


def main() -> None:
    parser = argparse.ArgumentParser(description="Local arXiv digest workstation server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8502)
    parser.add_argument("--categories", default=",".join(DEFAULT_CATEGORIES))
    parser.add_argument("--max-results", type=int, default=120)
    parser.add_argument("--poll-minutes", type=int, default=30)
    parser.add_argument("--auto-bootstrap", action="store_true", default=True)
    parser.add_argument("--no-auto-bootstrap", action="store_false", dest="auto_bootstrap")
    parser.add_argument("--auto-llm-top-k", type=int, default=3)

    args = parser.parse_args()
    categories = parse_categories(args.categories)

    store = ArxivDigestStore(DB_PATH, categories=categories, max_results=max(10, args.max_results))

    if args.auto_bootstrap:
        try:
            result = store.refresh(auto_llm_top_k=max(0, args.auto_llm_top_k))
            print("[bootstrap]", result)
        except Exception as exc:
            print(f"[bootstrap] refresh failed: {exc}")

    polling_worker: PollingWorker | None = None
    if args.poll_minutes > 0:
        polling_worker = PollingWorker(store, interval_minutes=args.poll_minutes, auto_llm_top_k=max(0, args.auto_llm_top_k))
        polling_worker.start()
        print(f"[polling] every {args.poll_minutes} minutes")

    httpd = DigestHTTPServer((args.host, args.port), DigestHandler, store=store, static_root=ROOT_DIR)
    llm_state = "enabled" if store.llm.enabled else "disabled"
    print(f"Serving arxiv-digest on http://{args.host}:{args.port} (LLM: {llm_state}, model: {store.llm.model})")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        if polling_worker:
            polling_worker.stop()
        httpd.server_close()


if __name__ == "__main__":
    main()
