import { User } from "lucide-react";
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

export function HomeHeroSection({
  language,
  isAuthenticated,
  t,
  isRTL,
  darkMode,
  setShowLoginPrompt,
  setShowSellItem,
  onBrowseItems,
}: HomeHeroSectionProps) {
  const heroGradientClassName = darkMode
    ? "bg-gradient-to-br from-[#0A4ABF] to-[#1a5fd9]"
    : "bg-gradient-to-br from-[#0A4ABF] to-[#3E7EFF]";

  return (
    <section className={`relative py-16 px-4 overflow-hidden ${heroGradientClassName}`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3E7EFF]/20 dark:bg-[#3E7EFF]/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto text-center text-white">
        <h2 className="mb-4 text-base sm:text-lg font-medium animate-fade-in">
          {t.heroTitle}
        </h2>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 max-w-2xl mx-auto animate-fade-in">
          {t.heroSubtitle}
        </p>

        {!isAuthenticated && (
          <div className="mb-8 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 max-w-2xl mx-auto animate-fade-in shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <User className="w-6 h-6 text-white" />
              <h3 className="text-xl text-white">
                {language === "ar" ? "ابدأ البيع اليوم" : "Start Selling Today"}
              </h3>
            </div>
            <p className="text-white/90 mb-6">
              {language === "ar"
                ? "انشر منتجاتك واصل إلى المشترين في جميع أنحاء الأردن"
                : "Post your items and reach buyers across Jordan"}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                size="lg"
                className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl bg-white text-[#0A4ABF] hover:bg-white/95"
                onClick={() => {
                  setShowLoginPrompt(true);
                }}
              >
                <User className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                {language === "ar" ? "ابدأ البيع" : "Start Selling"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl border-white text-white bg-white/15 border-2 hover:bg-white/20"
                onClick={onBrowseItems}
              >
                {t.browseItems}
              </Button>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="flex gap-4 justify-center flex-wrap animate-fade-in">
            <Button
              size="lg"
              className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl bg-white text-[#0A4ABF] hover:bg-white/95"
              onClick={() => setShowSellItem(true)}
            >
              {t.startSelling}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="hover:scale-105 transition-transform shadow-lg hover:bg-white/20 dark:hover:bg-white/10 border-white text-white bg-white/15 border-2"
              onClick={onBrowseItems}
            >
              {t.browseItems}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
