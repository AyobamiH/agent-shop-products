"""Deterministic browser pointer actions for local/headless acceptance.

Playwright's locator actionability waiter can stall on otherwise stable controls
in the authorised WSL/headless Chromium environment. Keep the strong parts of
actionability explicit here, then issue a genuine pointer event at the verified
centre of the element. Behavioural assertions remain in the calling tests.
"""

from playwright.async_api import Locator, Page


async def wait_for_condition(page: Page, expression: str, *, timeout_ms: int = 30_000) -> None:
    # Interval polling is deliberate. Playwright's default requestAnimationFrame
    # poller can stall in the authorised WSL/headless Chromium environment.
    await page.wait_for_function(expression, polling=100, timeout=timeout_ms)


async def pointer_click(page: Page, locator: Locator, *, settle_ms: int = 100) -> None:
    if not await locator.is_visible():
        raise AssertionError("pointer target is not visible")
    if not await locator.is_enabled():
        raise AssertionError("pointer target is not enabled")

    await locator.evaluate(
        "(el) => el.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'})"
    )
    await page.wait_for_timeout(settle_ms)
    first = await locator.bounding_box()
    await page.wait_for_timeout(settle_ms)
    second = await locator.bounding_box()
    if first is None or second is None:
        raise AssertionError("pointer target has no rendered geometry")

    for key in ("x", "y", "width", "height"):
        if abs(first[key] - second[key]) > 0.5:
            raise AssertionError(f"pointer target geometry changed: {first!r} -> {second!r}")

    clear_centre = await locator.evaluate(
        """(el) => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit === el || (hit !== null && el.contains(hit));
        }"""
    )
    if not clear_centre:
        raise AssertionError("pointer target centre is intercepted")

    await page.mouse.click(
        second["x"] + second["width"] / 2,
        second["y"] + second["height"] / 2,
    )
