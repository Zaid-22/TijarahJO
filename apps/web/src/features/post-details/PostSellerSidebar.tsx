import { Edit, MessageSquare, Phone, Star, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/ui/avatar";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Skeleton } from "../../shared/ui/skeleton";
import { Card, CardContent } from "../../shared/ui/card";
import { resolveAvatarSrc, getAvatarInitial } from "../../shared/lib/avatar";
import { Separator } from "../../shared/ui/separator";
import type { Language, Post } from "../../types";

interface PostSellerSidebarProps {
  language: Language;
  isRTL: boolean;
  post: Post;
  publicSellerName: string;
  sellerAvatar: string | null;
  memberSinceLabel: string;
  activeListingsCount: number;
  sellerAverageRating?: number | null;
  sellerReviewCount?: number;
  onSellerClick?: () => void;
  onChatWithSeller?: () => void;
  onShowPhoneDialog: () => void;
  onShowEditDialog: () => void;
  onShowDeleteDialog: () => void;
  hasOwnerActions: boolean;
  labels: {
    memberSinceShort: string;
    activeListingsShort: string;
    items: string;
    removePost: string;
    viewMyProfile: string;
    soldOut: string;
    callSeller: string;
    viewSellerProfile: string;
    chatWithSeller: string;
    postSoldMessage: string;
    editPost: string;
    reviewCountWord: string;
    noReviews: string;
  };
  isLoading?: boolean;
}

export function PostSellerSidebar({
  language,

  post,
  publicSellerName,
  sellerAvatar,
  memberSinceLabel,
  activeListingsCount,
  sellerAverageRating,
  sellerReviewCount = 0,
  onSellerClick,
  onChatWithSeller,
  onShowPhoneDialog,
  onShowEditDialog,
  onShowDeleteDialog,
  hasOwnerActions,
  labels,
  isLoading,
}: PostSellerSidebarProps) {
  const sellerIdentityContent = (
    <>
      <Avatar className="w-16 h-16 mx-auto mb-2">
        <AvatarImage
          src={resolveAvatarSrc(sellerAvatar) || undefined}
          alt={publicSellerName}
        />
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
          {getAvatarInitial(publicSellerName)}
        </AvatarFallback>
      </Avatar>
      <h3 className="mb-0.5 text-base font-bold text-foreground">
        {publicSellerName}
      </h3>
      {isLoading ? (
        <Skeleton className="mx-auto mt-1.5 h-5 w-28" />
      ) : sellerAverageRating && sellerReviewCount > 0 ? (
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span>
            {sellerAverageRating.toFixed(1)}
            <span className="ms-1 font-medium opacity-70">
              ({sellerReviewCount} {labels.reviewCountWord})
            </span>
          </span>
        </div>
      ) : (
        <p className="mt-1.5 text-xs font-medium text-muted-foreground">
          {labels.noReviews}
        </p>
      )}
    </>
  );

  return (
    <div className="space-y-3 lg:sticky lg:top-24">
      <Card className="rounded-2xl border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 shadow-2xl dark:border-white/10 dark:from-slate-900 dark:to-slate-950/95">
        <CardContent className="pt-5 pb-5">
          {onSellerClick ? (
            <button
              type="button"
              onClick={onSellerClick}
              className="mb-4 block w-full rounded-2xl text-center outline-none transition-all hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-primary/30 dark:hover:bg-white/5"
            >
              {sellerIdentityContent}
            </button>
          ) : (
            <div className="text-center mb-4">{sellerIdentityContent}</div>
          )}

          <Separator className="my-3" />

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-muted-foreground">
                {labels.memberSinceShort}
              </span>
              {isLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <span className="font-semibold text-foreground">
                  {memberSinceLabel}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-muted-foreground">
                {labels.activeListingsShort}
              </span>
              {isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <span className="font-semibold text-foreground">
                  {activeListingsCount}{" "}
                  {activeListingsCount === 1
                    ? language === "ar"
                      ? "منشور"
                      : "post"
                    : labels.items}
                </span>
              )}
            </div>
          </div>

          <Separator className="my-3" />

          <div className="space-y-2.5">
            {hasOwnerActions ? (
              <>
                {post.status === "SOLD" && (
                  <div className="rounded-lg bg-muted p-4 text-center mb-2">
                    <Badge className="border border-border bg-muted/95 px-4 py-2 text-base font-semibold text-muted-foreground backdrop-blur-md dark:bg-white/5 dark:text-slate-200">
                      🏷️ {labels.soldOut}
                    </Badge>
                  </div>
                )}

                <Button
                  className="group w-full text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  onClick={onShowEditDialog}
                  disabled={post.status === "SOLD"}
                >
                  <Edit
                    className={`w-4 h-4 me-2 ${
                      post.status !== "SOLD" ? "group-hover:scale-110" : ""
                    } transition-transform`}
                  />
                  {labels.editPost}
                </Button>

                <Button
                  variant="destructive"
                  className="group w-full text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  onClick={onShowDeleteDialog}
                >
                  <Trash2
                    className={`w-4 h-4 me-2 group-hover:scale-110 transition-transform`}
                  />
                  {labels.removePost}
                </Button>

                <Button
                  variant="outline"
                  className="w-full font-semibold text-base"
                  onClick={onSellerClick}
                >
                  {labels.viewMyProfile}
                </Button>
              </>
            ) : (
              <>
                {post.status === "SOLD" ? (
                  <div className="rounded-lg bg-destructive/10 p-4 text-center dark:bg-destructive/15">
                    <p className="font-semibold text-destructive">
                      {labels.postSoldMessage}
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/92"
                      onClick={onShowPhoneDialog}
                    >
                      <Phone className="h-4 w-4 me-2 text-primary-foreground/90" />
                      {labels.callSeller}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-md transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={onChatWithSeller}
                    >
                      <MessageSquare className="h-4 w-4 me-2 text-slate-500 dark:text-slate-400" />
                      {labels.chatWithSeller}
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  className="w-full h-9 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={onSellerClick}
                >
                  {labels.viewSellerProfile}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
