import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { capabilityMeta } from "@/domain/capabilities/repository";
import { validateCapabilityQuery } from "@/domain/capabilities/search";
import { CapabilityBrowser } from "@/features/capabilities/CapabilityBrowser";
import { RegistryLinks } from "@/features/capabilities/RegistryLinks";
import { buildPageHead } from "@/lib/seo/meta";

export const Route = createFileRoute("/capabilities")({
  validateSearch: validateCapabilityQuery,
  head: () =>
    buildPageHead({
      title: "Skills, tools & orchestration controls — Agent Shop",
      description:
        "Search every advertised skill, tool and orchestration control and prepare a quote-first original integration brief.",
      path: "/capabilities",
    }),
  component: CapabilityPage,
});

function CapabilityPage() {
  const query = Route.useSearch();
  const counts = capabilityMeta.counts;
  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow={`${capabilityMeta.count} external capability listings`}
        title="Skills, tools & orchestration controls"
        description={`${counts.uniqueSkills} external skills · ${counts.advertisedTools} tools · ${counts.orchestrationControls} orchestration controls. Inspect exact names and requirements, then request a quote for original integration work.`}
      />
      <RegistryLinks />
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Names were advertised in the {capabilityMeta.capturedOn} session snapshot. Availability and
        permissions require provider verification. Each listing includes an integration brief;
        provider access and third-party implementations are outside the offer.
      </p>
      <a
        href="/capabilities.json"
        className="mt-3 inline-block font-mono text-xs text-primary underline"
      >
        Full registry JSON
      </a>
      <CapabilityBrowser query={query} />
    </PageShell>
  );
}
