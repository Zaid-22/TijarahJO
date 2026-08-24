import { Pause, Play } from "lucide-react";
import type { Language } from "../../../types";

interface HomeHeroAutoplayControlProps {
  enabled: boolean;
  language: Language;
  onToggle: () => void;
}

export function HomeHeroAutoplayControl({
  enabled,
  language,
  onToggle,
}: HomeHeroAutoplayControlProps) {
  const label = enabled
    ? language === "ar"
      ? "إيقاف التبديل التلقائي"
      : "Pause automatic slide rotation"
    : language === "ar"
      ? "تشغيل التبديل التلقائي"
      : "Start automatic slide rotation";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!enabled}
      className="me-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={label}
    >
      {enabled ? (
        <Pause className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Play className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
