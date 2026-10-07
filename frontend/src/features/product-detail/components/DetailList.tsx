export function DetailList({
  title,
  items,
  description,
}: {
  title: string;
  items: readonly string[];
  description?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              aria-hidden="true"
              className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}