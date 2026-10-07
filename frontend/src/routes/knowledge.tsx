import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { buildKnowledgeTopics } from "@/domain/knowledge/topics";
import { buildMeta } from "@/lib/seo/meta";
import { SITE_DESCRIPTOR } from "@/lib/site";

const TITLE = `Knowledge — ${SITE_DESCRIPTOR}`;
const DESCRIPTION =
  "Problem statements and stated limitations, derived directly from catalogue records. No authored marketing articles.";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: buildMeta({ title: TITLE, description: DESCRIPTION }) }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const topics = buildKnowledgeTopics();

  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow="Knowledge"
        title="What these systems fix, and where they stop"
        description={DESCRIPTION}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {topics.map((topic) => (
          <article key={topic.id} className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">{topic.label}</h2>

            <h3 className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Problems addressed
            </h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed">
              {topic.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>

            <h3 className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Stated limitations
            </h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {topic.boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>

            <ul className="mt-5 flex list-none flex-wrap gap-2 border-t border-border pt-4">
              {topic.products.map((product) => (
                <li key={product.id}>
                  <Link
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    {product.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </PageShell>
  );
}