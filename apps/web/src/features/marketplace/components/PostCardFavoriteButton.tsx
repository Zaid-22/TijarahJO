import { Heart } from "lucide-react";
import { cn } from "../../../shared/ui/utils";

interface PostCardFavoriteButtonProps {
  isFavorite: boolean;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function PostCardFavoriteButton({
  isFavorite,
  label,
  onClick,
  className,
}: PostCardFavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.08))] text-rose-500 shadow-md backdrop-blur-2xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(15,23,42,0.16))] transition-all duration-200 hover:border-white/55 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 dark:border-white/22 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(15,23,42,0.28))] dark:text-rose-400 dark:supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.32))] dark:hover:border-white/28 dark:focus-visible:ring-white/20",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 stroke-2 transition-all duration-200",
          isFavorite ? "fill-current" : "fill-none",
        )}
      />
    </button>
  );
}
