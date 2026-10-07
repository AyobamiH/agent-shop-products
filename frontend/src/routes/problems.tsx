import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { buildProblemIndex } from "@/domain/catalog/problems";
import { listProducts } from "@/domain/catalog/repository";
import { buildItemListJsonLd } from "@/lib/jsonld/product";
import { buildCollectionPageJsonLd } from "@/lib/jsonld/site";
import { buildPageHead } from "@/lib/seo/meta";
import { SITE_DESCRIPTOR } from "@/lib/site";

const TITLE = `Problem discovery — ${SITE_DESCRIPTOR}`;
const DESCRIPTION =
  "Agent-oriented problem index. Match an observed failure mode to source-backed capabilities and inspect boundaries before selection.";

export const Route = createFileRoute("/problems")({
  head: () =>
    buildPageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/problems",
      jsonLd: [
        buildCollectionPageJsonLd({ path: "/problems", name: "Problem discovery", description: DESCRIPTION }),
        buildItemListJsonLd(listProducts(), "Capabilities indexed by problem"),
      ],
    }),
  component: ProblemsPage,
});

function ProblemsPage() {
  const groups = buildProblemIndex();

  return (
    <PageShell>
      <SectionHeading as="h1" eyebrow="Problem-first routing" title="Discover by problem" description={DESCRIPTION} />
      <div className="mt-10 space-y-12">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{group.label}</h2>
            <ul className="mt-4 list-none space-y-3">
              {group.entries.map((entry) => (
                <li key={entry.product.id} className="rounded-lg border border-border bg-surface p-5">
                  <p className="text-sm leading-relaxed">{entry.problem}</p>
                  <Link to="/products/$slug" params={{ slug: entry.product.slug }} className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
                    Inspect {entry.product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
