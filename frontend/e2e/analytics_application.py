"""The real app on its canonical browser origin, served locally; all Google calls intercepted."""
import os
from urllib.parse import urlsplit
from playwright.async_api import expect
BASE = os.environ.get('AGENT_SHOP_E2E_ORIGIN', 'http://localhost:8080').rstrip('/')
ORIGIN = 'https://agents.proofandstate.com'
VERSION = '2026-10-14.2'
TAG_STUB = '''
window.__gaCommands = (window.agentShopAnalyticsLayer || []).map(x => Array.from(x));
const originalPush = window.agentShopAnalyticsLayer.push.bind(window.agentShopAnalyticsLayer);
window.agentShopAnalyticsLayer.push = function(...items) {
  window.__gaCommands.push(...items.map(x => Array.from(x)));
  return originalPush(...items);
};
'''

async def application_context(browser, width=390, diagnostic=False, stale_consent=False, broken_storage=False):
    context = await browser.new_context(viewport={'width': width, 'height': 900})
    tags = []
    if diagnostic:
        await context.add_init_script("sessionStorage.setItem('agent-shop:analytics-diagnostic', 'operator')")
    if stale_consent:
        await context.add_init_script("if(!localStorage.getItem('agent-shop:analytics-consent')){localStorage.setItem('agent-shop:analytics-consent', JSON.stringify({version:'2026-10-14.1',choice:'granted',timestamp:Date.now()}))}")
    if broken_storage:
        await context.add_init_script("const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key,value){if(key==='agent-shop:analytics-consent')throw Error('Fixture storage unavailable');return original.call(this,key,value)}")
    async def intercept(route):
        request = route.request
        url = urlsplit(request.url)
        if request.url.startswith(ORIGIN + '/'):
            assert request.method == 'GET', 'The app acceptance must not create a payment or enquiry'
            local = BASE + url.path + ('?' + url.query if url.query else '')
            response = await route.fetch(url=local)
            await route.fulfill(response=response)
        elif url.hostname == 'www.googletagmanager.com' and url.path == '/gtag/js':
            tags.append(request.url)
            await route.fulfill(content_type='text/javascript', body=TAG_STUB)
        else:
            # Fonts and any unexpected third-party calls are not allowed out of CI.
            await route.abort()
    await context.route('**/*', intercept)
    return context, tags

async def activate(locator):
    # Exercise genuine keyboard input when the local WSL compositor is unavailable.
    # CI keeps pointer activation; neither path changes consent state directly.
    if os.environ.get('PLAYWRIGHT_KEYBOARD_ACTIVATION') == '1':
        await locator.focus()
        await expect(locator).to_be_focused()
        await locator.press('Enter')
    else:
        await locator.click()

async def events(page):
    return await page.evaluate("(window.__gaCommands || []).filter(x=>x[0]==='event').map(x=>({name:x[1],params:x[2]}))")

async def application_acceptance(browser):
    for width in [390, 1440]:
        context, tags = await application_context(browser, width, stale_consent=True)
        page = await context.new_page()
        await page.goto(ORIGIN + '/solutions?utm_source=linkedin&utm_medium=social&utm_campaign=agent_shop_evidence', wait_until='networkidle')
        await expect(page.get_by_role('region', name='Analytics preferences')).to_be_visible()
        assert not tags and await page.locator('#agent-shop-analytics').count() == 0
        await activate(page.get_by_role('button', name='Reject analytics', exact=True))
        await page.wait_for_load_state('networkidle')
        await expect(page.get_by_role('region', name='Analytics preferences')).to_have_count(0)
        assert not tags
        await activate(page.get_by_role('button', name='Analytics settings', exact=True))
        await activate(page.get_by_role('button', name='Allow analytics', exact=True))
        await page.wait_for_function("(window.__gaCommands || []).some(x=>x[0]==='event')")
        assert len(tags) == 1
        first = (await events(page))[0]
        assert first['name'] == 'page_view'
        assert first['params']['page_location'] == ORIGIN + '/solutions'
        assert first['params']['page_referrer'] == ''
        assert first['params']['discovery_source'] == 'linkedin'
        assert 'utm_' not in str(first)
        await page.goto(ORIGIN + '/capabilities', wait_until='networkidle')
        await page.wait_for_function("(window.__gaCommands || []).some(x=>x[0]==='event')")
        await activate(page.locator('a[data-discovery-event="select_capability"]').first)
        await page.wait_for_function("(window.__gaCommands || []).some(x=>x[0]==='event'&&x[1]==='select_capability')")
        assert any(e['name'] == 'select_capability' for e in await events(page))
        await page.goto(ORIGIN + '/integration-services', wait_until='networkidle')
        await page.wait_for_function("(window.__gaCommands || []).some(x=>x[0]==='event')")
        await page.evaluate("document.addEventListener('click',e=>{if(e.target.closest('a[data-discovery-event=quote_click]'))e.preventDefault()})")
        await activate(page.get_by_role('link', name='Request a scoped integration quote', exact=True))
        assert any(e['name'] == 'quote_click' for e in await events(page))
        await page.evaluate("document.cookie='agent_shop_ga=fixture; Path=/; Secure';document.cookie='essential_order=keep; Path=/; Secure'")
        await activate(page.get_by_role('button', name='Analytics settings', exact=True))
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        await activate(page.get_by_role('button', name='Reject analytics', exact=True))
        await page.wait_for_load_state('networkidle')
        assert 'agent_shop_ga' not in await page.evaluate('document.cookie')
        assert 'essential_order=keep' in await page.evaluate('document.cookie')
        count = len(tags)
        await page.reload(wait_until='networkidle')
        assert len(tags) == count
        # Even a valid existing preference must not load Google on private or unsafe URLs.
        await context.add_init_script("localStorage.setItem('agent-shop:analytics-consent',JSON.stringify({version:'" + VERSION + "',choice:'granted',timestamp:Date.now()}))")
        for path in ['/private-kits/complete?claim=unit-private', '/solutions?email=unit-private@example.invalid']:
            await page.goto(ORIGIN + path, wait_until='networkidle')
            assert len(tags) == count
            assert await page.locator('#agent-shop-analytics').count() == 0
        await context.close()
    context, tags = await application_context(browser, diagnostic=True)
    page = await context.new_page()
    await page.goto(ORIGIN + '/solutions', wait_until='networkidle')
    await activate(page.get_by_role('button', name='Allow analytics', exact=True))
    await page.wait_for_function("(window.__gaCommands || []).some(x=>x[0]==='event')")
    observed = await events(page)
    assert observed and all(e['name'] == 'agent_shop_diagnostic' for e in observed)
    assert observed[0]['params']['diagnostic_event'] == 'page_view'
    await context.close()
    context, tags = await application_context(browser, broken_storage=True)
    page = await context.new_page()
    await page.goto(ORIGIN + '/solutions', wait_until='networkidle')
    await activate(page.get_by_role('button', name='Allow analytics', exact=True))
    await expect(page.get_by_role('alert')).to_contain_text('could not be saved')
    assert not tags
    await context.close()
