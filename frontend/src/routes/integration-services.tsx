import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import {
  SUBCONTRACTING_PROVIDER_NAME,
  SUBCONTRACTING_SERVICE_CATALOGUE,
  SUBCONTRACTING_SERVICE_GUIDE,
} from "@/features/agent-discovery/subcontracting-source";
import { buildPageHead } from "@/lib/seo/meta";
import { absoluteUrl } from "@/lib/site";

const TITLE = "Agent workflow integration and repository fixes — Agent Shop";
const DESCRIPTION =
  "Need a workflow installed or a repository issue repaired? Inspect public skills, then request a scoped quote from the independent implementation provider.";
const TRACKED_PROVIDER_GUIDE =
  SUBCONTRACTING_SERVICE_GUIDE +
  "?utm_source=agent_shop&utm_medium=referral&utm_campaign=integration_services";

export const Route = createFileRoute("/integration-services")({
  head: () =>
    buildPageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/integration-services",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Scoped agent workflow integration and technical implementation",
          description: DESCRIPTION,
          url: absoluteUrl("/integration-services"),
          provider: {
            "@type": "Organization",
            name: SUBCONTRACTING_PROVIDER_NAME,
            url: "https://tailwaggingwebdesign.com/",
          },
        },
      ],
    }),
  component: IntegrationServicesPage,
});

const scopes = [
  {
    title: "A small repository fix",
    body: "Define one reproducible fault, the target repository and the evidence needed for a reviewable patch or report.",
  },
  {
    title: "A bounded agent workflow",
    body: "Specify the trigger, allowed actions, integrations and recovery behaviour. Actual provider access requires separate authority.",
  },
  {
    title: "A technical audit or verification handoff",
    body: "Agree an observable question, inspection scope and report. A check cannot guarantee a particular result.",
  },
] as const;

function IntegrationServicesPage() {
  return (
    <PageShell>
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/shop" className="hover:underline">
          Catalogue
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Integration services</span>
      </nav>

      <div className="mt-8 max-w-3xl">
        <SectionHeading
          as="h1"
          eyebrow="Quote-first implementation"
          title="When an agent workflow needs an experienced implementer"
          description="Finding a skill or tool name is not the same as being able to install it safely, use a provider account or finish an integration. Bring the actual problem and agree the work before paying."
        />
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Agent Shop lists original public procedures and externally advertised capabilities.
          Implementation is a separate paid service, scoped and delivered by{" "}
          {SUBCONTRACTING_PROVIDER_NAME}. This page does not sell a licence, grant access to a tool
          or create an accepted job.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={TRACKED_PROVIDER_GUIDE}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            Request a scoped integration quote
          </a>
          <a
            href={SUBCONTRACTING_SERVICE_CATALOGUE}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-surface"
          >
            Inspect the live service contract
          </a>
        </div>
      </div>

      <section className="mt-16" aria-labelledby="example-scopes">
        <h2 id="example-scopes" className="text-xl font-semibold">
          Examples of work worth scoping
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {scopes.map((scope) => (
            <div key={scope.title} className="rounded-lg border border-border bg-surface p-5">
              <h3 className="font-medium">{scope.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{scope.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          These are examples for a feasibility discussion, not pre-approved fixed-price packages.
          The provider's current service catalogue governs available scopes.
        </p>
      </section>

      <section className="mt-16 grid gap-9 border-t border-border pt-12 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">What happens after an enquiry?</h2>
          <ol className="mt-5 space-y-4 text-sm leading-relaxed">
            <li>
              <strong>1. Describe the result.</strong> Share a bounded outcome, a public URL where
              appropriate and the constraints that matter.
            </li>
            <li>
              <strong>2. Review feasibility.</strong> The provider checks prerequisites, authority
              and the smallest credible scope.
            </li>
            <li>
              <strong>3. Agree price and terms.</strong> Custom work is quoted before payment or
              implementation. There is no invented universal kit price.
            </li>
            <li>
              <strong>4. Inspect the deliverable.</strong> Tests, a reviewable patch, documentation
              or an evidence report are agreed for that job and verified separately from payment.
            </li>
          </ol>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold">Prepare a useful request</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>The exact task an agent cannot complete reliably</li>
            <li>Your intended outcome and one acceptance test</li>
            <li>Any public repository or website URL, only if appropriate</li>
            <li>Provider or environment constraints; no credentials in the enquiry</li>
            <li>Whether a reviewable pull request, patch or report is needed</li>
          </ul>
        </div>
      </section>

      <section
        className="mt-16 border-t border-border pt-12"
        aria-labelledby="commercial-boundaries"
      >
        <h2 id="commercial-boundaries" className="text-xl font-semibold">
          Public reference versus paid implementation
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Existing public catalogue records can be inspected without buying anything here. Public
          visibility does not itself grant redistribution or resale rights. Private execution kits,
          paid digital licences, automated checkout and CLI installation are not yet offered by
          Agent Shop. A paid service is for separately agreed implementation and evidence, not a
          copy of a publicly accessible instruction file.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          A work-order receipt is not acceptance, repository access, payment or completed delivery.
          Third-party providers remain independently controlled. No deployment, merge, purchase or
          privileged connection is authorised merely by discovering a capability.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-5 text-sm">
          <Link to="/shop" className="text-primary underline underline-offset-4">
            Browse original public procedures
          </Link>
          <Link to="/capabilities" className="text-primary underline underline-offset-4">
            Inspect advertised external tools
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
