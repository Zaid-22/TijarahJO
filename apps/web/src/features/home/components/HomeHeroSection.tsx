import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Language } from "../../../types";
import { getHeroBanners, type HeroBanner } from "./heroBannerData";

type HomeHeroSectionProps = {
  language: Language;
  isAuthenticated: boolean;
  t: Record<string, string>;
  isRTL: boolean;
  darkMode: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  setShowSellItem: (show: boolean) => void;
  onBrowseItems: () => void;
  onNavigate?: (path: string) => void;
};

const AUTO_PLAY_INTERVAL = 5000;

export function HomeHeroSection({
  language,
  isRTL,
  onNavigate,
}: HomeHeroSectionProps) {
  const banners = useMemo(() => getHeroBanners(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSlides = banners.length;

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(((index % totalSlides) + totalSlides) % totalSlides);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [totalSlides, isTransitioning],
  );

  const goNext = useCallback(() => {
    goToSlide(currentIndex + (isRTL ? -1 : 1));
  }, [currentIndex, goToSlide, isRTL]);

  const goPrev = useCallback(() => {
    goToSlide(currentIndex + (isRTL ? 1 : -1));
  }, [currentIndex, goToSlide, isRTL]);

  // Auto-play
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, totalSlides]);

  const handleBannerClick = (banner: HeroBanner) => {
    if (banner.linkUrl && onNavigate) {
      onNavigate(banner.linkUrl);
    }
  };

  if (totalSlides === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-to-b from-muted/30 to-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label={language === "ar" ? "إعلانات مميزة" : "Featured banners"}
    >
      {/* Slides Container */}
      <div className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4 sm:pt-6 pb-2">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl">
          {/* Aspect ratio wrapper — responsive shorter banner */}
          <div className="relative w-full aspect-[21/8]">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => handleBannerClick(banner)}
                className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 overflow-hidden ${
                  banner.linkUrl ? "cursor-pointer" : "cursor-default"
                } ${
                  index === currentIndex
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-0 scale-105 z-0"
                } ${banner.bgClass} ${banner.textClass}`}
                aria-roledescription="slide"
                aria-label={
                  language === "ar" ? banner.altTextAr : banner.altText
                }
                aria-hidden={index !== currentIndex}
                tabIndex={index === currentIndex ? 0 : -1}
              >
                <div className={`relative w-full h-full flex flex-col md:flex-row items-center justify-between px-6 sm:px-12 lg:px-24 pb-12 sm:pb-0 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                  {/* Text Content Area */}
                  <div className={`flex flex-col items-center md:items-start text-center md:text-start space-y-4 max-w-lg z-10 mt-8 md:mt-0 ${isRTL ? 'md:items-end md:text-end' : ''}`}>
                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                      {language === "ar" ? banner.titleAr : banner.title}
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg opacity-90 font-medium">
                      {language === "ar" ? banner.subtitleAr : banner.subtitle}
                    </p>
                    <div className={`px-6 py-2.5 sm:py-3 mt-2 font-semibold text-sm sm:text-base rounded-full shadow-lg transition-transform hover:scale-105 ${banner.bgClass.includes('slate') || banner.bgClass.includes('0f172a') ? 'bg-primary text-primary-foreground' : 'bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground'}`}>
                      {language === "ar" ? banner.buttonTextAr : banner.buttonText}
                    </div>
                  </div>
                  
                  {/* Image Area - Square Asset */}
                  <div className="relative w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] lg:w-[350px] lg:h-[350px] flex-shrink-0 z-0">
                    <img
                      src={banner.imageUrl}
                      alt={language === "ar" ? banner.altTextAr : banner.altText}
                      className="absolute inset-0 w-full h-full object-contain filter drop-shadow-2xl"
                      loading={index === 0 ? "eager" : "lazy"}
                      draggable={false}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg text-foreground hover:bg-background hover:scale-110 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isRTL ? "right-2 sm:right-3" : "left-2 sm:left-3"
                }`}
                aria-label={language === "ar" ? "السابق" : "Previous"}
              >
                {isRTL ? (
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={goNext}
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg text-foreground hover:bg-background hover:scale-110 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isRTL ? "left-2 sm:left-3" : "right-2 sm:right-3"
                }`}
                aria-label={language === "ar" ? "التالي" : "Next"}
              >
                {isRTL ? (
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Pagination Dots */}
        {totalSlides > 1 && (
          <div
            className="flex items-center justify-center gap-2 mt-3 sm:mt-4 pb-2"
            role="tablist"
            aria-label={language === "ar" ? "شرائح الإعلانات" : "Banner slides"}
          >
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`${language === "ar" ? "الشريحة" : "Slide"} ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  index === currentIndex
                    ? "w-8 h-2.5 bg-primary shadow-md"
                    : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
