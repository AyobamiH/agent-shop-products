"""Browser acceptance: no charged order, pricing claim or private file is created.

The private-kit route is deliberately visible but the purchase flow stays
closed until its owner-approved merchant, legal text and delivery acceptance.
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('AGENT_SHOP_E2E_ORIGIN', 'http://localhost:8080').rstrip('/')

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 390, 'height': 844})
        await page.goto(BASE + '/private-kits', wait_until='domcontentloaded')
        await expect(page.get_by_role('heading', name='Private execution kits, not repackaged public prompts')).to_be_visible()
        await expect(page.get_by_text('Private-kit checkout is not yet open')).to_be_visible()
        await expect(page.get_by_text('£9 one-off', exact=False)).to_be_visible()
        assert await page.get_by_role('button', name='Continue to secure checkout').count() == 0
        assert await page.get_by_role('link', name='Check private-kit availability and commercial boundaries').count() == 0

        offers = await page.request.get(BASE + '/api/v1/commerce/offers')
        assert offers.status == 200, (offers.status, await offers.text())
        catalogue = await offers.json()
        assert catalogue['commerceActive'] is False
        assert catalogue['offers'][0]['availability'] == 'planned'
        assert 'unitAmountPence' not in catalogue['offers'][0]
        assert 'priceId' not in catalogue['offers'][0]

        unsafe = await page.request.post(
            BASE + '/api/v1/commerce/checkout',
            data=json.dumps({'offerId': 'private-production-agent-operating-kit'}),
            headers={
                'Content-Type': 'application/json',
                'Origin': 'https://agents.proofandstate.com',
                'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000',
            },
        )
        assert unsafe.status == 409, (unsafe.status, await unsafe.text())
        assert (await unsafe.json())['error'] == 'OFFER_UNAVAILABLE'

        anonymous = await page.request.get(
            BASE + '/api/v1/commerce/orders/550e8400-e29b-41d4-a716-446655440000',
        )
        assert anonymous.status == 401
        complete = await page.request.get(BASE + '/private-kits/complete')
        assert complete.status == 200
        assert 'noindex' in await complete.text()
        print('PASS: mobile private-kit planned availability, no Buy button, no price, denied checkout, denied order read, noindex completion')
        await browser.close()

asyncio.run(main())
