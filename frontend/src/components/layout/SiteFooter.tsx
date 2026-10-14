import { Link } from "@tanstack/react-router";
import { PRODUCT_HEADLINE, SITE_DESCRIPTOR } from "@/lib/site";

import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "@/lib/contact";

const CATALOG_LINKS = [
  { to: "/agents", label: "Agent discovery" },
  { to: "/shop", label: "Capability catalogue" },
  { to: "/solutions", label: "Problem-solving guides" },
  { to: "/problems", label: "Problem index" },
  { to: "/knowledge", label: "Source-backed knowledge" },
  { to: "/capabilities", label: "External capabilities" },
  { to: "/coding-bugs", label: "Agentic coding bugs" },
  { to: "/private-kits", label: "Private execution kits" },
  { to: "/integration-services", label: "Integration services" },
] as const;

const MACHINE_LINKS = [
  { href: "/catalog.json", label: "/catalog.json" },
  { href: "/agents.txt", label: "/agents.txt" },
  { href: "/llms.txt", label: "/llms.txt" },
  { href: "/sitemap.xml", label: "/sitemap.xml" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface/60">
      <div className="mx-auto grid max-w-[74rem] gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/agent-registry-mark.svg" alt="Agent Shop registry aperture mark" className="size-8" />
            <div>
              <p className="text-sm font-semibold">{SITE_DESCRIPTOR}</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{PRODUCT_HEADLINE}</p>
        </div>

        <FooterColumn title="Agent routes">
          {CATALOG_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="text-muted-foreground transition-colors hover:text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Machine discovery">
          {MACHINE_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary">
                {link.label}
              </a>
            </li>
          ))}
        </FooterColumn>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-[74rem] px-4 py-6 font-mono text-xs leading-relaxed text-muted-foreground sm:px-6">
          Explore prompts, skills, capability references and integration services for agent development.
        </p>
      </div>
      <nav aria-label="Legal information" className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 pb-6 text-sm sm:px-6">
        <a href="/legal/kit-terms" className="underline">Purchase terms</a>
        <a href="/legal/kit-licence" className="underline">Licence</a>
        <a href="/legal/kit-refunds" className="underline">Refunds</a>
        <a href="/legal/kit-privacy" className="underline">Purchase privacy</a>
        <a href="/privacy" className="underline">Website privacy</a>
        <button type="button" className="underline" onClick={() => window.dispatchEvent(new Event("agent-shop:analytics-settings"))}>Analytics settings</button>
      </nav>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-sm leading-relaxed text-muted-foreground sm:px-6">
        <p>Built by <a href="https://tailwaggingwebdesign.com/" className="underline underline-offset-4">TAIL WAGGING WEBSITES DESIGN FACTORY NORTHAMPTON</a>.</p>
        <p>Northampton, Northamptonshire, UK, NN4 6LZ · <a href="tel:+447402342694" className="underline underline-offset-4">07402342694</a></p>
        <p><a href={SUPPORT_EMAIL_HREF} className="break-all underline underline-offset-4">{SUPPORT_EMAIL}</a></p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  );
}
