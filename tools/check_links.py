#!/usr/bin/env python3
"""Crawl internal HTML links and report broken pages and slash redirects."""

from __future__ import annotations

import argparse
import http.client
import posixpath
import sys
from collections import deque
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Deque, Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlsplit


DEFAULT_SEEDS = [
    "/",
    "/support/",
    "/privacy/",
    "/security/",
    "/docs/",
    "/docs/decision-register/",
    "/apps/decision-register/",
    "/apps/synapse/",
    "/faq/decision-register/",
    "/faq/synapse/",
]

REDIRECT_STATUSES = {301, 302, 303, 307, 308}
SKIP_SCHEMES = ("mailto:", "tel:", "javascript:", "data:")
STATIC_EXTENSIONS = {
    ".png",
    ".svg",
    ".css",
    ".js",
    ".ico",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".map",
}


def normalize_path(path: str) -> str:
    if not path:
        return "/"
    parsed = urlsplit(path)
    raw_path = parsed.path or "/"
    trailing_slash = raw_path.endswith("/")
    normalized = posixpath.normpath(raw_path)
    if not normalized.startswith("/"):
        normalized = f"/{normalized}"
    if trailing_slash and normalized != "/":
        normalized = f"{normalized}/"
    return normalized


def is_probably_static(path: str) -> bool:
    final_segment = path.rsplit("/", 1)[-1].lower()
    return any(final_segment.endswith(ext) for ext in STATIC_EXTENSIONS)


def is_path_like_folder(path: str) -> bool:
    if path == "/" or path.endswith("/"):
        return False
    segment = path.rsplit("/", 1)[-1]
    return "." not in segment


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: Set[str] = set()

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag.lower() not in {"a", "area"}:
            return
        for name, value in attrs:
            if name.lower() == "href" and value:
                self.hrefs.add(value.strip())


@dataclass
class QueueItem:
    path: str
    source_page: str
    href: str


@dataclass
class FetchResult:
    requested_path: str
    final_path: str
    final_status: int
    final_reason: str
    content_type: str
    body: str
    history: List[Tuple[str, int, Optional[str]]]


class HttpClient:
    def __init__(self, base_url: str, timeout: int) -> None:
        parsed = urlsplit(base_url)
        if parsed.scheme not in {"http", "https"}:
            raise ValueError(f"Unsupported base URL scheme: {parsed.scheme}")
        if not parsed.netloc:
            raise ValueError(f"Base URL must include host: {base_url}")

        self.scheme = parsed.scheme
        self.netloc = parsed.netloc
        self.timeout = timeout
        self.origin = f"{parsed.scheme}://{parsed.netloc}"
        self.hostname = parsed.hostname
        self.port = parsed.port or (443 if parsed.scheme == "https" else 80)
        if self.hostname is None:
            raise ValueError(f"Could not parse hostname from base URL: {base_url}")

    def request(self, path: str) -> Tuple[int, str, Dict[str, str], bytes]:
        conn_cls = http.client.HTTPSConnection if self.scheme == "https" else http.client.HTTPConnection
        conn = conn_cls(self.hostname, self.port, timeout=self.timeout)
        try:
            conn.request("GET", path, headers={"User-Agent": "SynapseWorks-LinkCheck/1.0"})
            resp = conn.getresponse()
            data = resp.read()
            headers = {k.lower(): v for k, v in resp.getheaders()}
            return resp.status, resp.reason, headers, data
        finally:
            conn.close()

    def fetch(self, requested_path: str, max_redirects: int) -> FetchResult:
        current_path = requested_path
        history: List[Tuple[str, int, Optional[str]]] = []

        for _ in range(max_redirects + 1):
            try:
                status, reason, headers, body = self.request(current_path)
            except Exception as exc:  # pragma: no cover - network errors are environment-dependent
                return FetchResult(
                    requested_path=requested_path,
                    final_path=current_path,
                    final_status=599,
                    final_reason=str(exc),
                    content_type="",
                    body="",
                    history=history,
                )

            location = headers.get("location")
            history.append((current_path, status, location))

            if status in REDIRECT_STATUSES and location:
                target = urlsplit(urljoin(f"{self.origin}{current_path}", location))
                if target.netloc and target.netloc != self.netloc:
                    return FetchResult(
                        requested_path=requested_path,
                        final_path=current_path,
                        final_status=status,
                        final_reason=reason,
                        content_type=headers.get("content-type", ""),
                        body="",
                        history=history,
                    )
                current_path = normalize_path(target.path or "/")
                continue

            content_type = headers.get("content-type", "")
            decoded = body.decode("utf-8", errors="ignore") if "text/html" in content_type.lower() else ""
            return FetchResult(
                requested_path=requested_path,
                final_path=current_path,
                final_status=status,
                final_reason=reason,
                content_type=content_type,
                body=decoded,
                history=history,
            )

        return FetchResult(
            requested_path=requested_path,
            final_path=current_path,
            final_status=599,
            final_reason=f"Too many redirects (>{max_redirects})",
            content_type="",
            body="",
            history=history,
        )


def extract_internal_targets(page_url: str, hrefs: Iterable[str], allowed_netloc: str) -> List[Tuple[str, str]]:
    targets: List[Tuple[str, str]] = []
    for href in hrefs:
        if not href:
            continue
        lowered = href.lower()
        if href.startswith("#") or lowered.startswith(SKIP_SCHEMES):
            continue
        resolved = urlsplit(urljoin(page_url, href))
        if resolved.netloc and resolved.netloc != allowed_netloc:
            continue
        normalized_path = normalize_path(resolved.path or "/")
        if is_probably_static(normalized_path):
            continue
        targets.append((normalized_path, href))
    return targets


def main() -> int:
    parser = argparse.ArgumentParser(description="Crawl internal links for static site checks.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Base URL to crawl.")
    parser.add_argument(
        "--seed",
        action="append",
        dest="seeds",
        help="Seed path to start crawl from. Can be passed multiple times.",
    )
    parser.add_argument("--timeout", type=int, default=10, help="HTTP timeout in seconds.")
    parser.add_argument("--max-redirects", type=int, default=5, help="Maximum redirects to follow.")
    parser.add_argument(
        "--fail-on-trailing-slash",
        action="store_true",
        help="Return a non-zero exit code when slash-redirect links are found.",
    )
    args = parser.parse_args()

    seeds = args.seeds if args.seeds else DEFAULT_SEEDS
    normalized_seeds = [normalize_path(seed) for seed in seeds]

    client = HttpClient(args.base_url, args.timeout)
    queue: Deque[QueueItem] = deque(
        QueueItem(path=seed, source_page="<seed>", href=seed) for seed in normalized_seeds
    )

    visited: Set[str] = set()
    crawled_pages: Set[str] = set()
    broken_by_path: Dict[str, Tuple[str, str, int, str]] = {}
    slash_issues_by_path: Dict[str, Tuple[str, str, str]] = {}
    processed_count = 0

    while queue:
        item = queue.popleft()
        if item.path in visited:
            continue
        visited.add(item.path)
        processed_count += 1

        result = client.fetch(item.path, args.max_redirects)

        for requested_path, status, location in result.history:
            if status in REDIRECT_STATUSES and location and is_path_like_folder(requested_path):
                target = urlsplit(urljoin(f"{client.origin}{requested_path}", location))
                if target.netloc and target.netloc != client.netloc:
                    continue
                target_path = normalize_path(target.path or "/")
                if target_path == f"{requested_path}/" and requested_path not in slash_issues_by_path:
                    slash_issues_by_path[requested_path] = (item.source_page, item.href, target_path)

        if result.final_status >= 400:
            broken_by_path[item.path] = (item.source_page, item.href, result.final_status, result.final_reason)
            continue

        if not result.body:
            continue

        if result.final_path in crawled_pages:
            continue
        crawled_pages.add(result.final_path)

        parser_obj = AnchorParser()
        parser_obj.feed(result.body)

        page_url = f"{client.origin}{result.final_path}"
        for target_path, href in extract_internal_targets(page_url, parser_obj.hrefs, client.netloc):
            if target_path not in visited:
                queue.append(QueueItem(path=target_path, source_page=result.final_path, href=href))

    broken = sorted((path, *details) for path, details in broken_by_path.items())
    slash_issues = sorted((path, *details) for path, details in slash_issues_by_path.items())

    print(f"Crawled {processed_count} internal page URLs from {len(normalized_seeds)} seeds.")

    if broken:
        print("\nBroken internal pages:")
        for path, source_page, href, status, reason in broken:
            print(f"  - {path} [{status} {reason}] (found in {source_page} via '{href}')")
    else:
        print("\nBroken internal pages: none")

    if slash_issues:
        print("\nMissing trailing slash links (redirect to folder routes):")
        for path, source_page, href, target_path in slash_issues:
            print(f"  - {path} -> {target_path} (found in {source_page} via '{href}')")
    else:
        print("\nMissing trailing slash links: none")

    if broken:
        return 1
    if args.fail_on_trailing_slash and slash_issues:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
