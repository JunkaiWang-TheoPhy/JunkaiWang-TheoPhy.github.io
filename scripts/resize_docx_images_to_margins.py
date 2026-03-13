#!/usr/bin/env python3
"""Resize DOCX images to fit inside page margins (inline, anchored, and VML)."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

try:
    from docx import Document
except ImportError as exc:  # pragma: no cover - dependency guard
    print(
        "Missing dependency: python-docx\n"
        "Install with: python3 -m pip install python-docx",
        file=sys.stderr,
    )
    raise SystemExit(1) from exc


EMU_PER_PT = 12700

NS = {
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "v": "urn:schemas-microsoft-com:vml",
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}

STYLE_SIZE_RE = re.compile(
    r"(?P<key>width|height)\s*:\s*(?P<value>-?\d+(?:\.\d+)?)\s*(?P<unit>pt|px|cm|mm|in)\b",
    flags=re.IGNORECASE,
)


@dataclass
class FileStats:
    path: Path
    found_objects: int
    resized_objects: int


def default_source_dir() -> Path:
    candidates = [
        Path.home() / "Downloads" / "0303",
        Path.home() / "downloads" / "0303",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def to_abs_path(path_value: str | Path) -> Path:
    return Path(path_value).expanduser().resolve()


def iter_docx_files(source_root: Path, output_root: Path, include_root: bool) -> Iterable[Path]:
    for candidate in source_root.rglob("*"):
        if not candidate.is_file():
            continue
        if candidate.suffix.lower() != ".docx":
            continue
        if candidate.name.startswith("~$") or candidate.name.startswith(".~"):
            continue
        if output_root in candidate.parents:
            continue
        if not include_root and candidate.parent == source_root:
            continue
        yield candidate


def to_emu(value_in_pt: float) -> int:
    return int(round(value_in_pt * EMU_PER_PT))


def from_emu(value_in_emu: int) -> float:
    return value_in_emu / EMU_PER_PT


def content_box_limits_emu(document: Document, padding_emu: int) -> tuple[int, int]:
    widths: list[int] = []
    heights: list[int] = []

    for section in document.sections:
        usable_width = (
            int(section.page_width)
            - int(section.left_margin)
            - int(section.right_margin)
            - (2 * padding_emu)
        )
        usable_height = (
            int(section.page_height)
            - int(section.top_margin)
            - int(section.bottom_margin)
            - (2 * padding_emu)
        )
        if usable_width > 0 and usable_height > 0:
            widths.append(usable_width)
            heights.append(usable_height)

    if not widths or not heights:
        raise ValueError("Could not determine usable content box from section settings.")

    return min(widths), min(heights)


def parse_size_to_pt(raw_value: str, unit: str) -> float | None:
    value = float(raw_value)
    unit_lower = unit.lower()
    if unit_lower == "pt":
        return value
    if unit_lower == "px":
        # Word VML px usually maps to CSS pixels. Assume 96 DPI.
        return value * 72.0 / 96.0
    if unit_lower == "in":
        return value * 72.0
    if unit_lower == "cm":
        return value * 72.0 / 2.54
    if unit_lower == "mm":
        return value * 72.0 / 25.4
    return None


def replace_style_size(style_text: str, key: str, pt_value: float) -> str:
    def repl(match: re.Match[str]) -> str:
        if match.group("key").lower() != key:
            return match.group(0)
        return f"{match.group('key')}:{pt_value:.2f}pt"

    return STYLE_SIZE_RE.sub(repl, style_text)


def resize_wp_container(container, max_width_emu: int, max_height_emu: int) -> bool:
    extents = container.xpath(
        './*[local-name()="extent" and namespace-uri()="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"]'
    )
    if not extents:
        return False
    extent = extents[0]

    cx_raw = extent.get("cx")
    cy_raw = extent.get("cy")
    if not cx_raw or not cy_raw:
        return False

    try:
        cx = int(cx_raw)
        cy = int(cy_raw)
    except ValueError:
        return False

    if cx <= 0 or cy <= 0:
        return False

    scale = min(1.0, max_width_emu / cx, max_height_emu / cy)
    if scale >= 1.0:
        return False

    new_cx = int(cx * scale)
    new_cy = int(cy * scale)
    extent.set("cx", str(new_cx))
    extent.set("cy", str(new_cy))

    for ext in container.xpath(
        './/*[local-name()="ext" and namespace-uri()="http://schemas.openxmlformats.org/drawingml/2006/main" and @cx and @cy]'
    ):
        ext.set("cx", str(new_cx))
        ext.set("cy", str(new_cy))
    return True


def resize_vml_shape(shape, max_width_emu: int, max_height_emu: int) -> bool:
    style = shape.get("style")
    if not style:
        return False

    parsed: dict[str, tuple[float, str]] = {}
    for match in STYLE_SIZE_RE.finditer(style):
        key = match.group("key").lower()
        pt_value = parse_size_to_pt(match.group("value"), match.group("unit"))
        if pt_value is not None:
            parsed[key] = (pt_value, match.group("unit"))

    if "width" not in parsed or "height" not in parsed:
        return False

    width_pt = parsed["width"][0]
    height_pt = parsed["height"][0]
    width_emu = to_emu(width_pt)
    height_emu = to_emu(height_pt)

    if width_emu <= 0 or height_emu <= 0:
        return False

    scale = min(1.0, max_width_emu / width_emu, max_height_emu / height_emu)
    if scale >= 1.0:
        return False

    new_width_pt = from_emu(int(width_emu * scale))
    new_height_pt = from_emu(int(height_emu * scale))
    style = replace_style_size(style, "width", new_width_pt)
    style = replace_style_size(style, "height", new_height_pt)
    shape.set("style", style)
    return True


def iter_xml_parts(document: Document):
    for part in document.part.package.parts:
        element = getattr(part, "element", None)
        if element is None:
            continue
        yield element


def resize_graphics_in_document(
    document: Document,
    max_width_emu: int,
    max_height_emu: int,
) -> tuple[int, int]:
    found = 0
    resized = 0

    for root in iter_xml_parts(document):
        wp_objects = root.xpath(
            './/*[local-name()="inline" and namespace-uri()="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"]'
            ' | '
            './/*[local-name()="anchor" and namespace-uri()="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"]'
        )
        for obj in wp_objects:
            found += 1
            if resize_wp_container(obj, max_width_emu, max_height_emu):
                resized += 1

        # Only VML shapes with image payload should be treated as images.
        vml_shapes = root.xpath(
            './/*[local-name()="shape" and namespace-uri()="urn:schemas-microsoft-com:vml"]'
            '[.//*[local-name()="imagedata" and namespace-uri()="urn:schemas-microsoft-com:vml"]]'
        )
        for shape in vml_shapes:
            found += 1
            if resize_vml_shape(shape, max_width_emu, max_height_emu):
                resized += 1

    return found, resized


def process_file(
    input_path: Path,
    source_root: Path,
    output_root: Path,
    padding_emu: int,
) -> FileStats:
    document = Document(str(input_path))
    max_width_emu, max_height_emu = content_box_limits_emu(document, padding_emu)
    found_objects, resized_objects = resize_graphics_in_document(
        document,
        max_width_emu=max_width_emu,
        max_height_emu=max_height_emu,
    )

    relative_path = input_path.relative_to(source_root)
    output_path = output_root / relative_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    document.save(str(output_path))

    return FileStats(
        path=relative_path,
        found_objects=found_objects,
        resized_objects=resized_objects,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Resize images in DOCX files so they fit within page margins, "
            "then save under an output folder with mirrored subfolder structure."
        )
    )
    parser.add_argument(
        "-s",
        "--source",
        default=str(default_source_dir()),
        help="Source root folder. Default: ~/Downloads/0303 (or ~/downloads/0303 if present).",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output root folder. Default: <source>/0303new",
    )
    parser.add_argument(
        "--include-root",
        action="store_true",
        help="Also process DOCX files directly under source root.",
    )
    parser.add_argument(
        "--padding-pt",
        type=float,
        default=0.0,
        help="Optional extra inner padding from margins in points (default: 0).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    source_root = to_abs_path(args.source)
    output_root = to_abs_path(args.output) if args.output else source_root / "0303new"
    padding_emu = to_emu(args.padding_pt)

    if args.padding_pt < 0:
        print("Error: --padding-pt must be >= 0.", file=sys.stderr)
        return 1
    if not source_root.exists() or not source_root.is_dir():
        print(f"Error: source folder does not exist or is not a directory: {source_root}", file=sys.stderr)
        return 1
    if output_root == source_root:
        print("Error: output folder must be different from source folder.", file=sys.stderr)
        return 1
    if output_root.exists() and not output_root.is_dir():
        print(f"Error: output path exists and is not a directory: {output_root}", file=sys.stderr)
        return 1

    files = sorted(iter_docx_files(source_root, output_root, args.include_root))
    if not files:
        print("No DOCX files found with current search settings.")
        return 0

    processed = 0
    found_total = 0
    resized_total = 0
    failed = 0

    for docx_file in files:
        try:
            stats = process_file(docx_file, source_root, output_root, padding_emu)
        except Exception as exc:  # pragma: no cover - runtime safety
            failed += 1
            print(f"[FAILED] {docx_file}: {exc}", file=sys.stderr)
            continue

        processed += 1
        found_total += stats.found_objects
        resized_total += stats.resized_objects
        print(
            f"[OK] {stats.path} | found: {stats.found_objects}, resized: {stats.resized_objects}"
        )

    print(
        f"\nDone. Processed {processed}/{len(files)} files, failed: {failed}. "
        f"Image objects found: {found_total}, resized: {resized_total}."
    )
    print(
        "Handled object types: wp:inline, wp:anchor, and VML image shapes. "
        "Output folder preserves source subfolder structure."
    )
    print(f"Output root: {output_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
