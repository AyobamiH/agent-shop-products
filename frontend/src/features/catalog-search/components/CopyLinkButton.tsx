import { useCallback, useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";

const IDLE_LABEL = "Copy link";
const DONE_LABEL = "Link copied";

/**
 * Copies the current URL, including every active filter, so a browse state can
 * be shared verbatim. Falls back to a manual selection prompt when the
 * clipboard API is unavailable (non-secure contexts).
 */
export function CopyLinkButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      data-testid="copy-link"
      aria-label={`${IDLE_LABEL} to these filtered results`}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Link2 aria-hidden="true" className="size-4" />
      )}
      <span>{copied ? DONE_LABEL : IDLE_LABEL}</span>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </button>
  );
}