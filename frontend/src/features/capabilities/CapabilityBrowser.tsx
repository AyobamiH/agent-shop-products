import { Link } from "@tanstack/react-router";
import { capabilityProviders, listCapabilities } from "@/domain/capabilities/repository";
import { queryCapabilities } from "@/domain/capabilities/search";
import type { CapabilityQuery } from "@/domain/capabilities/types";

function pageHref(query: CapabilityQuery, page: number) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.kind) params.set("kind", query.kind);
  if (query.provider) params.set("provider", query.provider);
  if (page > 1) params.set("page", String(page));
  return `/capabilities${params.size ? `?${params}` : ""}`;
}

export function CapabilityBrowser({ query }: { query: CapabilityQuery }) {
  const result = queryCapabilities(listCapabilities(), query);
  const fieldClass = "mt-2 min-h-11 min-w-0 w-full rounded border border-border bg-background px-3 text-sm";
  return (
    <div className="mt-8">
      <form
        key={pageHref(query, 1)}
        method="get"
        action="/capabilities"
        className="grid items-end gap-4 rounded-lg border border-border p-5 md:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <div className="min-w-0">
          <label htmlFor="capability-query" className="text-sm">
            Search capability names
          </label>
          <input
            id="capability-query"
            name="q"
            type="search"
            maxLength={200}
            defaultValue={query.q ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="capability-kind" className="text-sm">
            Capability kind
          </label>
          <select
            id="capability-kind"
            name="kind"
            defaultValue={query.kind ?? ""}
            className={fieldClass}
          >
            <option value="">All kinds</option>
            <option value="skill">External skills</option>
            <option value="tool">Tools</option>
            <option value="control">Orchestration controls</option>
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="capability-provider" className="text-sm">
            Provider or namespace
          </label>
          <select
            id="capability-provider"
            name="provider"
            defaultValue={query.provider ?? ""}
            className={fieldClass}
          >
            <option value="">All providers</option>
            {capabilityProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="min-h-11 rounded bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Search
        </button>
      </form>
      <p
        data-testid="capability-count"
        role="status"
        className="mt-4 font-mono text-xs text-muted-foreground"
      >
        {result.total} matching capabilities · page {result.page} of {result.pageCount} ·{" "}
        {result.records.length} shown
      </p>
      {result.total === 0 ? (
        <p className="mt-8">
          No capabilities match.{" "}
          <Link to="/capabilities" className="text-primary underline">
            Clear filters
          </Link>
        </p>
      ) : (
        <ul className="mt-5 list-none divide-y divide-border rounded-lg border border-border">
          {result.records.map((entry) => (
            <li key={entry.id} className="p-4 sm:p-5" data-testid="capability-row">
              <div className="mb-2 flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
                <span>{entry.kind}</span>
                <span>{entry.provider}</span>
                <span>{entry.surfaces.join(" / ")}</span>
              </div>
              <Link
                to="/capabilities/$id"
                params={{ id: entry.id }}
                className="break-all font-mono text-sm font-medium text-primary hover:underline"
              >
                {entry.name}
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                {entry.integrationRequestAllowed
                  ? "Quote-first integration assessment"
                  : "Listed with an owner execution constraint"}
              </p>
            </li>
          ))}
        </ul>
      )}
      <nav
        aria-label="Capability pages"
        className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm"
      >
        {result.page > 1 ? (
          <a
            href={pageHref(query, result.page - 1)}
            className="inline-flex min-h-11 items-center text-primary underline"
          >
            Previous page
          </a>
        ) : (
          <span />
        )}
        <span>
          Page {result.page} of {result.pageCount}
        </span>
        {result.page < result.pageCount ? (
          <a
            href={pageHref(query, result.page + 1)}
            className="inline-flex min-h-11 items-center text-primary underline"
          >
            Next page
          </a>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
