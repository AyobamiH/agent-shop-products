"""Deterministic browser pointer actions for local/headless acceptance.

Actionability includes visibility, enablement, stable geometry and an
unobstructed centre. Transient layout shifts may settle; persistent obstructions
or movement fail closed. Only genuine Playwright mouse events are dispatched.
"""

from playwright.async_api import Locator, Page


async def wait_for_condition(page: Page, expression: str, *, timeout_ms: int = 30_000) -> None:
    # The authorised WSL/headless Chromium frame scheduler can stall.
    await page.wait_for_function(expression, polling=100, timeout=timeout_ms)


async def pointer_click(page: Page, locator: Locator, *, settle_ms: int = 100) -> None:
    if not await locator.is_visible():
        raise AssertionError("pointer target is not visible")
    if not await locator.is_enabled():
        raise AssertionError("pointer target is not enabled")

    last_problem = "unknown actionability failure"
    for _ in range(12):
        await locator.evaluate(
            "(el) => el.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'})"
        )
        await page.wait_for_timeout(settle_ms)
        first = await locator.bounding_box()
        await page.wait_for_timeout(settle_ms)
        second = await locator.bounding_box()
        if first is None or second is None:
            last_problem = "pointer target has no rendered geometry"
            continue

        changes = {
            key: (first[key], second[key])
            for key in ("x", "y", "width", "height")
            if abs(first[key] - second[key]) > 0.5
        }
        if changes:
            last_problem = f"pointer target geometry changed: {changes!r}"
            continue

        clear_centre = await locator.evaluate(
            """(el) => {
              const r = el.getBoundingClientRect();
              const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              return hit === el || (hit !== null && el.contains(hit));
            }"""
        )
        if not clear_centre:
            last_problem = "pointer target centre is intercepted"
            continue

        await page.mouse.click(
            second["x"] + second["width"] / 2,
            second["y"] + second["height"] / 2,
        )
        return

    raise AssertionError(f"pointer target did not become actionable: {last_problem}")
