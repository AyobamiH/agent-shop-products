const SURFACES = [
  { href: "/catalog.json", label: "/catalog.json", description: "Canonical public catalogue projection for deterministic agent discovery." },
  { href: "/agents.txt", label: "/agents.txt", description: "Site-specific agent discovery map: routes, inventory, policy and future CLI boundary." },
  { href: "/llms.txt", label: "/llms.txt", description: "Convenience index for language-model consumers; not claimed as a universal protocol." },
] as const;

export function MachineSurfaces({ exampleSlug }: { exampleSlug?: string | undefined }) {
  return (
    <ul className="grid list-none gap-4 sm:grid-cols-2">
      {SURFACES.map((surface) => (
        <li key={surface.href} className="rounded-lg border border-border bg-surface p-5">
          <a href={surface.href} className="font-mono text-sm font-medium hover:underline">{surface.label}</a>
          <p className="mt-2 text-sm text-muted-foreground">{surface.description}</p>
        </li>
      ))}
      {exampleSlug ? (
        <li className="rounded-lg border border-border bg-surface p-5">
          <a href={`/raw/products/${exampleSlug}.md`} className="font-mono text-sm font-medium hover:underline">/raw/products/{"{slug}"}.md</a>
          <p className="mt-2 text-sm text-muted-foreground">Per-capability metadata: problem, outcomes, requirements, boundaries and source pointer.</p>
        </li>
      ) : null}
    </ul>
  );
}
