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
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/20 text-rose-500 shadow-md backdrop-blur-md transition-all duration-200 hover:border-white/50 hover:bg-black/30 dark:border-white/20 dark:bg-black/40 dark:text-rose-400 dark:hover:bg-black/50",
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
