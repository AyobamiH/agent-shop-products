import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { catalogMeta, listProducts } from "@/domain/catalog/repository";
import { CliRoadmap } from "@/features/agent-discovery/components/CliRoadmap";
import { MachineSurfaces } from "@/features/agent-discovery/components/MachineSurfaces";
import { buildCollectionPageJsonLd } from "@/lib/jsonld/site";
import { buildPageHead } from "@/lib/seo/meta";
import { absoluteUrl, SITE_DESCRIPTOR } from "@/lib/site";

const TITLE = `Agent discovery — ${SITE_DESCRIPTOR}`;
const DESCRIPTION =
  "Primary discovery documentation for autonomous agents: canonical catalogue endpoints, metadata routes, crawl policy and the future CLI contract.";

export const Route = createFileRoute("/agents")({
  head: () =>
    buildPageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/agents",
      jsonLd: [
        buildCollectionPageJsonLd({ path: "/agents", name: "Agent discovery", description: DESCRIPTION }),
      ],
      links: [
        { rel: "alternate", href: absoluteUrl("/catalog.json"), type: "application/json", title: "Canonical catalogue" },
        { rel: "alternate", href: absoluteUrl("/agents.txt"), type: "text/plain", title: "Agent discovery text" },
        { rel: "alternate", href: absoluteUrl("/llms.txt"), type: "text/plain", title: "LLM convenience index" },
      ],
    }),
  component: AgentsPage,
});

function AgentsPage() {
  const first = listProducts()[0];

  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow="Primary discovery route"
        title="Agent discovery"
        description={DESCRIPTION}
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Available now</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Schema {catalogMeta.schemaVersion}; {catalogMeta.productCount} source-backed capabilities. All listed endpoints are GET-only discovery surfaces.
        </p>
        <div className="mt-5">
          <MachineSurfaces exampleSlug={first?.slug} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Selection contract</h2>
        <ol className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>1. Search the catalogue by problem, category, tag or outcome.</li>
          <li>2. Inspect requirements and boundaries before selecting a capability.</li>
          <li>3. Use the metadata route for deterministic machine consumption.</li>
          <li>4. Treat source pointers as provenance, not permission to expose full payload bodies.</li>
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Future CLI contract</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Documented roadmap only. The website does not execute purchase, installation or update commands.
        </p>
        <div className="mt-5">
          <CliRoadmap />
        </div>
      </section>

      <section className="mt-14 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">Public-data boundary</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>No invented prices, ratings, reviews, compatibility, evidence levels or adoption claims.</li>
          <li>No full PROMPT.md or SKILL.md payload bodies.</li>
          <li>No MCP server or manifest: this product remains CLI-first.</li>
        </ul>
      </section>
    </PageShell>
  );
}
