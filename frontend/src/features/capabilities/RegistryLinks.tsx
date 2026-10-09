import { Link } from "@tanstack/react-router";
import { capabilityMeta } from "@/domain/capabilities/repository";
import { listCodingBugs } from "@/domain/coding-bugs/repository";

export function RegistryLinks() {
  return (
    <nav aria-label="Shop collections" className="mt-6 flex flex-wrap gap-3 text-sm">
      <Link
        to="/shop"
        className="rounded border border-border px-4 py-3 hover:bg-surface"
        activeProps={{ className: "border-primary text-primary" }}
      >
        Original prompts & skills
      </Link>
      <Link
        to="/capabilities"
        className="rounded border border-border px-4 py-3 hover:bg-surface"
        activeProps={{ className: "border-primary text-primary" }}
      >
        {capabilityMeta.count} skills, tools & controls
      </Link>
      <Link
        to="/integration-services"
        className="rounded border border-border px-4 py-3 hover:bg-surface"
        activeProps={{ className: "border-primary text-primary" }}
      >
        Scoped integration service
      </Link>
      <Link
        to="/coding-bugs"
        className="rounded border border-border px-4 py-3 hover:bg-surface"
        activeProps={{ className: "border-primary text-primary" }}
      >
        {listCodingBugs().length} coding bugs & failure modes
      </Link>
    </nav>
  );
}
