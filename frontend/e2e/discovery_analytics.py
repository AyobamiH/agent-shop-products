"""Consent/privacy E2E: real runtime, intercepted Google, no customer or analytics traffic."""
import asyncio
import json
import os
import subprocess
import shutil
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright, expect
from browser_actions import wait_for_condition
BASE = os.environ.get("AGENT_SHOP_E2E_ORIGIN", "http://localhost:8080").rstrip("/")

async def run():
    with tempfile.TemporaryDirectory(prefix="agent-shop-analytics-e2e-") as directory:
        bundle = Path(directory) / "harness.js"
        # The same offline fixture can run on machines without the Bun executable.
        # Both builders bundle into one isolated browser script; neither calls Google.
        builder = (["bun", "build", "e2e/fixtures/analytics-harness.ts",
                    "--target", "browser", "--outfile", str(bundle)]
                   if shutil.which("bun") else
                   ["node", "node_modules/rolldown/dist/cli.mjs",
                    "e2e/fixtures/analytics-harness.ts", "--platform", "browser",
                    "--format", "iife", "--file", str(bundle)])
        subprocess.run(builder, check=True, capture_output=True)
        async with async_playwright() as p:
            options = {"headless": True}
            if os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"):
                options["executable_path"] = os.environ["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]
            browser = await p.chromium.launch(**options)
            # Browser-runtime tests cannot contact Google or the production service.
            page = await browser.new_page()
            google_requests = []
            unexpected = []
            async def isolate(route):
                url = route.request.url
                if url == "https://analytics-fixture.invalid/":
                    await route.fulfill(content_type="text/html", body='<html><body><h1>Isolated consent fixture</h1><script src="/harness.js"></script></body></html>')
                elif url == "https://analytics-fixture.invalid/harness.js":
                    await route.fulfill(content_type="text/javascript", body=bundle.read_text())
                elif url.startswith("https://www.googletagmanager.com/gtag/js?id=G-TESTONLY00&"):
                    google_requests.append(url)
                    await route.fulfill(content_type="text/javascript", body="/* intercepted, never Google */")
                else:
                    unexpected.append(url)
                    await route.abort()
            await page.route("**/*", isolate)
            await page.goto("https://analytics-fixture.invalid/")
            await wait_for_condition(page, "Boolean(window.analyticsFixture)")
            await page.evaluate("analyticsFixture.visit('/solutions', null)")
            await page.evaluate("analyticsFixture.visit('/solutions', 'denied')")
            assert not google_requests
            assert await page.evaluate("window.agentShopAnalyticsLayer === undefined")
            await page.evaluate("analyticsFixture.visit('/solutions?utm_source=linkedin&utm_medium=social&utm_campaign=agent_shop_evidence', 'granted')")
            await wait_for_condition(page, "Boolean(document.getElementById('agent-shop-analytics'))")
            await page.wait_for_timeout(100)
            assert len(google_requests) == 1
            commands = await page.evaluate("agentShopAnalyticsLayer.map(x => Array.from(x))")
            events = [c for c in commands if c[0] == "event"]
            assert len(events) == 1 and events[0][1] == "page_view"
            assert events[0][2]["page_location"] == "https://agents.proofandstate.com/solutions"
            config = next(c[2] for c in commands if c[0] == "config")
            assert config["send_page_view"] is False
            assert config["allow_google_signals"] is False
            assert config["cookie_update"] is False
            assert config["cookie_domain"] == "none"
            assert config["page_referrer"] == ""
            assert "utm_" not in json.dumps(commands, default=str)
            await page.evaluate("document.cookie = 'agent_shop_ga=fixture; Secure; Path=/'; document.cookie = 'essential_order=keep; Secure; Path=/'")
            await page.evaluate("analyticsFixture.pause(); analyticsFixture.visit('/integration-services', 'granted')")
            assert "agent_shop_ga=fixture" in await page.evaluate("document.cookie")
            await page.evaluate("analyticsFixture.click('/integration-services', 'granted', 'quote_click')")
            commands = await page.evaluate("agentShopAnalyticsLayer.map(x => Array.from(x))")
            assert [c[1] for c in commands if c[0] == "event"] == ["page_view", "quote_click"]
            await page.evaluate("analyticsFixture.visit('/private-kits/complete?claim=secret', 'granted')")
            assert await page.evaluate("window['ga-disable-G-TESTONLY00']") is True
            assert await page.evaluate("agentShopAnalyticsLayer.length") == 0
            await page.evaluate("analyticsFixture.visit('/solutions?email=private@example.com', 'granted')")
            assert await page.evaluate("agentShopAnalyticsLayer.length") == 0
            await page.evaluate("analyticsFixture.visit('/solutions', 'denied')")
            assert "agent_shop_ga" not in await page.evaluate("document.cookie")
            assert "essential_order=keep" in await page.evaluate("document.cookie")
            assert await page.locator("#agent-shop-analytics").count() == 0
            assert len(google_requests) == 1 and not unexpected
            # A genuine consented assistant referral is classified by a fixed host
            # only; raw chat paths/queries never reach the GA command layer.
            await page.evaluate("analyticsFixture.setReferrer('https://chatgpt.com/c/private?token=hidden')")
            await page.evaluate("analyticsFixture.visit('/shop', null)")
            assert not await page.evaluate("agentShopAnalyticsLayer.length")
            await page.evaluate("analyticsFixture.visit('/shop', 'granted')")
            await wait_for_condition(page, "agentShopAnalyticsLayer.some(x => x[0] === 'event')")
            commands = await page.evaluate("agentShopAnalyticsLayer.map(x => Array.from(x))")
            assert next(c[2] for c in commands if c[0] == "config")["campaign_source"] == "chatgpt.com"
            assert next(c[2] for c in commands if c[0] == "event")["discovery_source"] == "chatgpt.com"
            assert "hidden" not in json.dumps(commands, default=str)
            assert "/c/private" not in json.dumps(commands, default=str)
            assert len(google_requests) == 2 and not unexpected
            await page.close()
            if os.environ.get("AGENT_SHOP_E2E_FIXTURE_ONLY") != "1":
                from analytics_application import application_acceptance
                await application_acceptance(browser)
            await browser.close()
    if os.environ.get("AGENT_SHOP_E2E_FIXTURE_ONLY") == "1":
        print("PASS: isolated consent, privacy, assistant attribution and event transport; full app acceptance NOT RUN")
    else:
        print("PASS: consent denial/grant/withdrawal, scoped-cookie removal, safe events, private-route exclusion, enabled consent-bound application and separated diagnostic events, crawlable content, phone/desktop; no Google or customer transaction")

asyncio.run(run())
