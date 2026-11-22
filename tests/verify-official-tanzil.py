#!/usr/bin/env python3
"""One-shot independent provenance attempt against the official Tanzil POST form.

This script does NOT edit or redistribute official Quran text. It records only
retrieval metadata, SHA-256 and the comparison of sixteen fixed verse IDs.
A failure to fetch is explicitly UNVERIFIED, not a mismatch in the Quran.
A pinned SHA-256 catches changes to the publisher response; independently
selected samples cover 16 and 54 verse IDs.
"""
import datetime
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

OFFICIAL_URL = "https://tanzil.net/pub/download/index.php"
FORM = {
    "quranType": "uthmani",
    "outType": "txt-2",
    "marks": "true",
    "sajdah": "true",
    "rub": "true",
    "tatweel": "true",
    "agree": "true",
}
FIXTURE = Path("tests/fixtures/tanzil-uthmani-1.1-remaining-duas.txt")
SECOND_FIXTURE = Path("tests/fixtures/tanzil-uthmani-1.1-quran-sample-54.json")
REPORT = Path("official-tanzil-provenance-attempt.json")
EXPECTED_RESPONSE_SHA256 = "bf4f57b968d03f4131c070b1e285da9be0e0a108a21c910e872801ca273312c8"
LINE = re.compile(r"^(\d+)\|(\d+)\|(.+)$")
IGNORABLE_FOR_CODEPOINT_DIAGNOSTIC = re.compile("[\u0640\u06d6\u06da\u06de]")


def verses_from(text):
    result = {}
    for raw_line in text.splitlines():
        match = LINE.fullmatch(raw_line.strip())
        if match:
            key = match.group(1) + ":" + match.group(2)
            if key in result:
                raise ValueError("Duplicate verse ID " + key)
            result[key] = match.group(3)
    return result


def limited_normalization(value):
    return " ".join(IGNORABLE_FOR_CODEPOINT_DIAGNOSTIC.sub("", value).split())


def run():
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    report = {
        "result": "UNVERIFIED",
        "attempt_utc": now,
        "publisher": "Tanzil Project",
        "endpoint": OFFICIAL_URL,
        "method": "POST",
        "options": FORM,
        "official_release_claim": "Uthmani 1.1 (publisher download page)",
        "external_mirror_repo": "acfatah/tanzil",
        "external_mirror_blob": "f2f03c415ea50f8493d2058ec67a90257333abe3",
        "notice": "A third-party mirror is NOT an authenticated official export.",
    }
    try:
        fixture_bytes = FIXTURE.read_bytes()
        fixture = verses_from(fixture_bytes.decode("utf-8-sig"))
        if len(fixture) != 16:
            raise ValueError("Expected exactly 16 pinned fixture verses")
        report["fixture_sha256"] = hashlib.sha256(fixture_bytes).hexdigest()
        payload = urllib.parse.urlencode(FORM).encode("ascii")
        req = urllib.request.Request(
            OFFICIAL_URL,
            data=payload,
            method="POST",
            headers={
                "User-Agent": "Talab-al-Haqq-source-audit/1.0 (+https://github.com/NaFaS-Bek/talab-al-haqq)",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "text/plain, application/octet-stream, */*",
                "Accept-Encoding": "identity",
                "Referer": "https://tanzil.net/download/",
            },
        )
        with urllib.request.urlopen(req, timeout=25) as response:
            effective_url = response.geturl()
            if urllib.parse.urlsplit(effective_url).hostname not in {"tanzil.net", "www.tanzil.net"}:
                raise ValueError("Unexpected redirect outside official Tanzil domain")
            raw = response.read(4_500_001)
            report["http_status"] = response.status
            report["effective_url"] = effective_url
            report["content_type"] = response.headers.get("Content-Type", "")
        if not (500_000 <= len(raw) <= 4_500_000):
            raise ValueError("Response size not plausible for complete Quran text")
        text = raw.decode("utf-8-sig")
        if "Tanzil Quran Text (Uthmani, Version 1.1)" not in text:
            raise ValueError("Missing expected publisher/version attribution in file")
        official = verses_from(text)
        if len(official) != 6236:
            raise ValueError("Official response has " + str(len(official)) + " verses, not 6236")
        report["official_response_sha256"] = hashlib.sha256(raw).hexdigest()
        report["official_response_bytes"] = len(raw)
        report["official_verse_count"] = len(official)
        report["matches_pinned_official_sha256"] = (
            report["official_response_sha256"] == EXPECTED_RESPONSE_SHA256)
        report["pinned_official_sha256"] = EXPECTED_RESPONSE_SHA256
        report["full_export_pause_mark_counts"] = {
            "U+06D6": sum(verse.count("\u06d6") for verse in official.values()),
            "U+06DA": sum(verse.count("\u06da") for verse in official.values()),
        }
        exact = []
        mark_option_only = []
        differing = []
        for key, mirror in fixture.items():
            fetched = official.get(key)
            if fetched is None:
                differing.append(key + " (missing)")
            elif fetched == mirror:
                exact.append(key)
            elif limited_normalization(fetched) == limited_normalization(mirror):
                mark_option_only.append(key)
            else:
                differing.append(key)
        report["exact_matches"] = len(exact)
        report["same_after_limited_mark_normalization"] = len(mark_option_only)
        report["unresolved_differences"] = differing
        report["matched_verse_ids"] = sorted(exact + mark_option_only,
                                           key=lambda s: tuple(map(int, s.split(":"))))
        second_source = json.loads(SECOND_FIXTURE.read_text(encoding="utf-8"))
        second_verses = second_source.get("verses", {})
        if len(second_verses) != 54:
            raise ValueError("Expected exactly 54 separate pinned sample verses")
        exact_54 = []
        mark_option_only_54 = []
        unresolved_54 = []
        for key, mirror in second_verses.items():
            fetched = official.get(key)
            if fetched is None:
                unresolved_54.append(key + " (missing)")
            elif fetched == mirror:
                exact_54.append(key)
            elif limited_normalization(fetched) == limited_normalization(mirror):
                mark_option_only_54.append(key)
            else:
                unresolved_54.append(key)
        report["sample54"] = {
            "sample_sha256": hashlib.sha256(SECOND_FIXTURE.read_bytes()).hexdigest(),
            "source_mirror": second_source.get("provenance", {}).get("mirror"),
            "exact_matches": len(exact_54),
            "same_after_limited_mark_normalization": len(mark_option_only_54),
            "unresolved_differences": sorted(unresolved_54),
        }
        report["result"] = (
            "OFFICIAL_SHA_CHANGED_REQUIRES_REVIEW"
            if not report["matches_pinned_official_sha256"]
            else "OFFICIAL_SOURCE_DIFFERENCES_REQUIRE_REVIEW"
            if (differing or unresolved_54)
            else "OFFICIAL_54_EXACT"
            if len(exact_54) == 54
            else "OFFICIAL_54_MARK_OPTION_DIFFERENCES_ONLY"
        )
        print("Official Tanzil download returned 6236 verses. SHA-256:", report["official_response_sha256"])
        print("16 pinned verses: exact", len(exact),
              "normalized mark-option only", len(mark_option_only),
              "requires review", len(differing))
        print("54 verse sample: exact", len(exact_54),
              "normalized mark-option only", len(mark_option_only_54),
              "requires review", len(unresolved_54))
        print("Official full-export pause sign counts:", report["full_export_pause_mark_counts"])
        print("Matches pinned official full response SHA-256:", report["matches_pinned_official_sha256"])
        return 0 if not (differing or unresolved_54) and report["matches_pinned_official_sha256"] else 3
    except (OSError, UnicodeError, ValueError, urllib.error.URLError) as exc:
        report["result"] = "UNVERIFIED_OFFICIAL_EXPORT_UNAVAILABLE"
        report["error_type"] = type(exc).__name__
        report["error_summary"] = str(exc)[:400]
        print("Official publisher retrieval NOT independently verified:", type(exc).__name__, str(exc)[:200])
        return 2
    finally:
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                          encoding="utf-8")
        print("Wrote provenance attempt to", REPORT)


if __name__ == "__main__":
    sys.exit(run())
