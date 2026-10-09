import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { codingBugIndex, listCodingBugs } from "@/domain/coding-bugs/repository";
import { BugEntry } from "@/features/coding-bugs/BugEntry";
import { RegistryLinks } from "@/features/capabilities/RegistryLinks";
import { buildPageHead } from "@/lib/seo/meta";

export const Route = createFileRoute("/coding-bugs")({
  validateSearch: (raw: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof raw["q"] === "string" ? raw["q"].trim().slice(0, 200) || undefined : undefined,
  }),
  head: () =>
    buildPageHead({
      title: "Agentic coding bug index — Agent Shop",
      description:
        "Documented agentic coding bugs and failure modes, with qualified evidence, repair patterns and regression checks.",
      path: "/coding-bugs",
    }),
  component: CodingBugsPage,
});

function CodingBugsPage() {
  const { q = "" } = Route.useSearch();
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const bugs = listCodingBugs().filter((b) =>
    tokens.every((t) =>
      `${b.id} ${b.title} ${b.project} ${b.category} ${b.symptom} ${b.rootCause} ${b.repair} ${b.status}`
        .toLowerCase()
        .includes(t),
    ),
  );
  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow={`${listCodingBugs().length} indexed bugs & failure modes`}
        title="Agentic coding bug index"
        description={codingBugIndex.scope}
      />
      <RegistryLinks />
      <form method="get" action="/coding-bugs" className="mt-8 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm">
          Search bugs and repair patterns
          <input
            name="q"
            type="search"
            maxLength={200}
            defaultValue={q}
            className="mt-2 min-h-11 w-full rounded border border-border bg-background px-3"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded bg-primary px-5 text-sm text-primary-foreground"
        >
          Search
        </button>
      </form>
      <p role="status" className="mt-4 font-mono text-xs text-muted-foreground">
        {bugs.length} of {listCodingBugs().length} records
      </p>
      <a
        href="/coding-bugs.json"
        className="mt-3 inline-block font-mono text-xs text-primary underline"
      >
        Bug and evidence index JSON
      </a>
      <div className="mt-6 space-y-5">
        {bugs.map((bug) => (
          <BugEntry key={bug.id} bug={bug} />
        ))}
      </div>
      {bugs.length === 0 ? <p className="mt-8">No matching records. Broaden the search.</p> : null}
    </PageShell>
  );
}
