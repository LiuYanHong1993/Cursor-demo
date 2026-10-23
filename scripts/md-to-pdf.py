#!/usr/bin/env python3
"""Convert Chinese Markdown manuals to PDF via WeasyPrint."""
from __future__ import annotations

import re
import sys
from pathlib import Path

import markdown
from weasyprint import HTML

CSS = """
@page { size: A4; margin: 18mm 16mm; }
body {
  font-family: "WenQuanYi Micro Hei", "Noto Sans CJK SC", "Droid Sans Fallback", sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  color: #1a1a1a;
}
h1 { font-size: 20pt; margin: 0 0 12pt; border-bottom: 2px solid #0b3d4a; padding-bottom: 6pt; }
h2 { font-size: 14pt; margin: 18pt 0 8pt; color: #0b3d4a; }
h3 { font-size: 12pt; margin: 14pt 0 6pt; }
p, li { margin: 4pt 0; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; font-size: 9.5pt; }
th, td { border: 1px solid #ccc; padding: 4pt 6pt; vertical-align: top; }
th { background: #eef5f6; }
code, pre { font-family: "WenQuanYi Micro Hei Mono", "DejaVu Sans Mono", monospace; font-size: 9pt; }
pre { background: #f6f8f8; padding: 8pt; border: 1px solid #e0e0e0; white-space: pre-wrap; }
blockquote { margin: 8pt 0; padding: 4pt 10pt; border-left: 3px solid #0b3d4a; color: #333; }
hr { border: none; border-top: 1px solid #ddd; margin: 16pt 0; }
"""


def md_to_pdf(src: Path, dest: Path) -> None:
    text = src.read_text(encoding="utf-8")
    # Forbidden audit terms check (source)
    for bad in ("demo", "Demo", "DEMO", "演示"):
        if bad in text:
            raise SystemExit(f"forbidden term {bad!r} in {src}")
    html_body = markdown.markdown(
        text,
        extensions=["tables", "fenced_code", "sane_lists"],
    )
    html = f"<!DOCTYPE html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{html_body}</body></html>"
    # Check rendered text roughly
    plain = re.sub(r"<[^>]+>", "", html_body)
    for bad in ("demo", "Demo", "DEMO", "演示"):
        if bad in plain:
            raise SystemExit(f"forbidden term {bad!r} in rendered {src}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    HTML(string=html, base_url=str(src.parent)).write_pdf(dest)
    print(f"wrote {dest} ({dest.stat().st_size} bytes)")


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: md-to-pdf.py <in.md> <out.pdf> [<in.md> <out.pdf> ...]")
        sys.exit(2)
    args = sys.argv[1:]
    if len(args) % 2 != 0:
        sys.exit("pairs of input.md output.pdf required")
    for i in range(0, len(args), 2):
        md_to_pdf(Path(args[i]), Path(args[i + 1]))


if __name__ == "__main__":
    main()
