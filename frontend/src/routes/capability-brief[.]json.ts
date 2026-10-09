import { createFileRoute } from "@tanstack/react-router";
import { getCapability } from "@/domain/capabilities/repository";
import { buildIntegrationBrief } from "@/domain/capabilities/brief";
import { readOnlyWriteHandlers } from "@/lib/machine-readable/read-only";
export const Route = createFileRoute("/capability-brief.json")({
  server: {
    handlers: {
      ...readOnlyWriteHandlers,
      GET: ({ request }) => {
        const capability = getCapability(new URL(request.url).searchParams.get("id") ?? "");
        return capability
          ? Response.json(buildIntegrationBrief(capability), {
              headers: { "cache-control": "public, max-age=300" },
            })
          : Response.json({ error: "Unknown capability ID" }, { status: 404 });
      },
    },
  },
});
