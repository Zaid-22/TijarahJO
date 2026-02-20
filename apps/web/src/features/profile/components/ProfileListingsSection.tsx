import { useMemo, useState } from "react";
import { Edit, Eye, Package, Plus, Trash2 } from "lucide-react";
import { Product } from "../../../types";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shared/ui/tabs";
import { ProductCard } from "../../marketplace/components/ProductCard";
import { SellItemDialogContent } from "../../marketplace/components/SellItemDialog";
import { EditProductDialog } from "../../marketplace/components/EditProductDialog";
import { CreatePostInput } from "../../../app/routes/appRoutesUtils";
import type { ProfilePageUserProfile } from "../types";

interface ProfileListingsSectionProps {
  language: "en" | "ar";
  isRTL: boolean;
  t: Record<string, string>;
  userProfile: ProfilePageUserProfile;
  activeListings: Product[];
  soldListings: Product[];
  favoriteIds: string[];
  isAuthenticated: boolean;
  currentUserId?: string;
  currentUserDisplayName?: string;
  onProductClick?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateProduct?: (product: Product) => void;
  onAddProduct?: (product: CreatePostInput) => void | Promise<void>;
  onAddProductClick?: () => void;
  onFavoriteToggle?: (productId: string) => void;
}

function EmptyListingsState({
  title,
  description,
  cta,
  isRTL,
  onAddClick,
}: {
  title: string;
  description: string;
  cta: string;
  isRTL: boolean;
  onAddClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-gray-100 dark:bg-gray-800">
        <Package className="w-12 h-12 text-[#0A4ABF]" />
      </div>
      <h3 className="mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      <Button
        onClick={onAddClick}
        className="bg-[#0A4ABF] text-white hover:bg-[#083a99]"
      >
        <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
        {cta}
      </Button>
    </div>
  );
}

export function ProfileListingsSection({
  language,
  isRTL,
  t,
  userProfile,
  activeListings,
  soldListings,
  favoriteIds,
  isAuthenticated,
  currentUserId,
  currentUserDisplayName,
  onProductClick,
  onDeleteProduct,
  onUpdateProduct,
  onAddProduct,
  onAddProductClick,
  onFavoriteToggle,
}: ProfileListingsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const favoriteIdsSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const handleAddPostAction = () => {
    if (onAddProductClick) {
      onAddProductClick();
      return;
    }

    setIsAddDialogOpen(true);
  };

  return (
    <>
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
              className="hover:opacity-90 w-full sm:w-auto bg-[#0A4ABF] text-white hover:bg-[#083a99]"
              onClick={handleAddPostAction}
            >
              <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.addProduct || "Add Post"}
            </Button>
          ) : (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="hover:opacity-90 w-full sm:w-auto bg-[#0A4ABF] text-white hover:bg-[#083a99]"
                  onClick={handleAddPostAction}
                >
                  <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t.addProduct || "Add Post"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.postYourItem || "Post Your Post"}</DialogTitle>
                  <DialogDescription>
                    {t.postItemDescription ||
                      "Fill in the details below to list your post"}
                  </DialogDescription>
                </DialogHeader>
                <SellItemDialogContent
                  language={language}
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
                    location: userProfile.location || userProfile.city || "Amman",
                    city: userProfile.city || "Amman",
                    area: userProfile.area || "",
                    bio: userProfile.bio || "",
                    avatar: userProfile.avatar || "",
                    joinedDate: userProfile.joinedDate || new Date().toISOString(),
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
                    isFavorite={favoriteIdsSet.has(product.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    isAuthenticated={isAuthenticated}
                    currentUserId={isAuthenticated ? currentUserId : undefined}
                    currentUserDisplayName={currentUserDisplayName}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyListingsState
              title={t.noActiveListings || "No Active Listings"}
              description={
                t.noActiveListingsDescription ||
                "You don't have any active listings. Start selling by adding your first product!"
              }
              cta={t.addProduct || "Add Post"}
              isRTL={isRTL}
              onAddClick={handleAddPostAction}
            />
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
                    isFavorite={favoriteIdsSet.has(product.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    isAuthenticated={isAuthenticated}
                    currentUserId={isAuthenticated ? currentUserId : undefined}
                    currentUserDisplayName={currentUserDisplayName}
                  />
                  <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onProductClick ? (
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
                        <Eye className="w-4 h-4 text-[#0A4ABF]" />
                      </Button>
                    ) : null}

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
                      <Edit className="w-4 h-4 text-[#0A4ABF]" />
                    </Button>

                    {onDeleteProduct ? (
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
                        <Trash2 className="w-4 h-4 text-[#EF4444]" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyListingsState
              title={t.noSoldListings || "No Sold Listings"}
              description={
                t.noSoldListingsDescription ||
                "You don't have any sold listings. Start selling by adding your first product!"
              }
              cta={t.addProduct || "Add Post"}
              isRTL={isRTL}
              onAddClick={handleAddPostAction}
            />
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={productToDelete !== null}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteProduct || "Delete Post"}</AlertDialogTitle>
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
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={productToEdit !== null} onOpenChange={() => setProductToEdit(null)}>
        {productToEdit ? (
          <EditProductDialog
            product={productToEdit}
            onSave={(updatedProduct) => {
              setProductToEdit(null);
              if (onUpdateProduct) {
                onUpdateProduct(updatedProduct);
              }
            }}
            onCancel={() => setProductToEdit(null)}
            language={language}
          />
        ) : null}
      </Dialog>
    </>
  );
}
