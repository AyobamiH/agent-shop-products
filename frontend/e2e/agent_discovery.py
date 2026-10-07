"""Browser checks for canonical URLs, crawler policy and agent-only discovery."""

import asyncio
import json
import os
import pathlib
import sys

from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8080"
CANONICAL_ORIGIN = os.environ.get("VITE_SITE_ORIGIN", BASE_URL).rstrip("/")
ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = json.loads((ROOT / "catalog" / "source.json").read_text())
CATALOG = json.loads((ROOT / "catalog" / "products.public.json").read_text())
PRODUCTS = CATALOG["products"]
SKILLS = [product for product in PRODUCTS if product["productType"] == "skill"]
failures = []

def check(name, condition, detail=""):
    print(("PASS" if condition else "FAIL") + "  " + name + ("  " + detail if detail else ""))
    if not condition:
        failures.append(name)

async def read_text(page, path):
    response = await page.request.get(BASE_URL + path)
    return response.status, await response.text()

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 1600})

        for path in ["/", "/agents", "/shop", "/problems", "/knowledge"]:
            await page.goto(BASE_URL + path, wait_until="domcontentloaded")
            canonical = await page.locator('link[rel="canonical"]').get_attribute("href")
            robots = await page.locator('meta[name="robots"]').get_attribute("content")
            check(path + " canonical", canonical == CANONICAL_ORIGIN + path)
            check(path + " indexable", robots is not None and "noindex" not in robots)

        status, agents = await read_text(page, "/agents.txt")
        check("/agents.txt 200", status == 200)
        check("agents purpose", "autonomous and tool-using agents" in agents)
        check("agents catalog URL", CANONICAL_ORIGIN + "/catalog.json" in agents)
        check("agents CLI boundary", "MCP is out of scope" in agents)

        status, robots = await read_text(page, "/robots.txt")
        check("/robots.txt 200", status == 200)
        check("robots allow all", "User-agent: *" in robots and "Allow: /" in robots)
        check("robots sitemap origin", "Sitemap: " + CANONICAL_ORIGIN + "/sitemap.xml" in robots)

        status, sitemap = await read_text(page, "/sitemap.xml")
        check("/sitemap.xml 200", status == 200)
        check("sitemap agents.txt", CANONICAL_ORIGIN + "/agents.txt" in sitemap)
        for product in PRODUCTS:
            check("sitemap " + product["slug"], CANONICAL_ORIGIN + "/products/" + product["slug"] in sitemap)

        status, catalog_text = await read_text(page, "/catalog.json")
        catalog = json.loads(catalog_text)
        check("catalog count", catalog["productCount"] == SOURCE["productCount"])
        check("skill count", len(SKILLS) == SOURCE["productCountsByType"].get("skill", 0))
        for skill in SKILLS:
            check("skill discoverable " + skill["slug"], any(row["slug"] == skill["slug"] for row in catalog["products"]))

        await browser.close()

    if failures:
        print(str(len(failures)) + " check(s) failed: " + ", ".join(failures))
        sys.exit(1)
    print("all agent-discovery checks passed")

asyncio.run(main())
