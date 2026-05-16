import { ChevronRight, Home } from "lucide-react";
import { cn } from "./utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  isRTL?: boolean;
  className?: string;
}

/**
 * Breadcrumb navigation for deep pages.
 * Provides a "where am I" cue for users who arrive via deep links.
 */
export function Breadcrumbs({
  items,
  isRTL = false,
  className,
}: BreadcrumbsProps) {
  const Separator = isRTL ? ChevronRight : ChevronRight;

  return (
    <nav
      aria-label={isRTL ? "مسار التنقل" : "Breadcrumb"}
      className={cn(
        "flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto dark:text-slate-300/85",
        className,
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <span
            key={`${item.label}-${index}`}
            className="flex items-center gap-1 whitespace-nowrap"
          >
            {index > 0 && (
              <Separator
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 dark:text-slate-500",
                  isRTL && "rotate-180",
                )}
                aria-hidden="true"
              />
            )}
            {isLast ? (
              <span
                className="font-medium text-foreground truncate max-w-[180px] dark:text-slate-100"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                aria-label={isFirst && !item.label ? "Home" : undefined}
                className="flex items-center gap-1 transition-colors hover:text-primary dark:hover:text-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
              >
                {isFirst && <Home className="h-3.5 w-3.5" />}
                <span>{item.label}</span>
              </button>
            ) : (
              <span className="flex items-center gap-1">
                {isFirst && <Home className="h-3.5 w-3.5" />}
                <span>{item.label}</span>
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
