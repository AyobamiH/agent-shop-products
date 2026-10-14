export function EvidenceChecklist() {
  return (
    <section
      aria-labelledby="accept-agent-work"
      className="mt-12 rounded-lg border border-border bg-surface p-6"
    >
      <h2 id="accept-agent-work" className="text-xl font-semibold">
        How to verify an AI-generated pull request before accepting the work
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7">
        Start with one reproducible failure, not the agent's completion summary. For example, a
        webhook retry should not create a second entitlement. Define the input and the expected
        durable result before requesting a patch. This is a scoping example, not a customer case
        study.
      </p>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li>
          <strong>Reproduce:</strong> record a red regression test or a read-only observation
          against the affected revision, without exposing customer payloads.
        </li>
        <li>
          <strong>Review:</strong> inspect the exact changed files, allowed effects and exclusions.
          A green test on a different commit is not acceptance.
        </li>
        <li>
          <strong>Verify:</strong> run the regression and relevant existing tests on the proposed
          head. Check replay, failure and recovery behaviour, not only the happy path.
        </li>
        <li>
          <strong>Read back:</strong> when a deployment is separately authorised, match the live
          revision and check the observable result. Keep deployment and a successful customer
          outcome as separate claims.
        </li>
      </ol>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed">
        The handoff should identify the revision, commands, results, remaining limits and rollback
        action. Credentials and private receipts belong in the authorised workspace, not in a public
        issue or analytics event.
      </p>
      <div className="mt-5 flex flex-wrap gap-5 text-sm">
        <a
          className="text-primary underline underline-offset-4"
          href="/products/evidence-first-live-diagnostic-repair"
        >
          Inspect the evidence-first diagnostic procedure
        </a>
        <a className="text-primary underline underline-offset-4" href="/integration-services">
          Scope a repository repair with acceptance evidence
        </a>
        <a className="text-primary underline underline-offset-4" href="/private-kits">
          Compare private reference tests with public guidance
        </a>
      </div>
    </section>
  );
}
