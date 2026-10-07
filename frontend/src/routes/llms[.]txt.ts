import { createFileRoute } from "@tanstack/react-router";
import { buildLlmsTxt } from "@/lib/machine-readable/llms";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsTxt(), {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        }),
    },
  },
});