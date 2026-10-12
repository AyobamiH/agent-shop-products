import { integrationPackages } from "@/domain/commercial/packages";

export function IntegrationPackages() {
  return (
    <section className="mt-16" aria-labelledby="original-packages">
      <h2 id="original-packages" className="text-xl font-semibold">
        Original integration packages
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Three private reference packages provide reusable code, tests and operating instructions for
        a scoped implementation. Their provider adapters and deployment are agreed per job. External
        tool access and licences remain separate.
      </p>
      <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-3">
        {integrationPackages.packages.map((item) => (
          <article key={item.id} className="min-w-0 rounded-lg border border-border bg-surface p-5">
            <h3 className="font-medium">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed">{item.summary}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {item.runtime} · Version {item.version}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.boundary}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Quote-first integration; no package checkout is active. Automated checks establish reference
        behaviour, not production provider acceptance.
      </p>
      <a
        href="/integration-packages.json"
        className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
      >
        Inspect package versions and archive digests
      </a>
    </section>
  );
}
