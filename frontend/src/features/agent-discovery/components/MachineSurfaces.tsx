const SURFACES = [
  {
    href: "/catalog.json",
    label: "/catalog.json",
    contentType: "application/json",
    description: "Canonical public catalogue projection for deterministic agent discovery.",
  },
  {
    href: "/agents.txt",
    label: "/agents.txt",
    contentType: "text/plain",
    description: "Site-specific agent discovery map: routes, inventory, policy and future CLI boundary.",
  },
  {
    href: "/llms.txt",
    label: "/llms.txt",
    contentType: "text/plain",
    description: "Convenience index for language-model consumers; not claimed as a universal protocol.",
  },
] as const;

export function MachineSurfaces({ exampleSlug }: { exampleSlug?: string | undefined }) {
  const surfaces = exampleSlug
    ? [
        ...SURFACES,
        {
          href: `/raw/products/${exampleSlug}.md`,
          label: "/raw/products/{slug}.md",
          contentType: "text/markdown",
          description:
            "Per-capability metadata: problem, outcomes, requirements, boundaries and source pointer.",
        },
      ]
    : SURFACES;

  return (
    <ul className="list-none divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {surfaces.map((surface) => (
        <li
          key={surface.href}
          className="grid gap-3 p-4 transition-colors hover:bg-primary/[0.025] sm:grid-cols-[4rem_minmax(0,1fr)_10rem] sm:items-center"
        >
          <span className="w-fit rounded-sm bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
            GET
          </span>
          <div className="min-w-0">
            <a
              href={surface.href}
              className="font-mono text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
            >
              {surface.label}
            </a>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{surface.description}</p>
          </div>
          <code className="font-mono text-[11px] text-muted-foreground sm:text-right">{surface.contentType}</code>
        </li>
      ))}
    </ul>
  );
}
