import { Image } from "lucide-react";
import {
  Card,
  CardContent,
} from "../../../../shared/ui/card";

export function FallbackBannerPreview() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Image className="h-12 w-12 opacity-30" />
          <p className="font-medium text-lg text-foreground">
            No backend banners configured
          </p>
          <p className="text-sm text-center">
            Add a new banner to show it in the homepage carousel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
