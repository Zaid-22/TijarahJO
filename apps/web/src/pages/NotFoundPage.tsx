import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "../shared/ui/button";
import { SubpageHeader } from "../shared/ui/subpage-header";
import { PageShell } from "../shared/ui/page-shell";
import type { Language } from "../translations";

interface NotFoundPageProps {
  language: Language;
  onGoHome: () => void;
  onGoBack: () => void;
  attemptedPath?: string;
}

export function NotFoundPage({
  language,
  onGoHome,
  onGoBack,
  attemptedPath,
}: NotFoundPageProps) {
  const isRTL = language === "ar";
  const normalizedAttemptedPath = attemptedPath?.trim();
  const copy = language === "ar"
    ? {
      title: "الصفحة غير موجودة",
      description:
        "عذرًا، لا يمكننا العثور على الصفحة المطلوبة. يمكنك العودة أو الذهاب إلى الرئيسية.",
      requestedPathPrefix: "المسار المطلوب:",
      goHome: "الذهاب إلى الرئيسية",
      goBack: "العودة",
    }
    : {
      title: "Page Not Found",
      description:
        "Sorry, we couldn't find the page you requested. You can go back or return to home.",
      requestedPathPrefix: "Requested path:",
      goHome: "Go Home",
      goBack: "Go Back",
    };

  return (
    <PageShell>
      <SubpageHeader
        onBack={onGoBack}
        isRTL={isRTL}
        backLabel={copy.goBack}
        title={copy.title}
        showLogo={false}
      />
      <main className="min-h-content-60vh flex items-center justify-center px-4 py-8">
        <section className="max-w-xl w-full rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <p className="text-xl sm:text-2xl text-foreground mb-2">
            {copy.title}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            {copy.description}
          </p>
          {normalizedAttemptedPath ? (
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 break-all rounded-lg bg-muted px-3 py-2">
              {copy.requestedPathPrefix} {normalizedAttemptedPath}
            </p>
          ) : null}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              className="w-full sm:w-auto"
              onClick={onGoHome}
            >
              <Home className="w-4 h-4 mr-2" />
              {copy.goHome}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onGoBack}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {copy.goBack}
            </Button>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
