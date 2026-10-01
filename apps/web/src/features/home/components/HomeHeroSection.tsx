import { useState, useEffect, useCallback, useId, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Language } from "../../../types";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";
import {
  getAllHeroBanners,
  clearSavedHeroBanners,
  resolveBannerColor,
  resolveHeroBannerMedia,
  saveHeroBanners,
  type HeroBanner,
} from "./heroBannerData";
import { bannersApi } from "../../../services/api/banners";
import { HomeHeroFallback } from "./HomeHeroFallback";
import { HomeHeroAutoplayControl } from "./HomeHeroAutoplayControl";

type HomeHeroSectionProps = {
  language: Language;
  isAuthenticated: boolean;
  t: Record<string, string>;
  isRTL: boolean;
  darkMode: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  setShowCreatePost: (show: boolean) => void;
  onBrowseItems: () => void;
  onNavigate?: (path: string) => void;
};

const AUTO_PLAY_INTERVAL = 5000;

function isLightColor(
  color: string | undefined,
  fallbackClass: string,
): boolean {
  if (!color) {
    return /\b(50|100|200|white|sky|amber|background)\b/.test(fallbackClass);
  }

  if (color === "transparent") {
    return true;
  }

  if (!color.startsWith("#")) {
    return /\bbackground\b/.test(fallbackClass);
  }

  const hexValue = color.slice(1);
  const hex =
    hexValue.length === 3
      ? hexValue
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : hexValue.slice(0, 6);
  if (hex.length !== 6) {
    return /\b(50|100|200|white|sky|amber|background)\b/.test(fallbackClass);
  }

  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  if (![red, green, blue].every(Number.isFinite)) {
    return /\b(50|100|200|white|sky|amber|background)\b/.test(fallbackClass);
  }

  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.62;
}

function resolveLocalizedBannerCopy(
  language: Language,
  primaryValue: string,
  fallbackValue: string,
): string {
  if (language === "ar") {
    return primaryValue.trim() || fallbackValue.trim();
  }

  return fallbackValue.trim() || primaryValue.trim();
}

export function HomeHeroSection({
  language,
  isAuthenticated,
  t,
  isRTL,
  setShowLoginPrompt,
  setShowCreatePost,
  onBrowseItems,
  onNavigate,
}: HomeHeroSectionProps) {
  const titleId = useId();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [banners, setBanners] = useState<HeroBanner[]>(() =>
    getAllHeroBanners(),
  );

  useEffect(() => {
    let isCurrent = true;

    const refreshBanners = () => {
      bannersApi
        .getActiveBanners()
        .then((apiBanners) => {
          if (!isCurrent || apiBanners === null) {
            return;
          }

          if (apiBanners.length === 0) {
            setBanners([]);
            clearSavedHeroBanners();
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
            ...resolveHeroBannerMedia(b.imageUrl),
          }));

          setBanners(resolvedBanners);
          saveHeroBanners(resolvedBanners);
        })
        .catch((_error) => {
          // Keep cached/default banners in place when the refresh fails.
        });
    };

    refreshBanners();

    return () => {
      isCurrent = false;
    };
  }, []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(
    () => !prefersReducedMotion,
  );
  const [isPointerPaused, setIsPointerPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSlides = banners.length;
  const isAutoPlayPaused = !isAutoPlayEnabled || isPointerPaused || isFocusPaused;

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsAutoPlayEnabled(false);
    }
  }, [prefersReducedMotion]);

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
    if (isAutoPlayPaused || totalSlides <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(
        (previousIndex) =>
          (previousIndex + (isRTL ? -1 : 1) + totalSlides) % totalSlides,
      );
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlayPaused, isRTL, totalSlides]);

  useEffect(() => {
    if (typeof window === "undefined" || totalSlides <= 1) {
      return;
    }

    const nextBanner = banners[(currentIndex + 1) % totalSlides];
    if (!nextBanner?.imageUrl) {
      return;
    }

    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const warmNextBannerImage = () => {
      const preloadImage = new Image();
      preloadImage.src = nextBanner.imageUrl;
    };

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(
        () => {
          warmNextBannerImage();
        },
        { timeout: 1500 },
      );
    } else {
      timeoutHandle = setTimeout(() => {
        warmNextBannerImage();
      }, 900);
    }

    return () => {
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [banners, currentIndex, totalSlides]);

  const handleBannerClick = (banner: HeroBanner) => {
    if (banner.linkUrl && onNavigate) {
      onNavigate(banner.linkUrl);
    }
  };

  const handleStartSelling = () => {
    if (isAuthenticated) {
      setShowCreatePost(true);
      return;
    }

    setShowLoginPrompt(true);
  };

  if (banners.length === 0) {
    return (
      <HomeHeroFallback
        titleId={titleId}
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        browseLabel={t.browseItems}
        sellLabel={t.startSelling}
        onBrowseItems={onBrowseItems}
        onStartSelling={handleStartSelling}
      />
    );
  }

  if (totalSlides === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-linear-to-b from-muted/30 to-background"
      onMouseEnter={() => setIsPointerPaused(true)}
      onMouseLeave={() => setIsPointerPaused(false)}
      onFocusCapture={() => setIsFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocusPaused(false);
        }
      }}
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
          <div
            className="relative w-full min-h-96 sm:min-h-80 md:min-h-0 md:aspect-21/8"
            aria-live={isAutoPlayEnabled ? "off" : "polite"}
          >
            {banners.map((banner, index) => {
              const isActive = index === currentIndex;
              const slideLabel = `${language === "ar" ? "الشريحة" : "Slide"} ${index + 1} ${language === "ar" ? "من" : "of"} ${totalSlides}: ${resolveLocalizedBannerCopy(
                language,
                banner.altTextAr,
                banner.altText,
              )}`;
              const slideClassName = `absolute inset-0 h-full w-full overflow-hidden transition-opacity duration-500 ease-in-out ${
                banner.linkUrl ? "cursor-pointer" : "cursor-default"
              } ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`;
              const backgroundColor = resolveBannerColor(banner.bgClass);
              const textColor = resolveBannerColor(banner.textClass);
              const slideStyle = backgroundColor
                ? backgroundColor.includes("gradient(")
                  ? { background: backgroundColor }
                  : { backgroundColor }
                : {};
              const textStyle = textColor ? { color: textColor } : {};
              const isLightBg = isLightColor(backgroundColor, banner.bgClass);
              const buttonStyle = isLightBg
                ? {
                    backgroundColor: "rgb(15, 23, 42)",
                    color: "rgb(255, 255, 255)",
                  }
                : {
                    backgroundColor: "rgb(255, 255, 255)",
                    color: "rgb(15, 23, 42)",
                  };
              const slideInner = (
                <div
                  style={slideStyle}
                  className="absolute inset-0 h-full w-full"
                ></div>
              );
              const slideContent = (
                <div
                  className={`relative w-full h-full flex flex-col md:flex-row items-center justify-center md:justify-between px-6 sm:px-12 lg:px-24 py-6 md:py-0 gap-4 md:gap-0 ${isRTL ? "md:flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex flex-col items-center md:items-start text-center md:text-start space-y-3 sm:space-y-4 max-w-lg z-10 ${isRTL ? "md:items-end md:text-end" : ""}`}
                    style={textStyle}
                  >
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
                    <div
                      className="px-6 py-2.5 sm:py-3 mt-2 sm:mt-4 font-semibold text-sm sm:text-base rounded-full shadow-lg transition-transform hover:scale-105"
                      style={buttonStyle}
                    >
                      {resolveLocalizedBannerCopy(
                        language,
                        banner.buttonTextAr,
                        banner.buttonText,
                      )}
                    </div>
                  </div>

                  <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[280px] md:h-[280px] lg:w-[350px] lg:h-[350px] shrink-0 z-0">
                    {(isActive ||
                      index === (currentIndex + 1) % totalSlides) && (
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
                          className="absolute inset-0 h-full w-full object-contain"
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding={index === 0 ? "sync" : "async"}
                          {...{ fetchpriority: index === 0 ? "high" : "auto" }}
                          draggable={false}
                        />
                      </picture>
                    )}
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
                  {slideInner}
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
                  {slideInner}
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
            <HomeHeroAutoplayControl
              enabled={isAutoPlayEnabled}
              language={language}
              onToggle={() => setIsAutoPlayEnabled((enabled) => !enabled)}
            />
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
                  className={`block rounded-full shrink-0 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 ${
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
