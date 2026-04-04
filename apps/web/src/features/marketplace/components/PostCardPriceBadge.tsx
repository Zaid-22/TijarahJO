import { cn } from "../../../shared/ui/utils";

interface PostCardPriceBadgeProps {
  price: number;
  currency: string;
  locale: string;
  className?: string;
}

export function PostCardPriceBadge({
  price,
  currency,
  locale,
  className,
}: PostCardPriceBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-end gap-1.5 rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.84))] px-3 py-1.5 text-slate-950 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.72))]",
        className,
      )}
    >
      <span className="text-lg font-semibold leading-none tracking-[-0.03em] sm:text-xl">
        {price.toLocaleString(locale)}
      </span>
      <span className="pb-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {currency}
      </span>
    </div>
  );
}
