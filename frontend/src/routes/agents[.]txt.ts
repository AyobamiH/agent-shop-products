import { createFileRoute } from "@tanstack/react-router";
import { buildAgentsTxt } from "@/lib/machine-readable/agents";

export const Route = createFileRoute("/agents.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildAgentsTxt(), {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        }),
    },
  },
});
