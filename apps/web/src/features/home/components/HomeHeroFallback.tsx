interface HomeHeroFallbackProps {
  titleId: string;
  title: string;
  subtitle: string;
  browseLabel: string;
  sellLabel: string;
  onBrowseItems: () => void;
  onStartSelling: () => void;
}

export function HomeHeroFallback({
  titleId,
  title,
  subtitle,
  browseLabel,
  sellLabel,
  onBrowseItems,
  onStartSelling,
}: HomeHeroFallbackProps) {
  return (
    <section
      className="relative w-full overflow-hidden bg-linear-to-b from-muted/30 to-background"
      aria-labelledby={titleId}
    >
      <div className="relative mx-auto w-full max-w-7xl px-2 pb-4 pt-4 sm:px-4 sm:pt-6 lg:px-8">
        <div className="flex min-h-80 w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl bg-linear-to-br from-primary to-blue-800 px-6 py-12 text-center text-primary-foreground shadow-xl sm:rounded-3xl sm:px-12">
          <div className="max-w-2xl space-y-3">
            <h2
              id={titleId}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              {title}
            </h2>
            <p className="text-base text-primary-foreground/90 sm:text-lg">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBrowseItems}
              className="min-h-11 rounded-full bg-background px-6 py-3 font-semibold text-foreground shadow-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              {browseLabel}
            </button>
            <button
              type="button"
              onClick={onStartSelling}
              className="min-h-11 rounded-full border border-primary-foreground/60 px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              {sellLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
