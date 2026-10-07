import { createFileRoute } from "@tanstack/react-router";
import { buildCatalogJson } from "@/lib/machine-readable/catalog";

export const Route = createFileRoute("/catalog.json")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(buildCatalogJson(), null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        }),
    },
  },
});