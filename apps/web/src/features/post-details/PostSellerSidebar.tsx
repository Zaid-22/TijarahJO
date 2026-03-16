import { Edit, MapPin, MessageSquare, Phone, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/ui/avatar";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Card, CardContent } from "../../shared/ui/card";
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
  displayLocationLabel: string;
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
    locationTitle: string;
    editPost: string;
  };
}

export function PostSellerSidebar({
  language,

  post,
  publicSellerName,
  sellerAvatar,
  memberSinceLabel,
  activeListingsCount,
  displayLocationLabel,
  onSellerClick,
  onChatWithSeller,
  onShowPhoneDialog,
  onShowEditDialog,
  onShowDeleteDialog,
  hasOwnerActions,
  labels,
}: PostSellerSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <Avatar className="w-20 h-20 mx-auto mb-3">
              {sellerAvatar && (
                <AvatarImage src={sellerAvatar} alt={publicSellerName} />
              )}
              <AvatarFallback>{publicSellerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="mb-1 text-lg font-bold text-foreground">
              {publicSellerName}
            </h3>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">
                {labels.memberSinceShort}
              </span>
              <span className="font-semibold text-foreground">
                {memberSinceLabel}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">
                {labels.activeListingsShort}
              </span>
              <span className="font-semibold text-foreground">
                {activeListingsCount}{" "}
                {activeListingsCount === 1
                  ? language === "ar"
                    ? "منشور"
                    : "post"
                  : labels.items}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            {hasOwnerActions ? (
              <>
                {post.status === "SOLD" && (
                  <div className="rounded-lg bg-muted p-4 text-center mb-2">
                    <Badge className="border border-border bg-muted/95 px-4 py-2 text-base font-semibold text-muted-foreground backdrop-blur-md">
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
                  <div className="rounded-lg bg-destructive/10 p-4 text-center">
                    <p className="font-semibold text-destructive">
                      {labels.postSoldMessage}
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full text-base font-semibold"
                      type="button"
                      onClick={onShowPhoneDialog}
                    >
                      <Phone className={`w-4 h-4 me-2`} />
                      {labels.callSeller}
                    </Button>

                    <Button
                      variant="secondary"
                      className="w-full text-base font-semibold"
                      onClick={onChatWithSeller}
                    >
                      <MessageSquare
                        className={`w-4 h-4 me-2`}
                      />
                      {labels.chatWithSeller}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full font-semibold text-base"
                  onClick={onSellerClick}
                >
                  {labels.viewSellerProfile}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
            <MapPin className="w-5 h-5 text-primary" />
            {labels.locationTitle}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            {displayLocationLabel}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
