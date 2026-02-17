import { Edit, MapPin, MessageSquare, Phone, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import type { Language, Product } from "../../types";

interface ProductSellerSidebarProps {
  language: Language;
  isRTL: boolean;
  product: Product;
  publicSellerName: string;
  sellerAvatar: string | null;
  memberSinceLabel: string;
  activeListingsCount: number;
  displayLocationLabel: string;
  onSellerClick?: () => void;
  onChatWithSeller?: () => void;
  onShowPhoneDialog: () => void;
  onShowMarkAsSoldDialog: () => void;
  onShowRelistDialog: () => void;
  onShowEditDialog: () => void;
  onShowDeleteDialog: () => void;
  hasOwnerActions: boolean;
  labels: {
    memberSinceShort: string;
    activeListingsShort: string;
    items: string;
    relist?: string;
    markAsSold?: string;
    viewMyProfile?: string;
    soldOut?: string;
    callSeller?: string;
    viewSellerProfile?: string;
    locationTitle: string;
    editPost?: string;
    deletePost?: string;
  };
}

export function ProductSellerSidebar({
  language,
  isRTL,
  product,
  publicSellerName,
  sellerAvatar,
  memberSinceLabel,
  activeListingsCount,
  displayLocationLabel,
  onSellerClick,
  onChatWithSeller,
  onShowPhoneDialog,
  onShowMarkAsSoldDialog,
  onShowRelistDialog,
  onShowEditDialog,
  onShowDeleteDialog,
  hasOwnerActions,
  labels,
}: ProductSellerSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <Avatar className="w-20 h-20 mx-auto mb-3">
              {sellerAvatar && <AvatarImage src={sellerAvatar} alt={publicSellerName} />}
              <AvatarFallback>{publicSellerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="mb-1 text-lg font-bold" style={{ color: "#000000" }}>
              {publicSellerName}
            </h3>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {labels.memberSinceShort}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {memberSinceLabel}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {labels.activeListingsShort}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
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
                {product.status === "SOLD" ? (
                  <Button
                    className="w-full transition-transform duration-150 font-semibold text-base"
                    style={{
                      backgroundColor: "#F97316",
                      color: "white",
                    }}
                    type="button"
                    onClick={onShowRelistDialog}
                  >
                    {labels.relist || "Re-list Post"}
                  </Button>
                ) : (
                  <Button
                    className="w-full transition-transform duration-150 font-semibold text-base"
                    style={{
                      backgroundColor: "#10B981",
                      color: "white",
                    }}
                    type="button"
                    onClick={onShowMarkAsSoldDialog}
                  >
                    {labels.markAsSold || "Mark as Sold"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full font-semibold text-base"
                  onClick={onSellerClick}
                >
                  {labels.viewMyProfile || "View My Profile"}
                </Button>
              </>
            ) : (
              <>
                {product.status === "SOLD" ? (
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-red-600 font-semibold">
                      {labels.soldOut || "This post has been sold"}
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full transition-transform duration-150 font-semibold text-base"
                      style={{
                        backgroundColor: "#0A4ABF",
                        color: "white",
                      }}
                      type="button"
                      onClick={onShowPhoneDialog}
                    >
                      <Phone className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {labels.callSeller || "Call Seller"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full hover:opacity-90 font-semibold text-base"
                      style={{
                        backgroundColor: "#1D4ED8",
                        borderColor: "#1D4ED8",
                        color: "white",
                      }}
                      onClick={onChatWithSeller}
                    >
                      <MessageSquare className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {language === "ar" ? "الدردشة مع البائع" : "Chat with Seller"}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full font-semibold text-base"
                  onClick={onSellerClick}
                >
                  {labels.viewSellerProfile || "View Seller Profile"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold" style={{ color: "#000000" }}>
            <MapPin className="w-5 h-5" style={{ color: "#0A4ABF" }} />
            {labels.locationTitle}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {displayLocationLabel}
          </p>
        </CardContent>
      </Card>

      {hasOwnerActions && (
        <Card className="overflow-hidden border-2" style={{ borderColor: "#0A4ABF20" }}>
          <CardContent className="pt-6 space-y-3">
            {product.status === "SOLD" && (
              <div className="p-4 bg-gray-50 rounded-lg text-center mb-3">
                <Badge
                  className="backdrop-blur-md px-4 py-2 text-base"
                  style={{
                    backgroundColor: "rgba(156, 163, 175, 0.95)",
                    color: "white",
                    border: "none",
                    fontWeight: "600",
                  }}
                >
                  🏷️ {labels.soldOut || "SOLD OUT"}
                </Badge>
              </div>
            )}

            <Button
              className="w-full group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:opacity-90"
              style={{
                backgroundColor: product.status === "SOLD" ? "#9CA3AF" : "#0A4ABF",
                color: "white",
              }}
              onClick={onShowEditDialog}
              disabled={product.status === "SOLD"}
            >
              <Edit
                className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} ${
                  product.status !== "SOLD" ? "group-hover:scale-110" : ""
                } transition-transform`}
              />
              {labels.editPost || "Edit Post"}
            </Button>

            <Button
              className="w-full group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:opacity-90 font-semibold text-base"
              style={{
                backgroundColor: "#EF4444",
                color: "white",
              }}
              onClick={onShowDeleteDialog}
            >
              <Trash2
                className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} group-hover:scale-110 transition-transform`}
              />
              {labels.deletePost || "Delete Post"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
