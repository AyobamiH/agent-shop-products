import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-[74rem] px-4 py-12 sm:px-6 sm:py-16", className)}>{children}</div>
  );
}