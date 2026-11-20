#!/usr/bin/env python3
"""Offline foundation checks; optional committed-tree check without a checkout."""
import argparse
import io
import json
import posixpath
import re
import subprocess
import tarfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PREFIX = ".agents/skills/secure-api-delivery/"
SKILL_FILES = ("SKILL.md", "agents/openai.yaml", "assets/icon.svg",
               "references/api-checks.md", "references/delivery-controls.md",
               "references/sources.md")
REQUIRED = ("AGENTS.md", ".agents/knowledge/README.md",
            "scripts/validate-agent-foundations.py") + tuple(PREFIX + p for p in SKILL_FILES)

def resolve_link(source, target):
    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = unquote(parsed.path)
    if path.startswith(("/", "~")):
        raise ValueError("nonportable link: " + target)
    result = posixpath.normpath(posixpath.join(posixpath.dirname(source), path))
    if result == ".." or result.startswith("../"):
        raise ValueError("escaping link: " + target)
    return result

def check(read, exists, is_link):
    errors = []
    for name in REQUIRED:
        if not exists(name):
            errors.append("missing: " + name)
        elif is_link(name):
            errors.append("symlink is not portable source: " + name)
    if errors:
        return errors
    docs = ["AGENTS.md", ".agents/knowledge/README.md"] + [
        PREFIX + p for p in SKILL_FILES if p.endswith(".md")]
    for name in docs:
        content = read(name)
        if name.startswith(".agents/") and re.search(r"(?:/home/|~/\.agents/|~/\.codex/)", content):
            errors.append("host dependency in " + name)
        for target in re.findall(r"\[[^\]]*\]\(([^\s)]+)\)", content):
            try:
                resolved = resolve_link(name, target)
                if resolved and not exists(resolved):
                    errors.append(name + ": unresolved " + target)
            except ValueError as error:
                errors.append(name + ": " + str(error))
    instructions = read("AGENTS.md")
    for target in [".agents/knowledge/README.md", PREFIX + "SKILL.md"]:
        if target not in instructions:
            errors.append("AGENTS.md lacks discovery: " + target)
    return errors

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--git-archive", metavar="REV", help="read committed Git archive in memory")
    args = parser.parse_args()
    if args.git_archive:
        raw = subprocess.check_output(["git", "-C", str(ROOT), "archive", "--format=tar", args.git_archive])
        with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
            members = {m.name.rstrip("/"): m for m in archive.getmembers()}
            def read(name):
                return archive.extractfile(members[name]).read().decode("utf-8")
            errors = check(read, members.__contains__,
                           lambda name: members[name].issym() or members[name].islnk())
    else:
        def contained(name):
            path = ROOT / name
            return path.exists() and path.resolve().is_relative_to(ROOT)
        errors = check(lambda name: (ROOT / name).read_text(), contained,
                       lambda name: (ROOT / name).is_symlink())
    print(json.dumps({"status": "failed" if errors else "passed",
                      "mode": "git-archive" if args.git_archive else "checkout",
                      "errors": errors}, indent=2))
    return bool(errors)

if __name__ == "__main__":
    raise SystemExit(main())
