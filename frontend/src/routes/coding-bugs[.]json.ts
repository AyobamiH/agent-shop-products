import { createFileRoute } from "@tanstack/react-router";
import { codingBugIndex } from "@/domain/coding-bugs/repository";
import { absoluteUrl } from "@/lib/site";
export const Route = createFileRoute("/coding-bugs.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            ...codingBugIndex,
            bugCount: codingBugIndex.bugs.length,
            bugs: codingBugIndex.bugs.map((bug) => ({
              ...bug,
              detailUrl: absoluteUrl(`/coding-bugs#${bug.id}`),
              relatedSkillUrl: absoluteUrl(`/products/${bug.skillId}`),
            })),
          },
          { headers: { "cache-control": "public, max-age=300" } },
        ),
    },
  },
});
