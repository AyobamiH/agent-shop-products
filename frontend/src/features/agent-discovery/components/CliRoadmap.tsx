/**
 * Distinguishes the shipped offline request helper from planned shopping commands.
 */

const COMMANDS = [
  { command: 'shop search "problem description"', intent: "Find products by problem." },
  { command: "shop show <product-id>", intent: "Read full catalogue metadata for one product." },
  { command: "shop sample <product-id>", intent: "Inspect a bounded sample, not the full body." },
  { command: "shop buy <product-id>", intent: "Planned. No payment path exists today." },
  { command: "shop install <product-id>", intent: "Planned. No delivery path exists today." },
  { command: "shop update", intent: "Planned. Refresh installed items." },
] as const;

export function CliRoadmap() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border p-5" aria-labelledby="request-cli">
        <h3 id="request-cli" className="font-medium">
          Available now: prepare an integration request
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Validate selected capability names and write a private, bounded quote-request file. This
          command does not submit the request, purchase access or execute work.
        </p>
        <code className="mt-3 block break-all font-mono text-xs">
          node scripts/integration-request.mjs INPUT.json NEW_PRIVATE_OUTPUT.json
        </code>
        <a
          className="mt-3 inline-block text-sm text-primary underline underline-offset-4"
          href="https://github.com/AyobamiH/agent-shop-products/blob/main/docs/INTEGRATION_PACKAGES_20261012.md"
        >
          Read the input contract and package boundaries
        </a>
      </section>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Planned CLI commands and their intent</caption>
          <thead>
            <tr className="border-b border-border bg-surface">
              <th
                scope="col"
                className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground"
              >
                Command
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground"
              >
                Intent
              </th>
            </tr>
          </thead>
          <tbody>
            {COMMANDS.map((entry) => (
              <tr key={entry.command} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs">{entry.command}</td>
                <td className="px-4 py-3 text-muted-foreground">{entry.intent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
