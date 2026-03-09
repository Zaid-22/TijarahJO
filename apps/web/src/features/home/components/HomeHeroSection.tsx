import { ShoppingBag, TrendingUp, Shield, Zap } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Language } from "../../../types";

type HomeHeroSectionProps = {
  language: Language;
  isAuthenticated: boolean;
  t: Record<string, string>;
  isRTL: boolean;
  darkMode: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  setShowSellItem: (show: boolean) => void;
  onBrowseItems: () => void;
};

const HERO_FEATURES_EN = [
  { icon: Shield, label: "Trusted Sellers" },
  { icon: Zap, label: "Fast Deals" },
  { icon: TrendingUp, label: "Best Prices" },
];
const HERO_FEATURES_AR = [
  { icon: Shield, label: "بائعون موثوقون" },
  { icon: Zap, label: "صفقات سريعة" },
  { icon: TrendingUp, label: "أفضل الأسعار" },
];

export function HomeHeroSection({
  language,
  isAuthenticated,
  t,
  isRTL,
  darkMode: _darkMode,
  setShowLoginPrompt,
  setShowSellItem,
  onBrowseItems,
}: HomeHeroSectionProps) {
  const features = language === "ar" ? HERO_FEATURES_AR : HERO_FEATURES_EN;

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] dark:bg-primary/15" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px] dark:bg-secondary/15" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text Content */}
          <div
            className={`space-y-6 ${isRTL ? "lg:order-2 text-right" : "lg:order-1"}`}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 dark:bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20">
              <ShoppingBag className="h-4 w-4" />
              {language === "ar"
                ? "سوق الأردن الأول"
                : "Jordan's #1 Marketplace"}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl xl:text-6xl !leading-[1.15]">
              {language === "ar" ? (
                <>
                  اكتشف، تسوّق
                  <span className="text-primary"> وبيع </span>
                  بسهولة
                </>
              ) : (
                <>
                  Discover, Shop &<span className="text-primary"> Sell </span>
                  with Ease
                </>
              )}
            </h1>

            <p className="max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
              {language === "ar"
                ? "منصة موثوقة وسريعة لعرض منتجاتك والوصول للمشترين في كل المحافظات الأردنية."
                : "A trusted and fast platform to list your products and reach buyers across all of Jordan."}
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <span
                    key={feature.label}
                    className="inline-flex items-center gap-2 rounded-xl bg-card border border-border px-3.5 py-2 text-sm font-medium text-foreground shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {feature.label}
                  </span>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {isAuthenticated ? (
                <>
                  <Button
                    size="lg"
                    className="h-12 min-w-[11rem] rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                    onClick={() => setShowSellItem(true)}
                  >
                    {t.startSelling}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 min-w-[11rem] rounded-xl transition-all hover:-translate-y-0.5"
                    onClick={onBrowseItems}
                  >
                    {t.browseItems}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-12 min-w-[11rem] rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                    onClick={() => setShowLoginPrompt(true)}
                  >
                    {language === "ar" ? "ابدأ الآن" : "Get Started"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 min-w-[11rem] rounded-xl transition-all hover:-translate-y-0.5"
                    onClick={onBrowseItems}
                  >
                    {t.browseItems}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right: Stats / Visual Card */}
          <div className={`${isRTL ? "lg:order-1" : "lg:order-2"}`}>
            <div className="relative">
              {/* Main Card */}
              <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xl">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <StatCard
                    value={language === "ar" ? "+١٠ آلاف" : "10K+"}
                    label={language === "ar" ? "منتج نشط" : "Active Listings"}
                    gradient="from-blue-500 to-cyan-500"
                  />
                  <StatCard
                    value={language === "ar" ? "+٥ آلاف" : "5K+"}
                    label={language === "ar" ? "مستخدم سعيد" : "Happy Users"}
                    gradient="from-violet-500 to-purple-500"
                  />
                  <StatCard
                    value={language === "ar" ? "+١٢" : "12+"}
                    label={language === "ar" ? "محافظة" : "Governorates"}
                    gradient="from-emerald-500 to-green-500"
                  />
                  <StatCard
                    value={language === "ar" ? "+٢٠" : "20+"}
                    label={language === "ar" ? "فئة" : "Categories"}
                    gradient="from-amber-500 to-orange-500"
                  />
                </div>
              </div>

              {/* Decorative floating elements */}
              <div className="absolute -top-4 -right-4 h-20 w-20 rounded-2xl bg-primary/10 dark:bg-primary/20 blur-xl" />
              <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-2xl bg-secondary/15 dark:bg-secondary/25 blur-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  gradient,
}: {
  value: string;
  label: string;
  gradient: string;
}) {
  return (
    <div className="group rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 dark:from-muted/20 dark:to-muted/10 border border-border/50 p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div
        className={`mb-2 text-2xl sm:text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
      >
        {value}
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground font-medium">
        {label}
      </p>
    </div>
  );
}
