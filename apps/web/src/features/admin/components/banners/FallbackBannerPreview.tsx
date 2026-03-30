import { Image } from "lucide-react";
import {
  Card,
  CardContent,
} from "../../../../shared/ui/card";
import { Button } from "../../../../shared/ui/button";
import { Badge } from "../../../../shared/ui/badge";
import { getAllHeroBanners } from "../../../home/components/heroBannerData";

type FallbackBannerPreviewProps = {
  onResetToDefaults: () => void;
};

export function FallbackBannerPreview({
  onResetToDefaults,
}: FallbackBannerPreviewProps) {
  const defaultBanners = getAllHeroBanners();
  const defaultBannerCount = defaultBanners.length;

  return (
    <Card className="border-dashed">
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Image className="h-12 w-12 opacity-30" />
          <p className="font-medium text-lg text-foreground">
            No backend banners configured
          </p>
          <p className="text-sm text-center">
            The homepage is currently using the built-in fallback banners shown below.
          </p>
          <p className="text-sm text-center max-w-xl">
            Import the {defaultBannerCount} default homepage banners into the backend with
            {" "}
            Reset to Defaults, or add new backend banners here.
          </p>
          <Button variant="outline" onClick={onResetToDefaults} className="mt-2">
            Reset to Defaults
          </Button>
        </div>

        {defaultBanners.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Fallback Preview</Badge>
              <p className="text-sm text-muted-foreground">
                These are the frontend defaults currently visible on the homepage.
              </p>
            </div>

            {defaultBanners.map((banner, index) => (
              <Card key={banner.id} className="bg-muted/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-muted">
                      <img
                        src={banner.imageUrl}
                        alt={banner.altText}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          {banner.altText}
                        </p>
                        <Badge variant={banner.isActive ? "default" : "outline"}>
                          {banner.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {banner.title}
                      </p>
                      <p
                        className="text-xs text-muted-foreground truncate"
                        dir="rtl"
                      >
                        {banner.altTextAr}
                      </p>
                      {banner.linkUrl && (
                        <p className="text-xs text-primary mt-1 truncate">
                          → {banner.linkUrl}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground font-mono w-8 text-center flex-shrink-0">
                      #{banner.order} ({index + 1})
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
