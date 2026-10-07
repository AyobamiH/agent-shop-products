import { Link } from "@tanstack/react-router";
import { IDENTITY_STATUS, PRODUCT_HEADLINE, SITE_DESCRIPTOR } from "@/lib/site";

const CATALOG_LINKS = [
  { to: "/agents", label: "Agent discovery" },
  { to: "/shop", label: "Capability catalogue" },
  { to: "/problems", label: "Problem index" },
  { to: "/knowledge", label: "Source-backed knowledge" },
] as const;

const MACHINE_LINKS = [
  { href: "/catalog.json", label: "/catalog.json" },
  { href: "/agents.txt", label: "/agents.txt" },
  { href: "/llms.txt", label: "/llms.txt" },
  { href: "/sitemap.xml", label: "/sitemap.xml" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold">{SITE_DESCRIPTOR}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {PRODUCT_HEADLINE} <span className="font-mono text-xs uppercase tracking-widest">{IDENTITY_STATUS}</span>.
          </p>
        </div>
        <FooterColumn title="Agent routes">
          {CATALOG_LINKS.map((link) => <li key={link.to}><Link to={link.to} className="text-muted-foreground hover:text-foreground">{link.label}</Link></li>)}
        </FooterColumn>
        <FooterColumn title="Machine discovery">
          {MACHINE_LINKS.map((link) => <li key={link.href}><a href={link.href} className="font-mono text-xs text-muted-foreground hover:text-foreground">{link.label}</a></li>)}
        </FooterColumn>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-6 font-mono text-xs text-muted-foreground sm:px-6">
          Source-backed metadata only. Full PROMPT.md and SKILL.md payload bodies, invented commerce data and unsupported claims are excluded.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</p><ul className="mt-3 space-y-2 text-sm">{children}</ul></div>;
}
