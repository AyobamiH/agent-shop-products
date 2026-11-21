"""Browser acceptance: no charge, falsely ACTIVE price or private file is created.

This scenario exercises a deliberately closed local offer fixture. Live purchase
availability must be verified independently against the running environment.
"""
import asyncio
import json
import os
import re
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('AGENT_SHOP_E2E_ORIGIN', 'http://localhost:8080').rstrip('/')
CONTACT_SOURCE = (Path(__file__).parents[1] / 'src/lib/contact.ts').read_text(encoding='utf-8')
SUPPORT_EMAIL = re.search(r'SUPPORT_EMAIL\s*=\s*"([^"]+)"', CONTACT_SOURCE).group(1)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 390, 'height': 844})
        initial = await page.request.get(BASE + '/private-kits')
        assert initial.status == 200
        initial_html = await initial.text()
        assert 'Checking current kit availability and price.' in initial_html
        assert 'A proposed private execution pack' not in initial_html
        assert 'Once purchases open' not in initial_html
        assert 'What is different from the free public reference?' in initial_html
        assert 'Continue to secure checkout' not in initial_html

        await page.goto(BASE + '/private-kits', wait_until='domcontentloaded')
        await expect(page.get_by_role('heading', name='Private execution kits', exact=True)).to_be_visible()
        assert 'Agent Shop' in await page.title()
        await expect(page.get_by_role('heading', name='What is different from the free public reference?')).to_be_visible()

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

        # HTTP failures mean unknown availability, never a confirmed closure.
        async def fail_offers(route):
            await route.fulfill(status=500, content_type='application/json', body='{}')

        await page.route('**/api/v1/commerce/offers', fail_offers)
        await page.reload(wait_until='domcontentloaded')
        await expect(page.get_by_text('Current kit availability cannot be confirmed')).to_be_visible()
        assert await page.get_by_text('Private-kit checkout is not yet open').count() == 0
        assert await page.get_by_text('Planned introductory price:', exact=False).count() == 0
        assert await page.get_by_role('button', name='Continue to secure checkout').count() == 0
        await page.unroute('**/api/v1/commerce/offers', fail_offers)

        # A 200 without the canonical kit is not proof that checkout is closed.
        for malformed_offers in [
            [],
            [{'id': 'unrelated-kit', 'availability': 'purchase_available'}],
            [{'id': 'private-production-agent-operating-kit', 'availability': 'unexpected'}],
        ]:
            async def missing_kit(route):
                await route.fulfill(
                    status=200, content_type='application/json',
                    body=json.dumps({'schemaVersion': 1, 'commerceActive': True, 'offers': malformed_offers}),
                )

            await page.route('**/api/v1/commerce/offers', missing_kit)
            await page.reload(wait_until='domcontentloaded')
            await expect(page.get_by_text('Current kit availability cannot be confirmed')).to_be_visible()
            assert await page.get_by_text('Private-kit checkout is not yet open').count() == 0
            assert await page.get_by_text('Planned introductory price:', exact=False).count() == 0
            assert await page.get_by_role('button', name='Continue to secure checkout').count() == 0
            await page.unroute('**/api/v1/commerce/offers', missing_kit)

        # Global off must supersede a contradictory purchase_available offer.
        live_offer = {
            'id': 'private-production-agent-operating-kit',
            'title': 'Private Production Agent Operating Kit',
            'summary': 'Runtime guard and recovery cases',
            'version': '2026.10.1',
            'availability': 'purchase_available',
            'mode': 'live',
            'termsVersion': '2026-10-16.1',
            'licenceVersion': '2026-10-16.1',
            'refundPolicyVersion': '2026-10-16.1',
            'unitAmountPence': 900,
            'currency': 'gbp',
            'paymentModel': 'managed_payments',
            'termsUrl': 'https://agents.proofandstate.com/legal/kit-terms',
            'licenceUrl': 'https://agents.proofandstate.com/legal/kit-licence',
            'refundUrl': 'https://agents.proofandstate.com/legal/kit-refunds',
        }
        async def closed_global(route):
            await route.fulfill(status=200, content_type='application/json',
                                body=json.dumps({'schemaVersion': 1, 'commerceActive': False, 'offers': [live_offer]}))

        await page.route('**/api/v1/commerce/offers', closed_global)
        await page.reload(wait_until='domcontentloaded')
        await expect(page.get_by_text('Private-kit checkout is not yet open')).to_be_visible()
        assert await page.get_by_role('button', name='Continue to secure checkout').count() == 0
        await page.unroute('**/api/v1/commerce/offers', closed_global)

        # Mocked live UI: verify price and button, never click or charge.
        async def live_global(route):
            await route.fulfill(status=200, content_type='application/json',
                                body=json.dumps({'schemaVersion': 1, 'commerceActive': True, 'offers': [live_offer]}))

        await page.route('**/api/v1/commerce/offers', live_global)
        await page.reload(wait_until='domcontentloaded')
        await expect(page.get_by_role('button', name='Continue to secure checkout')).to_be_visible()
        await expect(page.get_by_text('£9.00', exact=True)).to_be_visible()
        await page.unroute('**/api/v1/commerce/offers', live_global)

        # The client must not display a misleading checkout/closed state for
        # an HTTP 200 with a mismatched price, currency or legal destination.
        for changed in [
            {'unitAmountPence': 800},
            {'priceId': 'price_should_not_be_public'},
            {'currency': 'usd'},
            {'mode': 'disabled'},
            {'termsVersion': '2025-old'},
            {'licenceVersion': None},
            {'refundPolicyVersion': '2025-old'},
            {'termsUrl': 'https://example.invalid/legal/kit-terms'},
        ]:
            async def inconsistent_live(route):
                await route.fulfill(status=200, content_type='application/json',
                    body=json.dumps({'schemaVersion': 1, 'commerceActive': True,
                                     'offers': [{**live_offer, **changed}]}))

            await page.route('**/api/v1/commerce/offers', inconsistent_live)
            await page.reload(wait_until='domcontentloaded')
            await expect(page.get_by_text('Current kit availability cannot be confirmed')).to_be_visible()
            assert await page.get_by_text('Private-kit checkout is not yet open').count() == 0
            assert await page.get_by_text('Planned introductory price:', exact=False).count() == 0
            assert await page.get_by_role('button', name='Continue to secure checkout').count() == 0
            await page.unroute('**/api/v1/commerce/offers', inconsistent_live)

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
        await page.goto(BASE + '/private-kits/complete', wait_until='domcontentloaded')
        await expect(page.get_by_role('heading', name='Your kit order', exact=True)).to_be_visible()
        await expect(page.locator('main').get_by_role('link', name=SUPPORT_EMAIL)).to_be_visible()
        print('PASS: mobile private-kit planned availability, no Buy button, no price, denied checkout, denied order read, noindex completion')
        await browser.close()

asyncio.run(main())