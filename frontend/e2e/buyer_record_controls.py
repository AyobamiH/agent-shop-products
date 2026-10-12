"""Browser checks for purchase-record download and support-assisted recovery.
API responses are isolated browser fixtures; no payment or customer record is created.
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright, expect

BASE = os.environ.get("AGENT_SHOP_E2E_ORIGIN", "http://localhost:8080").rstrip("/")
ORDER = "11111111-1111-4111-8111-111111111111"
CLAIM = "A" * 43

async def main():
    async with async_playwright() as p:
        executable = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE")
        browser = await p.chromium.launch(headless=True, **({"executable_path": executable} if executable else {}))
        for width in [375, 1440]:
            page = await browser.new_page(viewport={"width": width, "height": 900})
            saved = False
            async def order_status(route):
                await route.fulfill(status=200, content_type="application/json", body=json.dumps({
                    "orderId": ORDER, "state": "paid", "fulfilment": "available",
                    "purchaseRecordAvailable": True, "purchaseRecordSaved": saved,
                }))
            async def purchase_record(route):
                nonlocal saved
                saved = True
                await route.fulfill(status=200, content_type="text/plain", body="Isolated test purchase record")
            await page.route("**/api/v1/commerce/orders/*", order_status)
            await page.route("**/api/v1/commerce/purchase-record/*", purchase_record)
            await page.goto(BASE + "/private-kits/complete", wait_until="domcontentloaded")
            await page.get_by_text("Have an access code from support?").click()
            await page.get_by_label("Order reference", exact=True).fill(ORDER)
            await page.get_by_label("Private access code", exact=True).fill(CLAIM)
            await page.get_by_role("button", name="Restore order access").click()
            kit = page.get_by_role("button", name="Download your kit", exact=True)
            await expect(kit).to_be_disabled()
            async with page.expect_download() as info:
                await page.get_by_role("button", name="Save purchase record").click()
            download = await info.value
            assert download.suggested_filename == "agent-shop-purchase-record.txt"
            await expect(kit).to_be_enabled()
            assert await page.get_by_label("Private access code", exact=True).input_value() == ""
            assert CLAIM not in page.url
            assert await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            await page.close()
        await browser.close()
        print("PASS: mobile/desktop support-code restoration, private code handling and purchase-record-before-kit controls")
asyncio.run(main())
