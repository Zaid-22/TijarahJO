import { useState, useEffect, useCallback, useId, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Language } from "../../../types";
import {
  getAllHeroBanners,
  saveHeroBanners,
  type HeroBanner,
} from "./heroBannerData";
import { bannersApi } from "../../../services/api/banners";

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

function resolveLocalizedBannerCopy(
  language: Language,
  primaryValue: string,
  fallbackValue: string,
): string {
  if (language === "ar") {
    return primaryValue.trim() || fallbackValue.trim();
  }

  return primaryValue.trim() || fallbackValue.trim();
}

export function HomeHeroSection({
  language,
  isRTL,
  onNavigate,
}: HomeHeroSectionProps) {
  const titleId = useId();
  const [banners, setBanners] = useState<HeroBanner[]>(() => getAllHeroBanners());
  
  useEffect(() => {
    let isCurrent = true;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const refreshBanners = () => {
      bannersApi.getActiveBanners().then((apiBanners) => {
        if (!isCurrent || !apiBanners || apiBanners.length === 0) {
          return;
        }

        const resolvedBanners = apiBanners.map((b) => ({
          id: `api-banner-${b.bannerID}`,
          title: b.title,
          titleAr: b.titleAr,
          subtitle: b.subtitle,
          subtitleAr: b.subtitleAr,
          buttonText: b.buttonText,
          buttonTextAr: b.buttonTextAr,
          imageUrl: b.imageUrl,
          bgClass: b.bgClass,
          textClass: b.textClass,
          altText: b.altText,
          altTextAr: b.altTextAr,
          linkUrl: b.linkUrl || undefined,
          isActive: b.isActive,
          order: b.displayOrder,
        }));

        setBanners(resolvedBanners);
        saveHeroBanners(resolvedBanners);
      }).catch((_error) => {
        // Keep cached/default banners in place when the refresh fails.
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => {
        refreshBanners();
      }, { timeout: 1500 });
    } else {
      timeoutHandle = setTimeout(() => {
        refreshBanners();
      }, 1200);
    }

    return () => {
      isCurrent = false;
      if (idleHandle !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };
  }, []);
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

  if (banners.length === 0) {
    return (
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-muted/30 to-background">
        <div className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4 sm:pt-6 pb-2">
          {/* Main banner skeleton matching exact dimensions */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl bg-muted animate-pulse w-full min-h-96 sm:min-h-80 md:min-h-0 md:aspect-[21/8]" />
          
          {/* Pagination dots skeleton matching exact margin/padding */}
          <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 pb-2">
            <div className="w-8 h-2.5 rounded-full bg-muted animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (totalSlides === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-to-b from-muted/30 to-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="sr-only">
        {language === "ar" ? "إعلانات مميزة" : "Featured banners"}
      </h2>
      {/* Slides Container */}
      <div className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4 sm:pt-6 pb-2">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl">
          {/* Aspect ratio wrapper — responsive for mobile, taller or aspect based */}
          <div className="relative w-full min-h-96 sm:min-h-80 md:min-h-0 md:aspect-[21/8]">
            {banners.map((banner, index) => {
              const isActive = index === currentIndex;
              const slideLabel = `${language === "ar" ? "الشريحة" : "Slide"} ${index + 1} ${language === "ar" ? "من" : "of"} ${totalSlides}: ${resolveLocalizedBannerCopy(
                language,
                banner.altTextAr,
                banner.altText,
              )}`;
              const slideClassName = `absolute inset-0 h-full w-full overflow-hidden transition-all duration-500 ease-in-out ${
                banner.linkUrl ? "cursor-pointer" : "cursor-default"
              } ${
                isActive
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-105 z-0"
              } ${banner.bgClass} ${banner.textClass}`;
              const slideContent = (
                <div className={`relative w-full h-full flex flex-col md:flex-row items-center justify-center md:justify-between px-6 sm:px-12 lg:px-24 py-6 md:py-0 gap-4 md:gap-0 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                  {/* Text Content Area */}
                  <div className={`flex flex-col items-center md:items-start text-center md:text-start space-y-3 sm:space-y-4 max-w-lg z-10 ${isRTL ? 'md:items-end md:text-end' : ''}`}>
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight leading-tight">
                      {resolveLocalizedBannerCopy(
                        language,
                        banner.titleAr,
                        banner.title,
                      )}
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg opacity-90 font-medium max-w-[280px] sm:max-w-none">
                      {resolveLocalizedBannerCopy(
                        language,
                        banner.subtitleAr,
                        banner.subtitle,
                      )}
                    </p>
                    <div className={`px-6 py-2.5 sm:py-3 mt-2 sm:mt-4 font-semibold text-sm sm:text-base rounded-full shadow-lg transition-transform hover:scale-105 ${banner.bgClass.includes('slate') || banner.bgClass.includes('0f172a') ? 'bg-primary text-primary-foreground' : 'bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground'}`}>
                      {resolveLocalizedBannerCopy(
                        language,
                        banner.buttonTextAr,
                        banner.buttonText,
                      )}
                    </div>
                  </div>
                  
                  {/* Image Area - Square Asset */}
                  <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[280px] md:h-[280px] lg:w-[350px] lg:h-[350px] flex-shrink-0 z-0">
                    <picture>
                      {banner.imageSrcSet && (
                        <source
                          type="image/webp"
                          srcSet={banner.imageSrcSet}
                          sizes="(max-width: 639px) 180px, (max-width: 767px) 220px, (max-width: 1023px) 280px, 350px"
                        />
                      )}
                      <img
                        src={banner.pngFallbackUrl || banner.imageUrl}
                        alt=""
                        aria-hidden="true"
                        width={640}
                        height={640}
                        className="absolute inset-0 w-full h-full object-contain filter drop-shadow-2xl"
                        loading={index === 0 ? "eager" : "lazy"}
                        {...{ fetchpriority: index === 0 ? "high" : "auto" }}
                        draggable={false}
                      />
                    </picture>
                  </div>
                </div>
              );

              return banner.linkUrl ? (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => handleBannerClick(banner)}
                  className={`${slideClassName} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2`}
                  aria-roledescription="slide"
                  aria-label={slideLabel}
                  aria-hidden={!isActive}
                  tabIndex={isActive ? 0 : -1}
                  disabled={!isActive}
                >
                  {slideContent}
                </button>
              ) : (
                <div
                  key={banner.id}
                  className={slideClassName}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={slideLabel}
                  aria-hidden={!isActive}
                >
                  {slideContent}
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg text-foreground transition-all duration-200 hover:scale-110 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
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
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg text-foreground transition-all duration-200 hover:scale-110 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
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
            aria-label={language === "ar" ? "شرائح الإعلانات" : "Banner slides"}
          >
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                aria-current={index === currentIndex ? "true" : undefined}
                aria-label={`${language === "ar" ? "الانتقال إلى الشريحة" : "Go to slide"} ${index + 1}`}
                onClick={() => goToSlide(index)}
                className="group flex items-center justify-center rounded-full p-1 sm:p-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span
                  className={`block rounded-full flex-shrink-0 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 ${
                    index === currentIndex
                      ? "w-8 h-2.5 bg-primary shadow-md"
                      : "w-2.5 h-2.5 bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
