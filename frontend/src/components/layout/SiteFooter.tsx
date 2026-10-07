import { Link } from "@tanstack/react-router";
import { IDENTITY_STATUS, PRODUCT_HEADLINE, SITE_DESCRIPTOR } from "@/lib/site";

const CATALOG_LINKS = [
  { to: "/shop", label: "Shop" },
  { to: "/problems", label: "Browse by problem" },
  { to: "/knowledge", label: "Knowledge" },
] as const;

const MACHINE_LINKS = [
  { href: "/catalog.json", label: "/catalog.json" },
  { href: "/llms.txt", label: "/llms.txt" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold">{SITE_DESCRIPTOR}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {PRODUCT_HEADLINE}{" "}
            <span className="font-mono text-xs uppercase tracking-widest">{IDENTITY_STATUS}</span> —
            the final brand identity has not been decided.
          </p>
        </div>

        <FooterColumn title="Catalogue">
          {CATALOG_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Machine access">
          <li>
            <Link to="/agents" className="text-muted-foreground hover:text-foreground">
              Agent access
            </Link>
          </li>
          {MACHINE_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-6 font-mono text-xs text-muted-foreground sm:px-6">
          Product descriptions derive from a source-backed catalogue. No ratings, reviews, sales
          figures or pricing are published, because none are authoritatively available.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  );
}