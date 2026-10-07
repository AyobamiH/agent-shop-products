import { useId } from "react";
import { Search } from "lucide-react";

export function ProductSearch({
  value,
  onChange,
  label = "Search the catalogue",
  placeholder = "Describe the problem you need solved",
  describedById,
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  /** Id of the live result count so screen readers hear how many items matched. */
  describedById?: string;
}) {
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
          {...(describedById ? { "aria-describedby": describedById } : {})}
          className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>
    </div>
  );
}