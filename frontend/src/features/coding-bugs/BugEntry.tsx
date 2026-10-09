import { Link } from "@tanstack/react-router";
import type { CodingBug } from "@/domain/coding-bugs/repository";
import { getProductById } from "@/domain/catalog/repository";

export function BugEntry({ bug }: { bug: CodingBug }) {
  const skill = getProductById(bug.skillId);
  const fields = [
    ["Trigger", bug.trigger],
    ["Symptom", bug.symptom],
    ["Root cause / qualification", bug.rootCause],
    ["Consequence", bug.consequence],
    ["Repair pattern", bug.repair],
    ["Regression check", bug.regressionCheck],
    ["Next acceptance", bug.nextAcceptance],
  ];
  return (
    <article
      id={bug.id}
      className="scroll-mt-24 rounded-lg border border-border bg-surface p-5"
      data-testid="coding-bug"
    >
      <p className="font-mono text-xs text-muted-foreground">
        {bug.id} · {bug.project} · {bug.category}
      </p>
      <h2 className="mt-3 text-lg font-semibold">
        <a href={`#${bug.id}`}>{bug.title}</a>
      </h2>
      <p className="mt-2 text-sm font-medium">{bug.status}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Evidence scope: {bug.evidence.scope}
      </p>
      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm text-primary">
          Inspect mechanism, repair and regression check
        </summary>
        <dl className="mt-3 space-y-4 text-sm leading-relaxed">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="font-medium">{label}</dt>
              <dd className="mt-1 text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {bug.evidence.id} · {bug.evidence.basis} · indexed {bug.indexedOn}
        </p>
        <a
          href={bug.evidence.sourceUrl}
          className="mt-3 inline-block text-sm text-primary underline"
        >
          Inspect supporting source
        </a>
        {skill ? (
          <Link
            to="/products/$slug"
            params={{ slug: skill.slug }}
            className="mt-3 block text-sm text-primary underline"
          >
            Related skill: {skill.name}
          </Link>
        ) : null}
      </details>
    </article>
  );
}
