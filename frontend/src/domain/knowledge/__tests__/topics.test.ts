import { describe, expect, it } from "vitest";
import { listProducts } from "@/domain/catalog/repository";
import { buildKnowledgeTopics } from "../topics";

describe("knowledge topics", () => {
  const topics = buildKnowledgeTopics();

  it("derives every topic from catalogue records", () => {
    expect(topics.length).toBeGreaterThan(0);
    for (const topic of topics) {
      expect(topic.sourceProductIds.length).toBeGreaterThan(0);
    }
  });

  it("renders only verbatim catalogue problem statements", () => {
    const problems = new Set(listProducts().map((product) => product.problem));
    for (const topic of topics) {
      for (const problem of topic.problems) {
        expect(problems.has(problem)).toBe(true);
      }
    }
  });
});