import { createFileRoute } from "@tanstack/react-router";
import { integrationPackages } from "@/domain/commercial/packages";
import { readOnlyWriteHandlers } from "@/lib/machine-readable/read-only";

export const Route = createFileRoute("/integration-packages.json")({
  server: {
    handlers: {
      ...readOnlyWriteHandlers,
      GET: () =>
        Response.json(integrationPackages, {
          headers: { "cache-control": "public, max-age=300" },
        }),
    },
  },
});
