import { createFileRoute } from "@tanstack/react-router";
import { buildCapabilitiesJson } from "@/lib/machine-readable/capabilities";
import { readOnlyWriteHandlers } from "@/lib/machine-readable/read-only";
export const Route = createFileRoute("/capabilities.json")({
  server: {
    handlers: {
      ...readOnlyWriteHandlers,
      GET: ({ request }) =>
        Response.json(buildCapabilitiesJson(new URL(request.url).searchParams), {
          headers: { "cache-control": "public, max-age=300" },
        }),
    },
  },
});
