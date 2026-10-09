import { createFileRoute } from "@tanstack/react-router";
import { getCapability } from "@/domain/capabilities/repository";
import { buildIntegrationBrief } from "@/domain/capabilities/brief";
export const Route = createFileRoute("/capability-brief.json")({
  server: {
    handlers: {
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
