import { cn } from "../../../shared/ui/utils";

interface PostCardPriceBadgeProps {
  price: number;
  currency: string;
  locale: string;
  className?: string;
  variant?: "badge" | "inline";
}

export function PostCardPriceBadge({
  price,
  currency,
  locale,
  className,
  variant = "badge",
}: PostCardPriceBadgeProps) {
  return (
    <div
      className={cn(
        variant === "inline"
          ? "inline-flex items-end gap-1.5 px-0 py-0 text-foreground"
          : "inline-flex items-end gap-1.5 rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.84))] px-3 py-1.5 text-black shadow-xl backdrop-blur-xl supports-backdrop-filter:bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.72))]",
        className,
      )}
    >
      <span
        className={cn(
          "leading-none tracking-[-0.03em]",
          variant === "inline"
            ? "text-xl font-bold sm:text-2xl"
            : "text-lg font-semibold sm:text-xl",
        )}
      >
        {price.toLocaleString(locale)}
      </span>
      <span
        className={cn(
          variant === "inline" ? "text-muted-foreground" : "text-slate-500",
          variant === "inline"
            ? "pb-0 text-sm font-bold tracking-[0.02em]"
            : "pb-0.5 text-xs font-semibold uppercase tracking-[0.14em]",
        )}
      >
        {currency}
      </span>
    </div>
  );
}
