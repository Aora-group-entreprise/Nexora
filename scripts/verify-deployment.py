#!/usr/bin/env python3
"""Validate Cloudflare Pages deployment files without third-party dependencies."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
headers_path = ROOT / "_headers"
guide_path = ROOT / "docs" / "DEPLOYMENT.md"
html_path = ROOT / "index.html"

if not headers_path.is_file():
    errors.append("Cloudflare Pages _headers file is missing")
else:
    headers = headers_path.read_text(encoding="utf-8")
    if not headers.startswith("/*\n"):
        errors.append("_headers must define the global /* rule")
    for expected in (
        "X-Frame-Options: DENY",
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
        "Permissions-Policy: camera=(), microphone=(), geolocation=()",
    ):
        if expected not in headers:
            errors.append("required response header missing: " + expected)

if not guide_path.is_file():
    errors.append("Cloudflare Pages deployment guide is missing")
else:
    guide = guide_path.read_text(encoding="utf-8")
    for expected in (
        "Aora-group-entreprise/Nexora",
        "`main`",
        "`exit 0`",
        "`.`",
        "index.html",
        "tests Playwright",
    ):
        if expected not in guide:
            errors.append("deployment guide is missing configuration/detail: " + expected)

if not html_path.is_file():
    errors.append("top-level index.html is missing")

if errors:
    for error in errors:
        print("FAIL: " + error)
    sys.exit(1)

print("PASS: Cloudflare Pages headers and deployment guide are present and configured")
print("PASS: root index.html exists for the published static site")
