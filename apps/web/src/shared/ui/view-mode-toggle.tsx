import { Columns, Grid3x3, LayoutGrid, List } from "lucide-react";
import type { Language, ViewMode } from "../../types";
import { Button } from "./button";
import { cn } from "./utils";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  language?: Language;
  activeTone?: "brand" | "neutral";
  size?: "sm" | "default";
  className?: string;
}

type ViewModeDefinition = {
  mode: ViewMode;
  icon: typeof Grid3x3;
  title: {
    en: string;
    ar: string;
  };
};

const viewModeDefinitions: ViewModeDefinition[] = [
  {
    mode: "grid-4",
    icon: Grid3x3,
    title: {
      en: "4 columns",
      ar: "شبكة 4 أعمدة",
    },
  },
  {
    mode: "grid-3",
    icon: LayoutGrid,
    title: {
      en: "3 columns",
      ar: "شبكة 3 أعمدة",
    },
  },
  {
    mode: "grid-2",
    icon: Columns,
    title: {
      en: "2 columns",
      ar: "شبكة عمودين",
    },
  },
  {
    mode: "list",
    icon: List,
    title: {
      en: "List view",
      ar: "عرض القائمة",
    },
  },
];

export function ViewModeToggle({
  viewMode,
  onChange,
  language = "en",
  activeTone = "brand",
  size = "sm",
  className,
}: ViewModeToggleProps) {
  const activeClassName = activeTone === "brand"
    ? "bg-primary/10 text-primary"
    : "bg-muted text-foreground";
  const inactiveClassName = activeTone === "brand"
    ? "text-muted-foreground hover:text-foreground"
    : "text-foreground/80 hover:text-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm",
        className,
      )}
      role="group"
      aria-label={language === "ar" ? "تبديل طريقة العرض" : "Toggle view mode"}
    >
      {viewModeDefinitions.map(({ mode, icon: Icon, title }) => {
        const isActive = viewMode === mode;
        const label = title[language];

        return (
          <Button
            key={mode}
            variant="ghost"
            size={size}
            onClick={() => onChange(mode)}
            className={cn(
              "h-8 w-8 p-0",
              isActive ? activeClassName : inactiveClassName,
            )}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
    </div>
  );
}
