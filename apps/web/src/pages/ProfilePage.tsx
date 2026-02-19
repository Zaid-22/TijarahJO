import {
  MapPin,
  Calendar,
  Package,
  Edit,
  Phone,
  Plus,
  Trash2,
  Eye,
  Settings,
} from "lucide-react";
import { translations, Language } from "../translations";
import { Product } from "../types";
import { Button } from "../shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../shared/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../shared/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../shared/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../shared/ui/alert-dialog";
import { ProductCard } from "../features/marketplace/components/ProductCard";
import { SellItemDialogContent } from "../features/marketplace/components/SellItemDialog";
import { EditProductDialog } from "../features/marketplace/components/EditProductDialog";
import { useState } from "react";
import { CreatePostInput } from "../app/routes/appRoutesUtils";

export interface UserProfile {
  id: string;
  name: string; // Computed from firstName + lastName
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  city?: string; // City field for better location handling
  area?: string; // Area/neighborhood within the city
  bio: string;
  avatar?: string;
  joinedDate: string;
}

interface ProfilePageProps {
  onBackToMarketplace: () => void;
  products: Product[];
  onProductClick?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateProduct?: (product: Product) => void;
  onAddProduct?: (product: CreatePostInput) => void | Promise<void>;
  onAddProductClick?: () => void;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  language?: Language;
  userProfile: UserProfile;
  favoriteIds?: string[];
  onFavoriteToggle?: (productId: string) => void;
  isAuthenticated?: boolean;
  currentUserDisplayName?: string;
}

export function ProfilePage({
  onBackToMarketplace,
  products = [],
  onProductClick,
  onDeleteProduct,
  onUpdateProduct,
  onAddProduct,
  onAddProductClick,
  onSettingsClick,
  onEditProfileClick,
  language = "en",
  userProfile,
  favoriteIds = [],
  onFavoriteToggle,
  isAuthenticated = false,
  currentUserDisplayName,
}: ProfilePageProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const normalizedCurrentUserId = String(userProfile.id || "").trim();
  const normalizedCurrentUserDisplayName = String(currentUserDisplayName || "")
    .trim()
    .toLowerCase();
  const normalizedProfileName = String(userProfile.name || "")
    .trim()
    .toLowerCase();

  const handleAddPostAction = () => {
    if (onAddProductClick) {
      onAddProductClick();
      return;
    }
    setIsAddDialogOpen(true);
  };

  // Filter products for current user
  // Use multiple checks to ensure we match products correctly:
  // 1. Compare sellerId with userProfile.id (most reliable)
  // 2. Compare seller name with currentUserDisplayName (fallback)
  // 3. Compare seller with name (another fallback)
  const myProducts = products.filter(
    (p) => {
      const normalizedSellerId = String(p.sellerId || "").trim();
      const normalizedSellerName = String(p.seller || "")
        .trim()
        .toLowerCase();

      return (
        (normalizedCurrentUserId.length > 0 &&
          normalizedSellerId === normalizedCurrentUserId) ||
        (normalizedCurrentUserDisplayName.length > 0 &&
          normalizedSellerName === normalizedCurrentUserDisplayName) ||
        (normalizedProfileName.length > 0 &&
          normalizedSellerName === normalizedProfileName)
      );
    },
  );

  // Separate into active and sold listings (don't show DELETED)
  const activeListings = myProducts.filter(
    (p) => p.status !== "SOLD" && p.status !== "DELETED",
  );
  const soldListings = myProducts.filter((p) => p.status === "SOLD");

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Profile Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0A4ABF 0%, #3E7EFF 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 px-2 sm:px-4"
              onClick={onBackToMarketplace}
            >
              ← {t.backToMarketplace || "Back to Marketplace"}
            </Button>
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={onSettingsClick}
              >
                <Settings className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                <span className="hidden sm:inline">
                  {t.settings || "Settings"}
                </span>
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback className="text-xl sm:text-2xl">
                {userProfile.firstName?.[0] || ""}
                {userProfile.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-white w-full sm:w-auto">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl">{userProfile.name}</h1>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm opacity-90 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {userProfile.city || userProfile.location}
                    {userProfile.area ? `, ${userProfile.area}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {t.memberSince || "Member since"} {userProfile.joinedDate}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  style={{
                    backgroundColor: "white",
                    color: "#0A4ABF",
                  }}
                  className="hover:bg-gray-100"
                  onClick={onEditProfileClick}
                >
                  <Edit className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                  <span className="hidden xs:inline">
                    {t.editProfile || "Edit Profile"}
                  </span>
                  <span className="xs:hidden">Edit</span>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="w-full sm:w-auto flex justify-center sm:justify-start gap-6 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl">{activeListings.length}</div>
                <div className="text-sm opacity-90">
                  {t.activeListings || "Active"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t.contactInformation || "Contact Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" style={{ color: "#0A4ABF" }} />
                  <div>
                    <div className="text-sm opacity-60">
                      {t.phone || "Phone"}
                    </div>
                    <div>{userProfile.phone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>{t.about || "About"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm opacity-80">{userProfile.bio}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Listings */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="active" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="active">
                    <Package className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.activeListings || "Active"} ({activeListings.length})
                  </TabsTrigger>
                  <TabsTrigger value="sold">
                    <Package className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.soldListings || "Sold"} ({soldListings.length})
                  </TabsTrigger>
                </TabsList>

                {onAddProductClick ? (
                    <Button
                      size="sm"
                      style={{
                        backgroundColor: "#0A4ABF",
                        color: "white",
                      }}
                      className="hover:opacity-90 w-full sm:w-auto"
                      onClick={handleAddPostAction}
                    >
                      <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t.addProduct || "Add Post"}
                    </Button>
                ) : (
                  <Dialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: "#0A4ABF",
                          color: "white",
                        }}
                        className="hover:opacity-90 w-full sm:w-auto"
                        onClick={handleAddPostAction}
                      >
                        <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t.addProduct || "Add Post"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {t.postYourItem || "Post Your Post"}
                        </DialogTitle>
                        <DialogDescription>
                          {t.postItemDescription ||
                            "Fill in the details below to list your post"}
                        </DialogDescription>
                      </DialogHeader>
                      <SellItemDialogContent
                        language={language || "en"}
                        onClose={() => setIsAddDialogOpen(false)}
                        onSubmit={(product) => {
                          if (onAddProduct) {
                            void onAddProduct(product);
                          }
                        }}
                        userProfile={{
                          id: userProfile.id || "",
                          name: userProfile.name || "",
                          firstName: userProfile.firstName || "",
                          lastName: userProfile.lastName || "",
                          email: userProfile.email || "",
                          phone: userProfile.phone || "+962",
                          location:
                            userProfile.location || userProfile.city || "Amman",
                          city: userProfile.city || "Amman",
                          area: userProfile.area || "",
                          bio: userProfile.bio || "",
                          avatar: userProfile.avatar || "",
                          joinedDate:
                            userProfile.joinedDate || new Date().toISOString(),
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <TabsContent value="active" className="mt-0">
                {activeListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    {activeListings.map((product) => (
                      <div key={product.id} className="relative group">
                        <ProductCard
                          product={product}
                          onProductClick={onProductClick}
                          isFavorite={favoriteIds.includes(product.id)}
                          onFavoriteToggle={onFavoriteToggle}
                          isAuthenticated={isAuthenticated}
                          currentUserId={
                            isAuthenticated
                              ? normalizedCurrentUserId || undefined
                              : undefined
                          }
                          currentUserDisplayName={currentUserDisplayName}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-gray-100 dark:bg-gray-800">
                      <Package
                        className="w-12 h-12"
                        style={{ color: "#0A4ABF" }}
                      />
                    </div>
                    <h3 className="mb-3 text-gray-900 dark:text-white">
                      {t.noActiveListings || "No Active Listings"}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      {t.noActiveListingsDescription ||
                        "You don't have any active listings. Start selling by adding your first product!"}
                    </p>
                    <Button
                      onClick={handleAddPostAction}
                      style={{
                        backgroundColor: "#0A4ABF",
                        color: "white",
                      }}
                    >
                      <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t.addProduct || "Add Post"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sold" className="mt-0">
                {soldListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {soldListings.map((product) => (
                      <div key={product.id} className="relative group">
                        <ProductCard
                          product={product}
                          onProductClick={onProductClick}
                          isFavorite={favoriteIds.includes(product.id)}
                          onFavoriteToggle={onFavoriteToggle}
                          isAuthenticated={isAuthenticated}
                          currentUserId={
                            isAuthenticated
                              ? normalizedCurrentUserId || undefined
                              : undefined
                          }
                          currentUserDisplayName={currentUserDisplayName}
                        />
                        <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onProductClick && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 bg-white/90 backdrop-blur-sm hover:bg-blue-50 shadow-md rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProductClick(product.id);
                              }}
                              title={t.viewProduct || "View product"}
                            >
                              <Eye
                                className="w-4 h-4"
                                style={{ color: "#0A4ABF" }}
                              />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 bg-white/90 backdrop-blur-sm hover:bg-blue-50 shadow-md rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToEdit(product);
                            }}
                            title={t.editProduct || "Edit Post"}
                          >
                            <Edit
                              className="w-4 h-4"
                              style={{ color: "#0A4ABF" }}
                            />
                          </Button>
                          {onDeleteProduct && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 bg-white/90 backdrop-blur-sm hover:bg-red-50 shadow-md rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductToDelete(product.id);
                              }}
                              title={t.deleteProduct || "Delete Post"}
                            >
                              <Trash2
                                className="w-4 h-4"
                                style={{ color: "#EF4444" }}
                              />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-gray-100 dark:bg-gray-800">
                      <Package
                        className="w-12 h-12"
                        style={{ color: "#0A4ABF" }}
                      />
                    </div>
                    <h3 className="mb-3 text-gray-900 dark:text-white">
                      {t.noSoldListings || "No Sold Listings"}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      {t.noSoldListingsDescription ||
                        "You don't have any sold listings. Start selling by adding your first product!"}
                    </p>
                    <Button
                      onClick={handleAddPostAction}
                      style={{
                        backgroundColor: "#0A4ABF",
                        color: "white",
                      }}
                    >
                      <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t.addProduct || "Add Post"}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={productToDelete !== null}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.deleteProduct || "Delete Post"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteProductConfirm ||
                "Are you sure you want to delete this post? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete && onDeleteProduct) {
                  onDeleteProduct(productToDelete);
                }
                setProductToDelete(null);
              }}
              style={{
                backgroundColor: "#EF4444",
                color: "white",
              }}
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={productToEdit !== null}
        onOpenChange={() => setProductToEdit(null)}
      >
        {productToEdit && (
          <EditProductDialog
            product={productToEdit}
            onSave={(updatedProduct) => {
              // In a real app, you would call an API to update the product
              // For now, we'll just close the dialog
              setProductToEdit(null);
              // Optionally trigger a refresh or update the product in the list
              if (onUpdateProduct) {
                onUpdateProduct(updatedProduct);
              }
            }}
            onCancel={() => setProductToEdit(null)}
            language={language}
          />
        )}
      </Dialog>
    </div>
  );
}
