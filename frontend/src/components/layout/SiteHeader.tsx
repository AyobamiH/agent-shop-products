import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IDENTITY_STATUS, SITE_DESCRIPTOR } from "@/lib/site";

const NAV_ITEMS = [
  { to: "/agents", label: "Agent discovery" },
  { to: "/shop", label: "Capabilities" },
  { to: "/problems", label: "Problems" },
  { to: "/knowledge", label: "Knowledge" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="text-sm font-semibold tracking-tight">{SITE_DESCRIPTOR}</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-muted-foreground sm:inline">{IDENTITY_STATUS}</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className="rounded px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>{item.label}</Link>
          ))}
        </nav>
        <button type="button" className="inline-flex size-9 items-center justify-center rounded border border-border md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      <nav id="mobile-nav" aria-label="Primary mobile" className={cn("border-t border-border md:hidden", open ? "block" : "hidden")}>
        <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          {NAV_ITEMS.map((item) => <li key={item.to}><Link to={item.to} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground" activeProps={{ className: "text-foreground font-medium" }}>{item.label}</Link></li>)}
        </ul>
      </nav>
    </header>
  );
}
