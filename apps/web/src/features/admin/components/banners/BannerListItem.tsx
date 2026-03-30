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
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Preview Image */}
          <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-muted">
            {banner.imageUrl ? (
              <img
                src={banner.imageUrl}
                alt={banner.altText}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm text-foreground truncate">
                {banner.title || banner.titleAr || banner.altText || "Untitled banner"}
              </p>
              <Badge
                variant={banner.isActive ? "default" : "outline"}
                className="text-xs flex-shrink-0"
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
              <p className="text-xs text-muted-foreground truncate mt-1">
                {banner.subtitle || banner.subtitleAr}
              </p>
            )}
            {banner.linkUrl && (
              <p className="text-xs text-primary mt-1 truncate">
                → {banner.linkUrl}
              </p>
            )}
          </div>

          {/* Order */}
          <div className="text-xs text-muted-foreground font-mono w-8 text-center flex-shrink-0">
             #{banner.displayOrder} ({index + 1})
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              title="Edit banner"
              aria-label="Edit banner"
              className="h-8 w-8"
            >
              <Pencil className="w-4 h-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleActive}
              title={banner.isActive ? "Hide banner" : "Show banner"}
              aria-label={banner.isActive ? "Hide banner" : "Show banner"}
              className="h-8 w-8"
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
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
