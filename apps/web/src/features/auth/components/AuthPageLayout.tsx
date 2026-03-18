import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../../shared/ui/logo";

interface AuthPageLayoutProps {
  /** "rtl" or "ltr" */
  direction: "rtl" | "ltr";
  /** Page heading */
  title: string;
  /** Short description below the heading */
  subtitle: string;
  /** Card content (forms, alerts, etc.) */
  children: ReactNode;
  /** Optional footer content rendered below the card */
  footer?: ReactNode;
}

/**
 * Shared visual shell used by every auth page (Login, Forgot-Password, etc.).
 *
 * Renders the centred container with logo, title, subtitle and the card
 * wrapper. Each page only needs to supply its unique inner content.
 */
export function AuthPageLayout({
  direction,
  title,
  subtitle,
  children,
  footer,
}: AuthPageLayoutProps) {
  return (
    <div
      dir={direction}
      className="min-h-content-70vh flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link
            to="/"
            className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:opacity-90 transition-opacity"
          >
            <Logo size="lg" className="mx-auto mb-3 sm:mb-4" />
          </Link>
          <h1 className="mb-2 text-2xl sm:text-3xl text-foreground">
            {title}
          </h1>
          <p className="px-4 text-sm sm:text-base text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}
