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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[74rem] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
          aria-label={`${SITE_DESCRIPTOR} home`}
        >
          <img
            src="/agent-registry-mark.svg"
            alt=""
            aria-hidden="true"
            width={30}
            height={30}
            className="size-7 shrink-0"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">{SITE_DESCRIPTOR}</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:block">
              {IDENTITY_STATUS}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden h-full items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="relative inline-flex h-full items-center px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className:
                  "text-foreground font-medium after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Primary mobile"
        className={cn("border-t border-border bg-background md:hidden", open ? "block" : "hidden")}
      >
        <ul className="mx-auto max-w-[74rem] px-4 py-2 sm:px-6">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center border-l-2 border-transparent px-3 text-sm text-muted-foreground"
                activeProps={{ className: "border-primary bg-primary/5 font-medium text-foreground" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
