import { useId } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "../../../shared/ui/button";

interface HomePromotionalBannerProps {
  title: string;
  subtitle: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "accent" | "gradient";
  className?: string;
}

const variantStyles = {
  primary:
    "bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/25",
  secondary:
    "bg-secondary/5 dark:bg-secondary/10 border border-secondary/15 dark:border-secondary/25",
  accent:
    "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/40",
  gradient:
    "bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0",
};

export function HomePromotionalBanner({
  title,
  subtitle,
  buttonLabel,
  onButtonClick,
  icon: Icon,
  variant = "primary",
  className = "",
}: HomePromotionalBannerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isGradient = variant === "gradient";

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${className}`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl px-6 py-8 sm:px-8 sm:py-10 ${variantStyles[variant]}`}
      >
        {/* Decorative elements */}
        {isGradient && (
          <>
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:32px_32px]" />
          </>
        )}

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  isGradient
                    ? "bg-white/20"
                    : "bg-primary/10 dark:bg-primary/20"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`h-6 w-6 ${
                    isGradient ? "text-primary-foreground" : "text-primary"
                  }`}
                />
              </div>
            )}
            <div>
              <h3
                id={titleId}
                className={`text-lg sm:text-xl font-bold ${
                  isGradient ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {title}
              </h3>
              <p
                id={descriptionId}
                className={`text-sm sm:text-base ${
                  isGradient
                    ? "text-primary-foreground/90"
                    : "text-muted-foreground"
                }`}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {buttonLabel && onButtonClick && (
            <Button
              size="lg"
              className={`rounded-xl flex-shrink-0 ${
                isGradient
                  ? "bg-white text-primary hover:bg-white/90 shadow-lg"
                  : "shadow-md"
              }`}
              onClick={onButtonClick}
            >
              {buttonLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
