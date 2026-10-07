/**
 * Documents the planned CLI (DEC-001). Nothing here executes: no command is
 * simulated and no purchase path exists in this phase.
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
  );
}