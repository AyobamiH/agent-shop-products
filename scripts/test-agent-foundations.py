#!/usr/bin/env python3
"""Dependency-free negative and positive fixtures for foundation validation."""
import importlib.util
import sys
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location(
    "foundation_validator", Path(__file__).with_name("validate-agent-foundations.py"))
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

class FoundationChecks(unittest.TestCase):
    def setUp(self):
        self.files = {name: "fixture" for name in validator.REQUIRED}
        self.files["AGENTS.md"] = ".agents/knowledge/README.md " + validator.PREFIX + "SKILL.md"

    def check(self, links=()):
        return validator.check(self.files.__getitem__, self.files.__contains__,
                               lambda name: name in links)

    def test_valid(self):
        self.assertEqual([], self.check())

    def test_missing_skill_resource(self):
        del self.files[validator.PREFIX + "references/api-checks.md"]
        self.assertTrue(self.check())

    def test_broken_link(self):
        self.files[".agents/knowledge/README.md"] = "[missing](absent.md)"
        self.assertTrue(self.check())

    def test_escaping_link(self):
        self.files[".agents/knowledge/README.md"] = "[escape](../../../outside.md)"
        self.assertTrue(self.check())

    def test_symlink(self):
        self.assertTrue(self.check([validator.PREFIX + "SKILL.md"]))

    def test_missing_discovery(self):
        self.files["AGENTS.md"] = "No discovery links"
        self.assertTrue(self.check())

    def test_host_dependency(self):
        self.files[".agents/knowledge/README.md"] = "Read /home/operator/skill"
        self.assertTrue(self.check())

    def test_external_link(self):
        self.files[".agents/knowledge/README.md"] = "[source](https://example.org/)"
        self.assertEqual([], self.check())

if __name__ == "__main__":
    unittest.main()
