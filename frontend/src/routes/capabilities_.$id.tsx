import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { getCapability, capabilityMeta } from "@/domain/capabilities/repository";
import { IntegrationNotice } from "@/features/capabilities/IntegrationNotice";
import { buildPageHead } from "@/lib/seo/meta";

export const Route = createFileRoute("/capabilities_/$id")({
  loader: ({ params }) => {
    const capability = getCapability(params.id);
    if (!capability) throw notFound();
    return { capability };
  },
  head: ({ loaderData }) =>
    loaderData
      ? buildPageHead({
          title: `${loaderData.capability.name} — integration brief`,
          description: `Inspect ${loaderData.capability.kind} ${loaderData.capability.name} and request original integration work subject to provider feasibility and agreed scope.`,
          path: `/capabilities/${loaderData.capability.id}`,
          // Names-only third-party rows stay accessible, not search-indexed.
          indexable: false,
        })
      : { meta: [{ name: "robots", content: "noindex, nofollow" }] },
  component: CapabilityDetail,
});

function CapabilityDetail() {
  const { capability } = Route.useLoaderData();
  return (
    <PageShell>
      <Link to="/capabilities" className="text-sm text-primary underline">
        All skills, tools & controls
      </Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {capability.kind} · {capability.provider}
      </p>
      <h1 className="mt-3 break-all font-mono text-2xl font-semibold sm:text-3xl">
        {capability.name}
      </h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold">Capability record</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Stable ID</dt>
              <dd className="break-all font-mono text-xs">{capability.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Advertised surfaces</dt>
              <dd>{capability.surfaces.join(" / ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Captured on</dt>
              <dd>{capabilityMeta.capturedOn}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            {capabilityMeta.scope.runtimeRule}
          </p>
          {capability.kind === "control" ? (
            <p className="mt-4 text-sm">
              This is a host orchestration control. An original adapter needs target-runtime
              feasibility checks and independently granted host permissions.
            </p>
          ) : null}
          {capability.executionConstraint ? (
            <p className="mt-4 text-sm">Owner constraint: {capability.executionConstraint}</p>
          ) : null}
          <a
            href="https://github.com/AyobamiH/agent-shop-products/blob/main/catalog/capability-inventory.json"
            className="mt-5 inline-block text-xs text-primary underline"
          >
            Inspect the names-only source inventory
          </a>
        </section>
        <IntegrationNotice
          briefUrl={`/capability-brief.json?id=${encodeURIComponent(capability.id)}`}
          excluded={!capability.integrationRequestAllowed}
        />
      </div>
    </PageShell>
  );
}
