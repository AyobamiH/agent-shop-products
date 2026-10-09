import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { COMMERCIAL_PATHS, SOLUTION_TRACKS } from "@/domain/commercial/decision";
import { getProductBySlug } from "@/domain/catalog/repository";
import { buildCollectionPageJsonLd } from "@/lib/jsonld/site";
import { buildPageHead } from "@/lib/seo/meta";

const TITLE = "Agent workflow problems: verify, integrate, recover or subcontract";
const DESCRIPTION =
  "Choose an evidence-backed path when a coding agent gets stuck: verify results, fix integration authority, recover duplicate jobs or scope human help.";

export const Route = createFileRoute("/solutions")({
  head: () =>
    buildPageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/solutions",
      jsonLd: [
        buildCollectionPageJsonLd({
          path: "/solutions",
          name: "Agent workflow problem-solving paths",
          description: DESCRIPTION,
        }),
      ],
    }),
  component: SolutionsPage,
});

function SolutionsPage() {
  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow="Problems before products"
        title="When an agent gets stuck, choose the smallest provable next step"
        description={DESCRIPTION}
      />
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        This guide connects recognisable failure modes to original, public source-backed
        capabilities. They help you frame and inspect work; they do not grant provider permission,
        prove a deployment or automatically repair a customer's system.
      </p>
      <nav aria-label="Choose an agent workflow problem" className="mt-8">
        <ul className="flex list-none flex-wrap gap-2">
          {SOLUTION_TRACKS.map((track) => (
            <li key={track.id}>
              <a
                href={"#" + track.id}
                className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-primary/40"
              >
                {track.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 space-y-12">
        {SOLUTION_TRACKS.map((track) => (
          <section
            key={track.id}
            id={track.id}
            aria-labelledby={track.id + "-heading"}
            className="scroll-mt-24 border-t border-border pt-10"
          >
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {track.audience}
            </p>
            <h2 id={track.id + "-heading"} className="mt-2 max-w-3xl text-2xl font-semibold">
              {track.title}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7">{track.symptom}</p>
            <div className="mt-7 grid gap-7 lg:grid-cols-2">
              <div>
                <h3 className="font-semibold">What to check before buying or delegating</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {track.checks.map((check) => <li key={check}>{check}</li>)}
                </ol>
                <p className="mt-5 rounded-md border border-border bg-surface p-4 text-sm leading-relaxed">
                  <strong>One scoping question:</strong> {track.scopingQuestion}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-6">
                <h3 className="font-semibold">Inspect the relevant public capabilities</h3>
                <ul className="mt-4 list-none space-y-4">
                  {track.productSlugs.map((slug) => {
                    const product = getProductBySlug(slug);
                    if (!product) return null;
                    return (
                      <li key={product.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                        <Link
                          to="/products/$slug"
                          params={{ slug: product.slug }}
                          className="text-sm font-medium text-primary underline underline-offset-4"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {product.problem}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to="/integration-services"
                  className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
                >
                  Need hands-on help? Scope an independent implementation quote
                </Link>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 border-t border-border pt-12" aria-labelledby="commercial-choice">
        <h2 id="commercial-choice" className="text-2xl font-semibold">
          Public guidance, premium kits or professional help?
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The public catalogue is available to inspect, but access to public files is not a paid
          licence or permission to resell them. Enhanced private execution kits and curated bundles
          are a planned, separate commercial offering, not products with active prices or checkout.
          Professional integration can be discussed through the independently operated quote-first
          service. No payment or repository authority is conferred by this page.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {COMMERCIAL_PATHS.map((path) => (
            <article key={path.id} className="rounded-lg border border-border bg-surface p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {path.availability === "available_reference"
                  ? "Publicly inspectable"
                  : path.availability === "quote_first"
                    ? "Scoped quote before work"
                    : "Not currently for sale"}
              </p>
              <h3 className="mt-2 font-semibold">{path.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {path.description}
              </p>
              {"actionPath" in path && "actionLabel" in path ? (
                <Link
                  to={path.actionPath}
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
                >
                  {path.actionLabel}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      <p className="mt-12 text-xs leading-relaxed text-muted-foreground">
        Published capability names describe workflows and their limits, not independent evidence
        that the relevant provider is connected or a tool can execute for your account. No
        compatibility, customer result, licence, price or future launch date is guaranteed.
      </p>
    </PageShell>
  );
}
