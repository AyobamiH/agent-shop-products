"""Read-only package discovery and responsive acceptance; never submits a job."""
import asyncio
import os
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('AGENT_SHOP_E2E_ORIGIN', 'http://localhost:8080').rstrip('/')


async def main():
    async with async_playwright() as playwright:
        options = {'headless': True}
        if os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'):
            options['executable_path'] = os.environ['PLAYWRIGHT_CHROMIUM_EXECUTABLE']
        browser = await playwright.chromium.launch(**options)
        page = await browser.new_page()
        response = await page.request.get(BASE + '/integration-packages.json')
        assert response.status == 200
        data = await response.json()
        assert len(data['packages']) == 3
        for method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            rejected = await page.request.fetch(BASE + '/integration-packages.json', method=method)
            assert rejected.status == 405
            assert rejected.headers['allow'] == 'GET'
        initial = await page.request.get(BASE + '/integration-services')
        html = await initial.text()
        for package in data['packages']:
            assert package['title'] in html
            assert package['availability'] == 'quote_first_integration'
        for width in [390, 1440]:
            await page.set_viewport_size({'width': width, 'height': 900})
            await page.goto(BASE + '/integration-services', wait_until='domcontentloaded')
            await expect(page.get_by_role('heading', name='Original integration packages', exact=True)).to_be_visible()
            for package in data['packages']:
                await expect(page.get_by_role('heading', name=package['title'], exact=True)).to_be_visible()
            assert await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            link = page.get_by_role('link', name='Inspect package versions and archive digests')
            await link.focus()
            await expect(link).to_be_focused()
        await browser.close()
    print('PASS: package metadata, write rejection, crawlable content, phone/desktop and keyboard link')


asyncio.run(main())
