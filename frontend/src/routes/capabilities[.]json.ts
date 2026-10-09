import { createFileRoute } from "@tanstack/react-router";
import { buildCapabilitiesJson } from "@/lib/machine-readable/capabilities";
export const Route = createFileRoute("/capabilities.json")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Response.json(buildCapabilitiesJson(new URL(request.url).searchParams), {
          headers: { "cache-control": "public, max-age=300" },
        }),
    },
  },
});
