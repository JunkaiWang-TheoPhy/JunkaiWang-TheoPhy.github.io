#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
grep -q '^  blog:' "$repo_dir/_config.yml"
grep -q '^  essay:' "$repo_dir/_config.yml"
test -f "$repo_dir/blog/index.html"
test -f "$repo_dir/essay/index.html"
test -f "$repo_dir/_blog/2026-08-30-first-note.md"
test -f "$repo_dir/_essay/2026-08-30-first-essay.md"
grep -q 'url: /blog/' "$repo_dir/_data/navigation.yml"
grep -q 'url: /essay/' "$repo_dir/_data/navigation.yml"
echo 'subsite structure ok'
