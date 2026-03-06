import type { ReactNode } from "react";
import { cn } from "./utils";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

type PageShellTone = "marketplace" | "account";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  tone?: PageShellTone;
}

const shellToneClass: Record<PageShellTone, string> = {
  marketplace:
    "bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950",
  account:
    "bg-gradient-to-b from-blue-50/60 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950",
};

export function PageShell({
  children,
  className,
  tone = "marketplace",
}: PageShellProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        "min-h-screen relative overflow-x-clip",
        shellToneClass[tone],
        className,
      )}
    >
      {/* Decorative blurs — skip for reduced-motion users to improve perf on lower-end devices */}
      {!prefersReducedMotion && (
        <>
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl will-change-transform" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl will-change-transform" />
        </>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
