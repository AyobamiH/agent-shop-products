"""End-to-end checks for product detail JSON-LD and machine-readable surfaces.

Verifies against the running app that:
- each of the 11 canonical product pages emits valid, catalogue-accurate JSON-LD;
- no page or surface exposes raw PROMPT.md payload;
- /catalog.json, /llms.txt, /sitemap.xml and /raw/products/* derive from the same
  11 records;
- the retired Audiogram product 404s everywhere.

Run: python3 e2e/product_surfaces.py
"""

import asyncio
import json
import pathlib
import re
import sys

from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8080"
ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = json.loads((ROOT / "catalog" / "products.public.json").read_text())
PRODUCTS = CATALOG["products"]
EXPECTED_COUNT = json.loads((ROOT / "catalog" / "source.json").read_text())["productCount"]
PAYLOAD_MARKERS = ["```", "## System role", "<system>"]
FORBIDDEN_JSONLD_KEYS = ["offers", "aggregateRating", "review", "price"]

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    status = "PASS" if condition else "FAIL"
    print(f"{status}  {name}  {detail}".rstrip())
    if not condition:
        failures.append(name)


async def read_text(page, path: str) -> tuple[int, str]:
    response = await page.request.get(f"{BASE_URL}{path}")
    return response.status, await response.text()


async def check_product_page(page, product: dict) -> None:
    slug = product["slug"]
    await page.goto(f"{BASE_URL}/products/{slug}", wait_until="domcontentloaded")

    blocks = await page.locator('script[type="application/ld+json"]').all_text_contents()
    parsed = [json.loads(block) for block in blocks if block.strip()]
    product_ld = next((item for item in parsed if item.get("@type") == "CreativeWork"), None)

    check(f"{slug}: emits CreativeWork JSON-LD", product_ld is not None)
    if product_ld is None:
        return

    check(f"{slug}: JSON-LD name matches catalogue", product_ld.get("name") == product["name"])
    check(
        f"{slug}: JSON-LD description matches summary",
        product_ld.get("description") == product["summary"],
    )
    check(
        f"{slug}: JSON-LD context is schema.org",
        product_ld.get("@context") == "https://schema.org",
    )
    check(
        f"{slug}: JSON-LD omits commercial nodes",
        all(key not in product_ld for key in FORBIDDEN_JSONLD_KEYS),
    )

    body = await page.inner_text("body")
    check(
        f"{slug}: page exposes no raw prompt payload",
        not any(marker in body for marker in PAYLOAD_MARKERS),
    )
    check(f"{slug}: page renders the catalogue problem statement", product["problem"][:60] in body)


async def main() -> None:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        for product in PRODUCTS:
            await check_product_page(page, product)

        status, catalog_body = await read_text(page, "/catalog.json")
        catalog_json = json.loads(catalog_body)
        check("/catalog.json responds 200", status == 200)
        check(
            "/catalog.json reports synced canonical count products",
            catalog_json["productCount"] == EXPECTED_COUNT
            and len(catalog_json["products"]) == EXPECTED_COUNT,
        )
        check(
            "/catalog.json slugs match the bundled projection",
            sorted(item["slug"] for item in catalog_json["products"])
            == sorted(item["slug"] for item in PRODUCTS),
        )
        check(
            "/catalog.json exposes no prompt payload",
            not any(marker in catalog_body for marker in PAYLOAD_MARKERS),
        )

        status, llms_body = await read_text(page, "/llms.txt")
        check("/llms.txt responds 200", status == 200)
        check(f"/llms.txt reports {EXPECTED_COUNT} products", f"products: {EXPECTED_COUNT}" in llms_body)
        check(
            "/llms.txt lists every canonical product",
            all(item["name"] in llms_body for item in PRODUCTS),
        )

        status, sitemap_body = await read_text(page, "/sitemap.xml")
        detail_urls = re.findall(r"<loc>([^<]*(?<!/raw)/products/[^<]+)</loc>", sitemap_body)
        check("/sitemap.xml responds 200", status == 200)
        check(
            "/sitemap.xml lists every product detail pages",
            len(detail_urls) == EXPECTED_COUNT,
            f"found={len(detail_urls)}",
        )
        check(
            "/sitemap.xml contains only indexable HTML, not machine metadata",
            "/catalog.json" not in sitemap_body
            and "/llms.txt" not in sitemap_body
            and "/raw/products/" not in sitemap_body,
        )

        for product in PRODUCTS:
            raw_path = f"/raw/products/{product['slug']}.md"
            response = await page.request.get(f"{BASE_URL}{raw_path}")
            status = response.status
            markdown = await response.text()
            content_type = response.headers.get("content-type", "")
            ok = status == 200 and product["name"] in markdown
            clean = not any(marker in markdown for marker in PAYLOAD_MARKERS)
            detail = (
                f"status={status} content-type={content_type} "
                f"prefix={markdown[:120]!r}"
            )
            check(f"{raw_path} serves metadata only", ok and clean, detail)

        for path in [
            "/products/audiogram",
            "/raw/products/audiogram.md",
            "/products/audiogram-generator",
        ]:
            response = await page.request.get(f"{BASE_URL}{path}")
            check(f"{path} returns 404", response.status == 404, f"status={response.status}")

        check(
            "Audiogram absent from machine surfaces",
            "audiogram" not in (catalog_body + llms_body + sitemap_body).lower(),
        )

        await browser.close()

    print()
    if failures:
        print(f"{len(failures)} check(s) failed: {', '.join(failures)}")
        sys.exit(1)
    print("all checks passed")


asyncio.run(main())