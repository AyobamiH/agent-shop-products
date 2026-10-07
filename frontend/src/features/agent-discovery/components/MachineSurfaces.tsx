const SURFACES = [
  {
    href: "/catalog.json",
    label: "/catalog.json",
    description: "Full catalogue projection with schema version and data policy.",
  },
  {
    href: "/llms.txt",
    label: "/llms.txt",
    description: "Plain-text orientation file: what this store is and what it publishes.",
  },
] as const;

export function MachineSurfaces({ exampleSlug }: { exampleSlug?: string | undefined }) {
  return (
    <ul className="grid list-none gap-4 sm:grid-cols-2">
      {SURFACES.map((surface) => (
        <li key={surface.href} className="rounded-lg border border-border bg-surface p-5">
          <a href={surface.href} className="font-mono text-sm font-medium hover:underline">
            {surface.label}
          </a>
          <p className="mt-2 text-sm text-muted-foreground">{surface.description}</p>
        </li>
      ))}
      {exampleSlug ? (
        <li className="rounded-lg border border-border bg-surface p-5">
          <a
            href={`/raw/products/${exampleSlug}.md`}
            className="font-mono text-sm font-medium hover:underline"
          >
            /raw/products/{"{slug}"}.md
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            One product as plain Markdown: problem, outcomes, requirements, boundaries.
          </p>
        </li>
      ) : null}
    </ul>
  );
}