import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact, neutral metadata chip. Meaning is carried by the text, never by
 * colour alone (docs/ARCHITECTURE.md — Accessibility).
 */
export function MetaChip({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}