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
  const sectionBackgroundClass = darkMode
    ? "bg-gradient-to-br from-slate-950 via-primary/85 to-secondary/85"
    : "bg-gradient-to-br from-primary via-primary/90 to-secondary";

  const headingClassName = isRTL
    ? "text-3xl font-semibold leading-[1.34] sm:text-4xl lg:text-5xl"
    : "text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl";

  const subtitleClassName = isRTL
    ? "mx-auto mt-5 max-w-3xl text-base leading-8 text-primary-foreground/85 sm:text-lg"
    : "mx-auto mt-5 max-w-3xl text-base leading-7 text-primary-foreground/85 sm:text-lg";

  return (
    <section
      className={`relative overflow-hidden px-4 py-12 sm:py-14 lg:py-16 ${sectionBackgroundClass}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl dark:bg-white/10" />
      <div className="absolute -bottom-24 left-6 h-72 w-72 rounded-full bg-white/15 blur-3xl dark:bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent dark:from-black/20" />

      <div className="relative mx-auto max-w-5xl text-center text-primary-foreground">
        <h2 className="animate-fade-in text-sm font-semibold tracking-[0.14em] text-primary-foreground/85 sm:text-base">
          {t.heroTitle}
        </h2>
        <p className={`animate-fade-in-soft mt-4 ${headingClassName}`}>
          {t.heroSubtitle}
        </p>
        <p className={subtitleClassName}>
          {language === "ar"
            ? "منصة موثوقة وسريعة لعرض منشوراتك والوصول للمشترين في كل المحافظات."
            : "A trusted and fast place to list your posts and reach buyers across Jordan."}
        </p>

        {!isAuthenticated && (
          <div className="animate-fade-in-soft mx-auto mt-7 max-w-2xl rounded-2xl border border-white/35 bg-background/10 p-5 shadow-xl backdrop-blur-md sm:p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <User className="h-5 w-5 text-primary-foreground" />
              <h3 className="text-lg text-primary-foreground sm:text-xl">
                {language === "ar" ? "ابدأ البيع اليوم" : "Start Selling Today"}
              </h3>
            </div>
            <p className="mb-6 text-primary-foreground/85">
              {language === "ar"
                ? "انشر منشوراتك واصل إلى المشترين في جميع أنحاء الأردن"
                : "Post your items and reach buyers across Jordan"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-12 min-w-[10.5rem] rounded-xl border border-white/30 bg-white text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-xl"
                onClick={() => {
                  setShowLoginPrompt(true);
                }}
              >
                <User className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {language === "ar" ? "ابدأ البيع" : "Start Selling"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 min-w-[10.5rem] rounded-xl border-white/60 bg-background/8 text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-background/18"
                onClick={onBrowseItems}
              >
                {t.browseItems}
              </Button>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="animate-fade-in-soft mx-auto mt-8 flex w-fit flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/30 bg-background/10 p-2.5 shadow-xl backdrop-blur-sm">
            <Button
              size="lg"
              className="h-11 min-w-[11.5rem] rounded-xl border border-white/35 bg-white px-5 text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-xl"
              onClick={() => setShowSellItem(true)}
            >
              {t.startSelling}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 min-w-[11.5rem] rounded-xl border-white/60 bg-background/8 px-5 text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-background/16 dark:hover:bg-background/14"
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
