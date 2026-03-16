import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { Logo } from "./logo";
import { cn } from "./utils";

interface SubpageHeaderProps {
  onBack: () => void;
  isRTL?: boolean;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  onLogoClick?: () => void;
  logoDarkMode?: boolean;
  logoLabel?: string;
  rightContent?: ReactNode;
  className?: string;
  contentClassName?: string;
  sticky?: boolean;
}

export function SubpageHeader({
  onBack,
  isRTL = false,
  backLabel,
  title,
  subtitle,
  showLogo = true,
  onLogoClick,
  logoDarkMode = false,
  logoLabel,
  rightContent,
  className,
  contentClassName,
  sticky = true,
}: SubpageHeaderProps) {
  const resolvedLogoLabel =
    logoLabel || (isRTL ? "العودة إلى الرئيسية" : "Return to home");

  return (
    <header
      className={cn(
        "bg-background/90 backdrop-blur-md border-b border-border shadow-sm z-50 transition-all duration-300",
        sticky && "sticky top-0",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4",
          contentClassName,
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              onClick={onBack}
              className={cn(
                "hover:bg-primary/10 text-primary",
                "-ms-2",
              )}
              aria-label={backLabel || (isRTL ? "العودة" : "Back")}
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
              {backLabel ? (
                <span
                  className={cn("hidden sm:inline", "ms-2")}
                >
                  {backLabel}
                </span>
              ) : null}
            </Button>

            {showLogo ? (
              <>
                <div className="hidden sm:block w-px h-8 bg-border" />
                <button
                  type="button"
                  onClick={onLogoClick || onBack}
                  className="hidden sm:flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={resolvedLogoLabel}
                >
                  <Logo size="md" darkMode={logoDarkMode} />
                </button>
              </>
            ) : null}

            {title || subtitle ? (
              <div className="min-w-0">
                {title ? (
                  <h1 className="text-foreground truncate">{title}</h1>
                ) : null}
                {subtitle ? (
                  <p className="text-sm text-muted-foreground truncate">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {rightContent ? (
            <div className="flex items-center gap-2">{rightContent}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
