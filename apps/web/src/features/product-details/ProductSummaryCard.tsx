import { Clock, Eye, MapPin } from "lucide-react";
import { Badge } from "../../shared/ui/badge";
import { Card, CardContent } from "../../shared/ui/card";
import { Separator } from "../../shared/ui/separator";
import type { Product } from "../../types";

interface ProductSummaryCardProps {
  product: Product;
  isRTL: boolean;
  displayLocationLabel: string;
  postedAgoLabel: string;
  displayedViews: number;
  labels: {
    descriptionTitle: string;
    soldOut?: string;
    views: string;
  };
}

export function ProductSummaryCard({
  product,
  isRTL,
  displayLocationLabel,
  postedAgoLabel,
  displayedViews,
  labels,
}: ProductSummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge
                className="backdrop-blur-md px-3 py-1 font-semibold text-sm bg-white/95 text-[#0A4ABF] border-0"
              >
                {product.category}
              </Badge>

              {product.status === "SOLD" && (
                <Badge
                  className="backdrop-blur-md px-3 py-1 bg-gray-400/95 text-white border-0 font-semibold"
                >
                  {labels.soldOut || "SOLD OUT"}
                </Badge>
              )}
            </div>

            <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-black dark:text-white">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{displayLocationLabel}</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{postedAgoLabel}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span className="font-medium">
                  {displayedViews} {labels.views}
                </span>
              </div>
            </div>
          </div>

          <div className={`${isRTL ? "text-left sm:text-left" : "text-left sm:text-right"}`}>
            <div>
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                {product.price.toLocaleString()}
              </span>
              <span className="text-lg text-gray-600 dark:text-gray-400 ml-2">JOD</span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {product.description && (
          <>
            <div>
              <h3 className="mb-3 text-lg font-bold text-black dark:text-white">
                {labels.descriptionTitle}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-normal">
                {product.description}
              </p>
            </div>

            <Separator className="my-6" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
