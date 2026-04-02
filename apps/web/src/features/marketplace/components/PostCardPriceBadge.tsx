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
        "inline-flex items-end gap-1.5 rounded-full border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] px-3 py-1.5 text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur-xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0.68))]",
        className,
      )}
    >
      <span className="text-[1.08rem] font-semibold leading-none tracking-[-0.03em] sm:text-[1.18rem]">
        {price.toLocaleString(locale)}
      </span>
      <span className="pb-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {currency}
      </span>
    </div>
  );
}
