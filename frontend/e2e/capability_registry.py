"""Full metadata coverage plus browser acquisition, URL-state and responsive checks."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright, expect

ORIGIN = "http://localhost:8080"
ROOT = Path(__file__).resolve().parent.parent
INVENTORY = json.loads((ROOT / "catalog/capability-inventory.json").read_text())
BUGS = json.loads((ROOT / "catalog/agentic-coding-bugs.json").read_text())["bugs"]


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        response = await page.request.get(ORIGIN + "/capabilities.json")
        assert response.status == 200
        catalogue = await response.json()
        records = catalogue["capabilities"]
        assert len(records) == 990 == catalogue["capabilityCount"]
        assert len({r["id"] for r in records}) == 990
        for kind, source in [("skill", INVENTORY["skills"]), ("tool", INVENTORY["tools"])]:
            assert {r["name"] for r in records if r["kind"] == kind} == {r["name"] for r in source}
        assert {r["name"] for r in records if r["kind"] == "control"} == set(INVENTORY["orchestrationControls"])
        sitemap = await (await page.request.get(ORIGIN + "/sitemap.xml")).text()
        for r in records:
            assert "/capabilities/" + r["id"] in sitemap
        for kind in ["skill", "tool", "control"]:
            record = next(r for r in records if r["kind"] == kind and r["integrationRequestAllowed"])
            await page.goto(ORIGIN + "/capabilities/" + record["id"])
            await expect(page.get_by_role("heading", name=record["name"], exact=True)).to_be_visible()
            await expect(page.get_by_role("link", name="Request an integration quote")).to_have_attribute("href", "https://tailwaggingwebdesign.com/agents/")
            brief = await (await page.request.get(ORIGIN + "/capability-brief.json?id=" + record["id"])).json()
            assert brief["handoff"]["templateIsIncomplete"] is True
            assert "contactEmail" not in brief["handoff"]["requestTemplate"]
            assert "price" not in brief["acquisition"]
        excluded = next(r for r in records if not r["integrationRequestAllowed"])
        await page.goto(ORIGIN + "/capabilities/" + excluded["id"])
        assert await page.get_by_role("link", name="Request an integration quote").count() == 0
        assert (await page.request.get(ORIGIN + "/capability-brief.json?id=missing")).status == 404
        assert (await page.request.get(ORIGIN + "/capabilities/missing")).status == 404
        for path in ["/capabilities.json", "/capability-brief.json", "/coding-bugs.json"]:
            for method in ["POST", "PUT", "PATCH", "DELETE"]:
                write = await page.request.fetch(ORIGIN + path, method=method, data="{}")
                assert write.status == 405, (path, method, write.status)
                assert write.headers["allow"] == "GET"

        await page.goto(ORIGIN + "/capabilities")
        await expect(page.get_by_test_id("capability-count")).to_contain_text("990 matching capabilities")
        assert await page.get_by_test_id("capability-row").count() == 40
        await page.get_by_role("link", name="Next page", exact=True).click()
        await expect(page).to_have_url(ORIGIN + "/capabilities?page=2")
        await page.go_back()
        await expect(page.get_by_test_id("capability-count")).to_contain_text("page 1 of 25")
        await page.get_by_label("Capability kind", exact=True).select_option("tool")
        await page.get_by_label("Provider or namespace", exact=True).select_option("GitHub")
        await page.get_by_label("Search capability names", exact=True).fill("fetch")
        await page.get_by_role("button", name="Search", exact=True).click()
        api = await (await page.request.get(ORIGIN + "/capabilities.json?q=fetch&kind=tool&provider=GitHub")).json()
        assert api["matchedCount"] > 0
        await expect(page.get_by_test_id("capability-count")).to_contain_text(str(api["matchedCount"]) + " matching capabilities")
        assert await page.get_by_test_id("capability-row").count() == len(api["capabilities"])

        await page.goto(ORIGIN + "/coding-bugs")
        assert await page.get_by_test_id("coding-bug").count() == len(BUGS)
        await page.get_by_label("Search bugs and repair patterns", exact=True).fill("hydration")
        await page.get_by_role("button", name="Search", exact=True).click()
        assert await page.get_by_test_id("coding-bug").count() == 1
        await page.locator("summary").click()
        await expect(page.get_by_role("link", name="Inspect supporting source")).to_be_visible()
        bugs = await (await page.request.get(ORIGIN + "/coding-bugs.json")).json()
        assert bugs["bugCount"] == len(BUGS)

        await page.set_viewport_size({"width": 390, "height": 844})
        for path in ["/shop", "/capabilities?kind=control", "/coding-bugs?q=hydration"]:
            await page.goto(ORIGIN + path)
            fits = await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            if not fits:
                overflow = await page.evaluate("""() => Array.from(document.querySelectorAll('*')).map(el => {
                    const r = el.getBoundingClientRect();
                    return {tag: el.tagName, class: el.className, text: (el.innerText || '').slice(0, 90), left: r.left, right: r.right, width: r.width};
                }).filter(r => r.right > window.innerWidth + 0.5 || r.left < -0.5).sort((a,b) => b.width-a.width).slice(0,12)""")
                print(json.dumps({"path": path, "overflow": overflow}), flush=True)
            assert fits, path + " overflows mobile viewport"
        assert not errors, errors
        await browser.close()
        print(f"PASS: 990 registry records, all sitemap IDs, quote boundaries, URL filters, {len(BUGS)} bugs and mobile layout")


asyncio.run(main())
