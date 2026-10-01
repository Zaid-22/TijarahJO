import {
  Image,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "../../../../shared/ui/card";
import { Button } from "../../../../shared/ui/button";
import { Badge } from "../../../../shared/ui/badge";
import { type BannerModel } from "../../../../services/api/banners";

type BannerListItemProps = {
  banner: BannerModel;
  index: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
};

export function BannerListItem({
  banner,
  index,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onEdit,
  onToggleActive,
  onRemove,
}: BannerListItemProps) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`transition-all duration-200 ${
        isDragging
          ? "opacity-50 scale-95 border-primary"
          : "hover:shadow-md"
      } ${!banner.isActive ? "opacity-60" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Top row: Drag Handle, Image, and Info (row on mobile, flex-1 on desktop) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Drag Handle */}
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Preview Image */}
            <div className="relative w-20 h-14 sm:w-32 sm:h-20 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
              {banner.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt={banner.altText}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm text-foreground truncate">
                  {banner.title || banner.titleAr || banner.altText || "Untitled banner"}
                </p>
                <Badge
                  variant={banner.isActive ? "default" : "outline"}
                  className="text-xs shrink-0 px-1.5 py-0"
                >
                  {banner.isActive ? "Active" : "Hidden"}
                </Badge>
              </div>
              <p
                className="text-xs text-muted-foreground truncate"
                dir="rtl"
              >
                {banner.titleAr || banner.altTextAr}
              </p>
              {!!(banner.subtitle || banner.subtitleAr) && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {banner.subtitle || banner.subtitleAr}
                </p>
              )}
              {banner.linkUrl && (
                <p className="text-xs text-primary mt-0.5 truncate">
                  → {banner.linkUrl}
                </p>
              )}
            </div>
          </div>

          {/* Bottom row: Actions & Order (separate row on mobile, end-aligned on desktop) */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto border-t border-border/40 pt-2.5 sm:border-0 sm:pt-0">
            {/* Order */}
            <div className="text-xs text-muted-foreground font-mono px-1 sm:w-16 sm:text-center">
               Order: #{banner.displayOrder} <span className="opacity-60">({index + 1})</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                title="Edit banner"
                aria-label="Edit banner"
                className="h-8 w-8 hover:bg-muted"
              >
                <Pencil className="w-4 h-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleActive}
                title={banner.isActive ? "Hide banner" : "Show banner"}
                aria-label={banner.isActive ? "Hide banner" : "Show banner"}
                className="h-8 w-8 hover:bg-muted"
              >
                {banner.isActive ? (
                  <Eye className="w-4 h-4 text-emerald-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                title="Remove banner"
                aria-label="Remove banner"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
