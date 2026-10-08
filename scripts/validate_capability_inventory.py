#!/usr/bin/env python3
"""Validate the public metadata snapshot; does not execute advertised tools."""

import argparse
from collections import Counter
from datetime import date
from pathlib import Path

from validate_catalog import load, require, unique


def validate(root):
    document = load(root / "catalog/capability-inventory.json")
    require(document["schemaVersion"] == "1.0.0", "Inventory schema")
    require(document["recordKind"] == "session-capability-inventory", "Inventory kind")
    date.fromisoformat(document["capturedOn"])
    scope = document["scope"]
    require(scope["skillBodiesIncluded"] is False, "Skill bodies must be excluded")
    require(scope["toolInstructionBodiesIncluded"] is False, "Tool bodies must be excluded")
    require(scope["runtimeRule"] and scope["completeness"], "Inventory evidence limits")

    skills = document["skills"]
    unique([s["name"] for s in skills], "inventory skill name")
    surfaces = Counter()
    for skill in skills:
        require(set(skill) == {"name", "surfaces"}, "Public skill metadata fields")
        require(isinstance(skill["name"], str) and skill["name"].strip(), "Skill name")
        unique(skill["surfaces"], "skill surface")
        require(skill["surfaces"] and set(skill["surfaces"]) <= {"cloud", "executor"},
                "Unknown skill surface")
        surfaces.update(skill["surfaces"])

    tools = document["tools"]
    unique([t["name"] for t in tools], "inventory tool name")
    providers = Counter()
    for tool in tools:
        require(set(tool) == {"name", "provider"}, "Public tool metadata fields")
        require(all(isinstance(tool[k], str) and tool[k].strip() for k in tool),
                "Tool metadata text")
        providers[tool["provider"]] += 1
    declared = document["toolProviders"]
    unique([p["name"] for p in declared], "tool provider")
    require({p["name"]: p["count"] for p in declared} == dict(providers),
            "Provider count drift")

    controls = document["orchestrationControls"]
    unique(controls, "orchestration control")
    require(all(isinstance(c, str) and c.strip() for c in controls), "Control name")
    require(not set(controls) & {t["name"] for t in tools}, "Control double count")
    expected = {
        "uniqueSkills": len(skills),
        "skillSurfaceEntries": sum(surfaces.values()),
        "cloudSkillEntries": surfaces["cloud"],
        "executorSkillEntries": surfaces["executor"],
        "advertisedTools": len(tools),
        "toolProviders": len(providers),
        "orchestrationControls": len(controls),
    }
    require(document["counts"] == expected, "Inventory total drift")
    for constraint in document["executionConstraints"]:
        require(constraint["provider"] in providers, "Unknown constrained provider")
        require(constraint["state"] and constraint["reason"], "Constraint evidence")
    require(document["productBoundary"], "Missing product/dependency boundary")
    print(f"PASS: {len(skills)} skills; {len(tools)} tools; {len(controls)} controls")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    try:
        validate(parser.parse_args().root.resolve())
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(1, f"FAIL: {error}\n")
