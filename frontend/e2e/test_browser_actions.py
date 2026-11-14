"""Pure regression tests: bounded layout-settling without synthetic DOM clicks."""
import unittest

from browser_actions import pointer_click


class Locator:
    def __init__(self, boxes, hits=(True,), visible=True, enabled=True):
        self.boxes = list(boxes)
        self.hits = list(hits)
        self.visible = visible
        self.enabled = enabled
        self.moves = 0

    async def is_visible(self):
        return self.visible

    async def is_enabled(self):
        return self.enabled

    async def bounding_box(self):
        return self.boxes.pop(0) if self.boxes else None

    async def evaluate(self, expression):
        if "scrollIntoView" in expression:
            self.moves += 1
            return None
        return self.hits.pop(0) if self.hits else False


class Page:
    def __init__(self):
        self.mouse = self
        self.clicks = []

    async def wait_for_timeout(self, ms):
        assert ms > 0

    async def click(self, x, y):
        self.clicks.append((x, y))


def box(y):
    return {"x": 20, "y": y, "width": 100, "height": 44}


class PointerActionabilityTests(unittest.IsolatedAsyncioTestCase):
    async def test_genuine_click_after_transient_layout_shift(self):
        page = Page()
        locator = Locator([box(200), box(157), box(157), box(157)])
        await pointer_click(page, locator)
        self.assertEqual(page.clicks, [(70, 179)])
        self.assertEqual(locator.moves, 2)

    async def test_stable_actionable_target(self):
        page = Page()
        await pointer_click(page, Locator([box(20), box(20)]))
        self.assertEqual(page.clicks, [(70, 42)])

    async def test_persistent_obstruction_is_not_bypassed(self):
        page = Page()
        locator = Locator([box(20)] * 24, hits=(False,) * 12)
        with self.assertRaisesRegex(AssertionError, "centre is intercepted"):
            await pointer_click(page, locator)
        self.assertEqual(page.clicks, [])
        self.assertEqual(locator.moves, 12)

    async def test_continual_motion_is_not_bypassed(self):
        page = Page()
        locator = Locator([box(i * 5) for i in range(24)])
        with self.assertRaisesRegex(AssertionError, "geometry changed"):
            await pointer_click(page, locator)
        self.assertEqual(page.clicks, [])

    async def test_hidden_and_disabled_are_refused(self):
        for locator in (
            Locator([], visible=False),
            Locator([], enabled=False),
        ):
            page = Page()
            with self.assertRaises(AssertionError):
                await pointer_click(page, locator)
            self.assertEqual(page.clicks, [])


if __name__ == "__main__":
    unittest.main()
