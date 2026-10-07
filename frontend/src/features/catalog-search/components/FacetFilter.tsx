import type { Facet } from "@/domain/catalog/facets";
import { cn } from "@/lib/utils";

/**
 * Single-select or multi-select facet chips. Counts come from the visible
 * result set so a chip never advertises results that do not exist.
 */
export function FacetFilter({
  legend,
  facets,
  selected,
  onToggle,
}: {
  legend: string;
  facets: readonly Facet[];
  selected: readonly string[];
  onToggle: (value: string) => void;
}) {
  if (facets.length === 0) return null;

  return (
    <fieldset>
      <legend className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {legend}
      </legend>
      <div role="group" aria-label={legend} className="flex flex-wrap gap-1.5">
        {facets.map((facet) => {
          const pressed = selected.includes(facet.value);
          return (
            <button
              key={facet.value}
              type="button"
              aria-pressed={pressed}
              aria-label={`${legend}: ${facet.label}, ${facet.count} products`}
              onClick={() => onToggle(facet.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                pressed
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {facet.label}
              <span className="ml-1.5 font-mono text-[10px] opacity-70">{facet.count}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}