import { acquisitionPolicy } from "@/domain/capabilities/repository";

export function IntegrationNotice({
  briefUrl,
  excluded = false,
}: {
  briefUrl?: string;
  excluded?: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">Original integration work</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Request a feasibility review and quote for an original adapter, workflow or configuration,
        with agreed instructions and acceptance evidence. You supply authorised provider access.
        Prices and delivery scope are agreed with {acquisitionPolicy.providerName}.
      </p>
      {excluded ? (
        <p className="mt-3 text-sm">
          An owner execution constraint excludes integration requests for this provider.
        </p>
      ) : (
        <a
          href={acquisitionPolicy.providerGuide}
          className="mt-4 inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Request an integration quote
        </a>
      )}
      {briefUrl ? (
        <a
          href={briefUrl}
          className="mt-3 block font-mono text-xs text-primary underline underline-offset-4"
        >
          Read the integration brief JSON
        </a>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Provider accounts, external implementations and host privileges are outside the offer. A
        request is subject to feasibility and acceptance; discovery establishes no purchase or
        installation.
      </p>
      <a
        href={acquisitionPolicy.providerCatalogue}
        className="mt-3 block text-xs underline underline-offset-4"
      >
        Check the provider’s live service contract
      </a>
    </section>
  );
}
