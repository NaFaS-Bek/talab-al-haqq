#!/usr/bin/env python3
"""Deterministically prepare a complete, SHA-256-verified static offline release.

No external dependencies or network required. Source files are never rewritten,
except sw.js with the explicit --write-root flag. Cache hashes always refer to
the exact UTF-8/binary bytes deployed as static assets, not to Git blob SHAs.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / "sw.js"
SW_LINE = re.compile(rb"(?m)^const RELEASE = (?:null|\{[^\r\n]+\});(?=\r?$)")
REQUIRED = [
    "index.html", "app.js", "style.css", "pillars-common.css",
    "manifest.webmanifest", "icon.svg",
    "data/content.json", "data/caliph_history.json",
    "TANZIL-LICENSE.txt",
]
ASSET_DIRS = ("fonts", "icons")
MAX_ASSET_COUNT = 120


def resource_files():
    paths = list(REQUIRED)
    paths += [p.name for p in sorted(ROOT.glob("*.html")) if p.name != "index.html"]
    paths += [p.relative_to(ROOT).as_posix()
              for subdir in ASSET_DIRS
              for p in sorted((ROOT / subdir).rglob("*")) if p.is_file()]
    if len(paths) != len(set(paths)):
        raise RuntimeError("Duplicate packaged path")
    if not 22 <= len([p for p in paths if p.endswith(".html")]) <= 100:
        raise RuntimeError("HTML curriculum inventory unexpectedly changed")
    if len(paths) > MAX_ASSET_COUNT:
        raise RuntimeError("Too many assets: review packaging scope")
    for name in paths:
        f = ROOT / name
        if not f.is_file() or f.is_symlink() or ".." in Path(name).parts:
            raise RuntimeError(f"Missing or unsafe release file: {name}")
    return sorted(paths)


def make_release(paths):
    resources = {}
    for path in paths:
        data = (ROOT / path).read_bytes()
        if not data:
            raise RuntimeError(f"Empty asset must be reviewed: {path}")
        resources[path] = hashlib.sha256(data).hexdigest()
    canonical = json.dumps(resources, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    version = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return {"version": version, "resources": resources}


def prepared_sw(release):
    original = SW.read_bytes()
    if len(SW_LINE.findall(original)) != 1:
        raise RuntimeError("sw.js must contain exactly one single-line RELEASE declaration")
    serialized = json.dumps(release, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    replacement = ("const RELEASE = " + serialized + ";").encode("ascii")
    return SW_LINE.sub(lambda _: replacement, original, count=1)


def build_release(folder, paths, output_sw, release):
    resolved = folder.resolve()
    if resolved == ROOT or ROOT not in resolved.parents:
        raise RuntimeError("Build directory must be a subfolder of the repository")
    if resolved.exists():
        shutil.rmtree(resolved)
    resolved.mkdir(parents=True)
    for name in paths + ["_headers"]:
        source = ROOT / name
        if not source.is_file():
            raise RuntimeError(f"Missing deploy asset: {name}")
        destination = resolved / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
    (resolved / "sw.js").write_bytes(output_sw)
    for name, expected in release["resources"].items():
        actual = hashlib.sha256((resolved / name).read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError(f"Built release hash mismatch: {name}")
    assert not (resolved / "tool").exists(), "Never deploy source or audit tools"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--print-manifest", action="store_true")
    group.add_argument("--check-root", action="store_true")
    group.add_argument("--write-root", action="store_true")
    group.add_argument("--build", metavar="DIRECTORY", type=Path)
    args = parser.parse_args()
    paths = resource_files()
    release = make_release(paths)
    output_sw = prepared_sw(release)
    root_is_current = SW.read_bytes() == output_sw
    if args.print_manifest:
        print("PWA_RELEASE_MANIFEST=" + json.dumps(release, sort_keys=True, separators=(",", ":")))
        print(f"PWA_RELEASE_FILES={len(paths)}")
        print(f"PWA_RELEASE_VERSION={release['version']}")
    elif args.check_root:
        if not root_is_current:
            print("FAILED: sw.js has stale or null RELEASE. "
                  "Run python3 tool/prepare_website.py --write-root and commit sw.js.",
                  file=sys.stderr)
            return 1
        print(f"PASS: source sw.js matches {len(paths)} verified assets, version {release['version']}")
    elif args.write_root:
        SW.write_bytes(output_sw)
        print(f"Prepared sw.js with {len(paths)} SHA-256 resources, version {release['version']}")
    elif args.build:
        build_release(args.build, paths, output_sw, release)
        print(f"PASS: built {args.build} with {len(paths)} verified offline assets "
              f"and sw.js, version {release['version']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
