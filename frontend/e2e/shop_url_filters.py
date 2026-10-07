"""End-to-end tests for URL-synced shop filters.

Verifies that:
  1. Toggling a facet writes the filter into the URL and narrows the results.
  2. A refresh restores the filters and the same result set.
  3. Browser back/forward restore the previous/next filter state and results.
  4. "Copy link" copies the current URL including all active filters.

Run against the dev server:  python3 e2e/shop_url_filters.py [base_url]
"""

import asyncio
import sys
from urllib.parse import parse_qs, urlparse

from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    print(f"{'PASS' if condition else 'FAIL'}  {name}{'  ' + detail if detail else ''}")
    if not condition:
        failures.append(name)


async def count_results(page) -> int:
    text = await page.get_by_test_id("result-count").inner_text()
    return int(text.split(" ")[0])


def query(url: str) -> dict:
    return parse_qs(urlparse(url).query)


async def main() -> None:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            permissions=["clipboard-read", "clipboard-write"],
        )
        page = await context.new_page()

        await page.goto(f"{BASE}/shop", wait_until="networkidle")
        total = await count_results(page)
        check("baseline shows products", total > 0, f"total={total}")

        # 1. Facet toggle -> URL + narrowed results
        chip = page.get_by_role("group", name="Product type").get_by_role("button").first
        await chip.click()
        await page.wait_for_function(
            "() => new URLSearchParams(location.search).has('type')"
        )
        filtered = await count_results(page)
        check("facet writes ?type=", "type" in query(page.url), page.url)
        check("facet narrows results", 0 < filtered <= total, f"{filtered}<={total}")

        # 2. Text search -> URL + narrowed results
        await page.get_by_role("searchbox").fill("verification")
        await page.wait_for_function("() => new URLSearchParams(location.search).has('q')")
        searched = await count_results(page)
        check("search writes ?q=", query(page.url).get("q") == ["verification"], page.url)

        # 3. Refresh restores filters and results
        url_before = page.url
        await page.reload(wait_until="networkidle")
        check("refresh keeps URL", page.url == url_before, page.url)
        check(
            "refresh restores search box",
            await page.get_by_role("searchbox").input_value() == "verification",
        )
        check("refresh restores results", await count_results(page) == searched)

        # 4. Copy link copies the filtered URL
        await page.get_by_test_id("copy-link").click()
        clipboard = await page.evaluate("navigator.clipboard.readText()")
        check("copy link copies filtered URL", clipboard == page.url, clipboard)

        # 5. Back restores the state before the facet toggle
        await page.go_back()
        await page.wait_for_function(
            "() => !new URLSearchParams(location.search).has('type')"
        )
        check("back clears ?type=", "type" not in query(page.url), page.url)
        check("back restores unfiltered count", await count_results(page) == total)

        # 6. Forward re-applies the facet
        await page.go_forward()
        await page.wait_for_function(
            "() => new URLSearchParams(location.search).has('type')"
        )
        check("forward re-applies ?type=", "type" in query(page.url), page.url)
        check("forward restores filtered results", await count_results(page) == searched)

        await browser.close()

    if failures:
        print(f"\n{len(failures)} failing check(s): {', '.join(failures)}")
        sys.exit(1)
    print("\nall checks passed")


asyncio.run(main())