#!/usr/bin/env python3
"""Read-only catalogue integrity checks; Python standard library only."""

import argparse
import hashlib
import json
import re
from pathlib import Path


FIELDS = {
    "schemaVersion", "id", "slug", "name", "productType", "category", "summary",
    "problem", "coreOutcomes", "requirements", "boundaries", "tags", "source",
}
ARRAY_FIELDS = {"coreOutcomes", "requirements", "boundaries", "tags"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def unique(items, label):
    require(len(items) == len(set(items)), f"Duplicate {label}")


def load(path):
    def pairs(values):
        unique([key for key, _ in values], f"JSON key in {path}")
        return dict(values)
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=pairs)


def inside(root, relative):
    require(isinstance(relative, str), "Path must be a string")
    require(not Path(relative).is_absolute(), f"Absolute path: {relative}")
    path = (root / relative).resolve()
    require(path.is_relative_to(root.resolve()), f"Escaping path: {relative}")
    require(path.is_file(), f"Missing file: {relative}")
    return path


def blob_sha(path):
    data = path.read_bytes()
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()


def metadata(root, manifest):
    records, paths, slugs = [], [], []
    for entry in manifest["products"]:
        product_id = entry["id"]
        expected = f"products/{product_id}/product.json"
        require(entry["metadata"] == expected, f"Metadata path: {product_id}")
        path = inside(root, expected)
        record = load(path)
        require(set(record) == FIELDS, f"Metadata fields: {product_id}")
        require(record["schemaVersion"] == "1.0.0", f"Metadata schema: {product_id}")
        require(record["id"] == product_id, f"ID mismatch: {product_id}")
        for field in FIELDS - ARRAY_FIELDS:
            require(isinstance(record[field], str) and record[field].strip(),
                    f"Nonempty text required: {product_id}.{field}")
        for field in ARRAY_FIELDS:
            values = record[field]
            require(isinstance(values, list) and values and
                    all(isinstance(v, str) and v.strip() for v in values),
                    f"Nonempty text array required: {product_id}.{field}")
        for field in ("id", "slug"):
            require(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", record[field]),
                    f"Invalid {field}: {product_id}")
        source = {"prompt": "PROMPT.md", "skill": "SKILL.md"}.get(record["productType"])
        require(source and record["source"] == source, f"Source type: {product_id}")
        inside(path.parent, record["source"])
        records.append(record)
        paths.append(expected)
        slugs.append(record["slug"])
    unique(slugs, "slug")
    actual = {str((p / "product.json").relative_to(root))
              for p in (root / "products").iterdir() if p.is_dir()}
    require(set(paths) == actual, "Unindexed or missing product metadata")
    return records


def provenance(root, records):
    document = load(root / "catalog/sources.json")
    require(document["schemaVersion"] == "1.0.0", "Source schema")
    require(document["canonicalRepository"] == "AyobamiH/agent-shop-products", "Repository")
    entries = document["products"]
    unique([e["id"] for e in entries], "source ID")
    indexed = {entry["id"]: entry for entry in entries}
    require(set(indexed) == {r["id"] for r in records}, "Source coverage mismatch")
    for record in records:
        entry = indexed[record["id"]]
        expected = f"products/{record['id']}/{record['source']}"
        require(entry["canonical"]["path"] == expected, f"Source path: {record['id']}")
        require(entry["canonical"]["blobSha"] == blob_sha(inside(root, expected)),
                f"Canonical blob drift: {record['id']}")
        origin = entry["origin"]
        require(all(isinstance(origin[k], str) and origin[k]
                    for k in ("repository", "branch", "path", "blobSha")), "Origin fields")
        require(re.fullmatch(r"[0-9a-f]{40}", origin["blobSha"]), "Origin blob SHA")


def coverage(root, product_ids):
    document = load(root / "catalog/skill-coverage.json")
    require(document["schemaVersion"] == "1.0.0", "Coverage schema")
    require(document["recordKind"] == "procedure-coverage", "Coverage record kind")
    sources = [s["id"] for s in document["evidenceSources"]]
    unique(sources, "evidence source")
    procedures = document["procedures"]
    unique([p["id"] for p in procedures], "procedure")
    for procedure in procedures:
        require(procedure["status"] in {"demonstrated", "partially-demonstrated"}, "Status")
        require(procedure["relationship"] in {"standalone", "composition", "application"},
                "Procedure relationship")
        refs = procedure["productIds"]
        unique(refs, "procedure product reference")
        require(refs and set(refs) <= product_ids, f"Unknown product: {procedure['id']}")
        evidence = procedure["evidence"]
        require(evidence and all(e["sourceId"] in sources for e in evidence), "Evidence source")
        require(procedure["limits"], "Missing procedure limits")
    mappings = document["productCoverage"]
    unique([m["productId"] for m in mappings], "product coverage")
    require({m["productId"] for m in mappings} == product_ids, "Product coverage mismatch")
    for mapping in mappings:
        expected = [p["id"] for p in procedures if mapping["productId"] in p["productIds"]]
        require(mapping["procedureIds"] == expected, f"Mapping drift: {mapping['productId']}")
        require(mapping["invocation"] == "not-established", "Unsupported product invocation")
        state = "procedure-coverage" if expected else "not-established-in-reviewed-work"
        require(mapping["mapping"] == state, "Mapping classification drift")
        require(mapping["catalogueState"] in {"added", "retained"}, "Catalogue state")
    added = {m["productId"] for m in mappings if m["catalogueState"] == "added"}
    require(added == set(document["scope"]["newProductIds"]), "New product coverage drift")
    require(len(product_ids - added) == document["scope"]["baselineProductCount"], "Baseline count")
    dependencies = document["supportingSkills"]
    unique([d["name"] for d in dependencies], "supporting skill")
    for dependency in dependencies:
        require(dependency["catalogueTreatment"] == "external-platform-dependency", "Dependency")
        require(dependency["observedIn"] and set(dependency["observedIn"]) <= set(sources),
                "Supporting skill evidence source")
    unique([item["id"] for item in document["carryForward"]], "carry-forward item")
    for item in document["carryForward"]:
        require(set(item["relatedProductIds"]) <= product_ids, "Carry-forward product")
    return len(procedures), len(dependencies)


def validate(root):
    manifest = load(root / "catalog/manifest.json")
    require(manifest["schemaVersion"] == "1.0.0", "Manifest schema")
    ids = [entry["id"] for entry in manifest["products"]]
    unique(ids, "product ID")
    require(ids == sorted(ids), "Manifest order must be deterministic")
    records = metadata(root, manifest)
    expected = []
    for record in records:
        item = {k: v for k, v in record.items() if k not in {"schemaVersion", "source"}}
        item["sourcePath"] = f"products/{record['id']}/{record['source']}"
        expected.append(item)
    public = load(root / "catalog/products.public.json")
    require(public["schemaVersion"] == "1.0.0", "Public schema")
    require(public["catalogKind"] == "public-source-backed", "Public catalogue kind")
    require(public["products"] == expected, "Public projection drift")
    provenance(root, records)
    procedures, dependencies = coverage(root, set(ids))
    print(f"PASS: {len(records)} products; {procedures} procedures; {dependencies} supporting skills")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    try:
        validate(parser.parse_args().root.resolve())
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(1, f"FAIL: {error}\n")
