import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { catalogMeta, listProducts } from "@/domain/catalog/repository";
import { CliRoadmap } from "@/features/agent-discovery/components/CliRoadmap";
import { MachineSurfaces } from "@/features/agent-discovery/components/MachineSurfaces";
import { buildMeta } from "@/lib/seo/meta";
import { SITE_DESCRIPTOR } from "@/lib/site";

const TITLE = `Agent access — ${SITE_DESCRIPTOR}`;
const DESCRIPTION =
  "Machine-readable catalogue surfaces and the planned CLI interface for agents. CLI-first; MCP is out of scope.";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: buildMeta({ title: TITLE, description: DESCRIPTION }) }),
  component: AgentsPage,
});

function AgentsPage() {
  const first = listProducts()[0];

  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow="For machine consumers"
        title="Agent access"
        description={DESCRIPTION}
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Available today</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Schema version {catalogMeta.schemaVersion}, {catalogMeta.productCount} products.
        </p>
        <div className="mt-5">
          <MachineSurfaces exampleSlug={first?.slug} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Planned CLI</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Documented, not implemented. No command runs from this site and there is no purchase,
          checkout or installation path in this phase.
        </p>
        <div className="mt-5">
          <CliRoadmap />
        </div>
      </section>

      <section className="mt-14 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">What is not published</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>Prices, ratings, reviews and sales figures — no authoritative record exists.</li>
          <li>Full raw prompt bodies — only bounded catalogue metadata is exposed.</li>
          <li>MCP servers or manifests — the agent interface direction is CLI-first.</li>
        </ul>
      </section>
    </PageShell>
  );
}