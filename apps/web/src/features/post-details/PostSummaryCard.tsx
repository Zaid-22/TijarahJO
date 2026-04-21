import { useEffect, useMemo, useState } from "react";
import { Clock, Eye, MapPin } from "lucide-react";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Card, CardContent } from "../../shared/ui/card";
import { Separator } from "../../shared/ui/separator";
import { cn } from "../../shared/ui/utils";
import type { Post } from "../../types";

const DESCRIPTION_PREVIEW_LENGTH = 420;
const DESCRIPTION_PREVIEW_LINES = 6;

interface PostSummaryCardProps {
  post: Post;
  isRTL: boolean;
  displayLocationLabel: string;
  postedAgoLabel: string;
  displayedViews: number;
  labels: {
    descriptionTitle: string;
    readMore: string;
    showLess: string;
    soldOut: string;
    views: string;
  };
}

function buildDescriptionPreview(description: string) {
  const lines = description.split(/\r?\n/);
  const isLong =
    description.length > DESCRIPTION_PREVIEW_LENGTH ||
    lines.length > DESCRIPTION_PREVIEW_LINES;

  if (!isLong) {
    return { isLong, preview: description };
  }

  const previewSource =
    lines.length > DESCRIPTION_PREVIEW_LINES
      ? lines.slice(0, DESCRIPTION_PREVIEW_LINES).join("\n")
      : description;

  const limitedPreview =
    previewSource.length > DESCRIPTION_PREVIEW_LENGTH
      ? previewSource.slice(0, DESCRIPTION_PREVIEW_LENGTH)
      : previewSource;

  const lastWhitespaceIndex = limitedPreview.search(/\s+\S*$/);
  const preview =
    lastWhitespaceIndex > Math.floor(DESCRIPTION_PREVIEW_LENGTH * 0.72)
      ? limitedPreview.slice(0, lastWhitespaceIndex).trimEnd()
      : limitedPreview.trimEnd();

  return { isLong, preview: `${preview}...` };
}

export function PostSummaryCard({
  post,
  isRTL,
  displayLocationLabel,
  postedAgoLabel,
  displayedViews,
  labels,
}: PostSummaryCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionState = useMemo(
    () =>
      post.description ? buildDescriptionPreview(post.description) : null,
    [post.description],
  );
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [post.description]);

  const descriptionText =
    descriptionState?.isLong && !isDescriptionExpanded
      ? descriptionState.preview
      : post.description;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge
              className="backdrop-blur-md rounded-full px-4 py-1.5 font-semibold text-sm bg-primary/10 text-primary border-0"
            >
              {post.category}
            </Badge>

            {post.status === "SOLD" && (
              <Badge
                className="backdrop-blur-md rounded-full px-4 py-1.5 bg-muted text-muted-foreground border-0 font-semibold"
              >
                {labels.soldOut}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {post.name}
            </h1>

            <div className={cn("flex items-baseline gap-2", isRTL ? "sm:justify-start" : "sm:justify-start")}>
              <span className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                {post.price.toLocaleString()}
              </span>
              <span className={cn("text-lg font-semibold text-slate-500 dark:text-slate-400", "ms-1")}>JOD</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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

        <Separator className="my-6" />

        {post.description && (
          <>
            <div>
              <h3 className="mb-3 text-lg font-bold text-foreground">
                {labels.descriptionTitle}
              </h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap font-normal">
                {descriptionText}
              </p>
              {descriptionState?.isLong && (
                <Button
                  variant="link"
                  className="mt-3 h-auto p-0 text-sm font-semibold"
                  aria-expanded={isDescriptionExpanded}
                  onClick={() =>
                    setIsDescriptionExpanded((current) => !current)
                  }
                >
                  {isDescriptionExpanded ? labels.showLess : labels.readMore}
                </Button>
              )}
            </div>

            <Separator className="my-6" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
