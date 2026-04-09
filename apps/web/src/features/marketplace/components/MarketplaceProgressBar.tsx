import { Language } from "../../../types";

interface MarketplaceProgressBarProps {
  progress: number;
  language: Language;
}

export function MarketplaceProgressBar({ progress, language }: MarketplaceProgressBarProps) {
  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-muted-foreground">
          {language === "ar" ? "اكتمال المنشور" : "Listing Completion"}
        </span>
        <span className={progress === 100 ? "text-primary font-bold" : "text-foreground"}>
          {progress}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress === 100 && (
        <p className="animate-fade-in text-xs font-medium text-primary">
          {language === "ar" ? "✓ جاهز!" : "✓ Ready!"}
        </p>
      )}
    </div>
  );
}
