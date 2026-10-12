import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageHead } from "@/lib/seo/meta";
import { getPolicy, policies, POLICY_VERSION } from "@/domain/commerce/policies";

export const Route = createFileRoute("/legal/$document")({
  loader: ({ params }) => {
    const policy = getPolicy(params.document);
    if (!policy) throw notFound();
    return policy;
  },
  head: ({ params }) => buildPageHead({
    title: (getPolicy(params.document)?.title ?? "Document not found") + " — Agent Shop",
    description: "Versioned private-kit buyer information, licence, refunds and privacy.",
    path: "/legal/" + params.document,
    indexable: !!getPolicy(params.document),
  }),
  component: PolicyPage,
});

function PolicyPage() {
  const policy = Route.useLoaderData();
  return (
    <PageShell>
      <article className="max-w-3xl">
        <a href="/private-kits" className="text-sm underline underline-offset-4">Private execution kits</a>
        <h1 className="mt-8 text-3xl font-semibold">{policy.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Version {POLICY_VERSION}</p>
        <p className="mt-4 text-sm">Save or print this page for your records.</p>
        {policy.sections.map(([heading, body]) => (
          <section key={heading} className="mt-8">
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </section>
        ))}
        <nav aria-label="Buyer information" className="mt-10 flex flex-wrap gap-5 text-sm">
          {Object.entries(policies).map(([slug, item]) => <a key={slug} href={"/legal/" + slug} className="underline">{item.title}</a>)}
        </nav>
      </article>
    </PageShell>
  );
}
