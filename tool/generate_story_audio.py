#!/usr/bin/env python3
"""Generate a reviewable Russian story MP3 with licensed Azure Speech.

No secrets are committed. Requires an Azure Speech resource and credentials in
AZURE_SPEECH_KEY and AZURE_SPEECH_REGION. This produces an unpublished LOCAL
recording; listen to it and check prophet names before committing the MP3.
"""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent.parent
ALLOWED_VOICES = ("ru-RU-DmitryNeural", "ru-RU-Lev:MAI-Voice-2")
SELECTORS = {"narrative": {"h3", "p"}, "lesson": {"h3", "li"}}


class StoryText(HTMLParser):
    def __init__(self, story_id):
        super().__init__(convert_charrefs=True)
        self.target = story_id
        self.stack = []
        self.in_story = False
        self.capturing = None
        self.fragments = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = set(attributes.get("class", "").split())
        if tag == "article" and attributes.get("id") == self.target:
            self.in_story = True
        active_sections = set().union(*(item[1] for item in self.stack)) if self.stack else set()
        self.stack.append((tag, classes))
        if not self.in_story:
            return
        should_capture = (tag == "h2" or any(
            section in active_sections and tag in tags
            for section, tags in SELECTORS.items()
        ))
        if should_capture:
            if self.capturing is not None:
                raise ValueError("Unexpected nested story paragraph")
            self.capturing = [tag, []]

    def handle_data(self, data):
        if self.capturing:
            self.capturing[1].append(data)

    def handle_endtag(self, tag):
        if self.capturing is not None and tag == self.capturing[0]:
            raw = " ".join(self.capturing[1])
            plain = re.sub(r"[\\u0600-\\u08FF]+", " ", html.unescape(raw))
            plain = re.sub(r"\\s+", " ", plain).strip()
            if plain:
                self.fragments.append(plain)
            self.capturing = None
        while self.stack:
            name, _ = self.stack.pop()
            if name == tag:
                break
        if tag == "article" and self.in_story:
            self.in_story = False


def read_story(slug):
    story_id = "story-" + slug
    raw = (ROOT / "stories.html").read_text(encoding="utf-8")
    parser = StoryText(story_id)
    parser.feed(raw)
    parts = parser.fragments
    if not 5 <= len(parts) <= 80 or not parts[0].strip():
        raise RuntimeError(f"Story {story_id} missing or failed text extraction")
    if any("Источники:" in part or "Подумай и обсуди" in part for part in parts):
        raise RuntimeError("Unwanted metadata found in narration")
    return parts, hashlib.sha256(raw.encode("utf-8")).hexdigest()


def make_ssml(parts, voice):
    import xml.sax.saxutils as xml_utils
    inner = "".join(
        '<prosody rate="-9%" pitch="-2st">' + xml_utils.escape(part) + '</prosody>'
        + ('<break time="650ms"/>' if i + 1 < len(parts) else "")
        for i, part in enumerate(parts)
    )
    ssml = ('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
            'xml:lang="ru-RU"><voice name="' + voice + '">' + inner
            + '</voice></speak>')
    ElementTree.fromstring(ssml)
    return ssml


def generate(slug, voice, overwrite=False):
    parts, source_hash = read_story(slug)
    ssml = make_ssml(parts, voice)
    key = os.environ.get("AZURE_SPEECH_KEY", "").strip()
    region = os.environ.get("AZURE_SPEECH_REGION", "").strip()
    if not key or not re.fullmatch(r"[a-z0-9-]+", region):
        raise RuntimeError("Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in your local environment; never commit or paste keys into GitHub.")
    path = ROOT / "audio" / "stories" / (slug + ".mp3")
    if path.exists() and not overwrite:
        raise RuntimeError(f"{path} exists. Use --overwrite only after reviewing the prior recording.")
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    request = urllib.request.Request(url, data=ssml.encode("utf-8"), method="POST", headers={
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "Talab-al-Haqq-Story-Narration/1.0",
    })
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            content_type = response.headers.get("Content-Type", "").lower()
            audio = response.read(12 * 1024 * 1024 + 1)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Azure Speech returned HTTP {exc.code}; check the voice, region, quota, and account permissions.") from exc
    if "audio/" not in content_type or not 2048 <= len(audio) <= 12 * 1024 * 1024:
        raise RuntimeError("Azure did not return a plausible MP3 audio response")
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".mp3.tmp")
    tmp.write_bytes(audio)
    tmp.replace(path)
    print(f"CREATED {path.relative_to(ROOT)} ({len(audio)} bytes)")
    print(f"TEXT_BLOCKS={len(parts)} SOURCE_STORIES_SHA256={source_hash}")
    print(f"MP3_SHA256={hashlib.sha256(audio).hexdigest()}")
    print("UNPUBLISHED: listen and verify exact names, pronunciation, voice, pacing and religious meaning before committing.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--story", default="yusuf", choices=["yusuf"])
    parser.add_argument("--voice", choices=ALLOWED_VOICES, default=ALLOWED_VOICES[0])
    parser.add_argument("--preview-text", action="store_true", help="Print exact narration source without using credentials or an API")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    if args.preview_text:
        parts, source_hash = read_story(args.story)
        print("SOURCE_STORIES_SHA256=" + source_hash)
        print("\\n\\n".join(parts))
        return 0
    generate(args.story, args.voice, overwrite=args.overwrite)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, OSError, ValueError) as exc:
        print("ERROR: " + str(exc), file=sys.stderr)
        sys.exit(1)
