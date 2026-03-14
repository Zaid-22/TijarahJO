import { MapPin, ShoppingBag, Eye, Star } from "lucide-react";
import type { Language } from "../../../types";
import { api } from "../../../services/api";
import type { TopSeller } from "../../../services/api/sellers";
import { useServerQuery } from "../../../shared/hooks/useServerQuery";

type HomeTopSellersSectionProps = {
  language: Language;
  onSellerClick?: (sellerId: string) => void;
};

export function HomeTopSellersSection({
  language,
  onSellerClick,
}: HomeTopSellersSectionProps) {
  const { data: sellers = [], isLoading } = useServerQuery<TopSeller[]>({
    key: "top-sellers",
    queryFn: () => api.sellers.getTopSellers(6),
    tags: ["sellers"],
    staleTimeMs: 5 * 60_000,
  });

  if (isLoading || sellers.length === 0) {
    return null;
  }

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-4">
          <Star className="h-4 w-4" />
          {language === "ar" ? "بائعون مميزون" : "Top Sellers"}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {language === "ar"
            ? "أفضل البائعين"
            : "Best Sellers on TijarahJO"}
        </h2>
        <p className="text-muted-foreground">
          {language === "ar"
            ? "بائعون موثوقون بأعلى المبيعات"
            : "Trusted sellers with the highest sales"}
        </p>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
        {sellers.map((seller, index) => {
          const delayClass = [
            "animate-delay-[0ms]", "animate-delay-[80ms]", "animate-delay-[160ms]", 
            "animate-delay-[240ms]", "animate-delay-[320ms]", "animate-delay-[400ms]", 
            "animate-delay-[480ms]", "animate-delay-[560ms]", "animate-delay-[640ms]", 
            "animate-delay-[720ms]", "animate-delay-[800ms]"
          ][Math.min(index, 10)];

          return (
            <button
              key={seller.id}
              type="button"
              onClick={() => onSellerClick?.(seller.id)}
              className={`group flex flex-col items-center p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up ${delayClass}`}
            >
            {/* Avatar */}
            <div className="relative mb-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-primary/40 transition-colors">
                {seller.avatar ? (
                  <img
                    src={seller.avatar}
                    alt={seller.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-xl">
                    {seller.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Rank badge for top 3 */}
              {index < 3 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {index + 1}
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="font-semibold text-sm text-foreground text-center line-clamp-1 mb-1 group-hover:text-primary transition-colors">
              {seller.name}
            </h3>

            {/* City */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{seller.city}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1" title={language === "ar" ? "إعلانات نشطة" : "Active listings"}>
                <ShoppingBag className="h-3 w-3 text-primary" />
                <span>{seller.activeListingsCount}</span>
              </div>
              <div className="flex items-center gap-1" title={language === "ar" ? "مشاهدات" : "Total views"}>
                <Eye className="h-3 w-3 text-primary" />
                <span>{seller.totalViews}</span>
              </div>
            </div>
          </button>
        );
      })}
      </div>
    </section>
  );
}
