#!/usr/bin/env python3
"""Dependency-free smoke checks for the Nexora static application."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


class AppMarkupParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.local_assets = []
        self.view_targets = []
        self.page_names = []
        self.nav_controls = []
        self.has_main = False
        self.has_viewport = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "button" and "nav-item" in attrs.get("class", "").split():
            self.nav_controls.append(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "main":
            self.has_main = True
        if tag == "meta" and attrs.get("name", "").lower() == "viewport":
            self.has_viewport = True
        if tag in {"script", "link"}:
            candidate = attrs.get("src") if tag == "script" else attrs.get("href")
            if candidate and not candidate.startswith(("http://", "https://", "//", "#", "data:")):
                self.local_assets.append(candidate.split("#", 1)[0].split("?", 1)[0])
        if "data-view" in attrs:
            self.view_targets.append(attrs["data-view"])
        if "data-page" in attrs:
            self.page_names.append(attrs["data-page"])


def fail(message):
    print(f"FAIL: {message}")
    return False


def main():
    html_path = ROOT / "index.html"
    if not html_path.is_file():
        fail("index.html is missing")
        return 1

    parser = AppMarkupParser()
    parser.feed(html_path.read_text(encoding="utf-8"))
    parser.close()
    errors = []

    duplicates = [key for key, count in Counter(parser.ids).items() if count > 1]
    if duplicates:
        errors.append("duplicate HTML id(s): " + ", ".join(duplicates))

    if not parser.has_main:
        errors.append("missing main landmark")
    if not parser.has_viewport:
        errors.append("missing responsive viewport meta tag")
    if "sidebar-overlay" not in parser.ids:
        errors.append("missing mobile navigation overlay")
    if not parser.nav_controls or any(not item.get("aria-label") for item in parser.nav_controls):
        errors.append("every icon-capable navigation button must have an accessible aria-label")

    page_names = set(parser.page_names)
    if not page_names:
        errors.append("no data-page views were found")
    missing_views = sorted(set(parser.view_targets) - page_names)
    if missing_views:
        errors.append("data-view target(s) have no matching data-page: " + ", ".join(missing_views))

    for asset in parser.local_assets:
        asset_path = (ROOT / asset).resolve()
        if ROOT.resolve() not in asset_path.parents and asset_path != ROOT.resolve():
            errors.append(f"local asset escapes project directory: {asset}")
        elif not asset_path.is_file():
            errors.append(f"referenced local asset is missing: {asset}")

    app_js = ROOT / "app.js"
    styles_css = ROOT / "styles.css"
    if not app_js.is_file():
        errors.append("app.js is missing")
    if not styles_css.is_file():
        errors.append("styles.css is missing")
    else:
        css_text = styles_css.read_text(encoding="utf-8")
        if css_text.count("{") != css_text.count("}"):
            errors.append("styles.css has an unmatched brace count")
        if "@media (max-width: 760px)" not in css_text:
            errors.append("missing mobile layout breakpoint at 760px")
        if ".sidebar-overlay:not([hidden])" not in css_text:
            errors.append("mobile navigation overlay has no visible-state styling")

    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        return 1

    print("PASS: static app assets exist")
    print(f"PASS: {len(page_names)} views and {len(set(parser.view_targets))} navigation targets are connected")
    print(f"PASS: {len(parser.ids)} HTML ids are unique")
    print("PASS: responsive viewport and main landmark are present")
    print(f"PASS: {len(parser.nav_controls)} navigation buttons have accessible labels")
    print("PASS: mobile navigation overlay and 760px layout breakpoint are present")
    print("PASS: local asset paths and CSS brace counts are valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
