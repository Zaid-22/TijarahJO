import { type MouseEvent, useMemo, useState } from "react";
import { Edit, Eye, Package, Plus, Trash2 } from "lucide-react";
import { Post } from "../../../types";
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
import { PostCard } from "../../marketplace/components/PostCard";
import { MarketplaceEmptyState } from "../../marketplace/components/MarketplaceEmptyState";
import { SellItemDialogContent } from "../../marketplace/components/SellItemDialog";
import { EditPostDialog } from "../../marketplace/components/EditPostDialog";
import { CreatePostInput } from "../../../app/routes/appRoutesUtils";
import { UpdatePostInput } from "../../../app/routes/usePostActions";
import type { ProfilePageUserProfile } from "../types";

interface ProfileListingsSectionProps {
  language: "en" | "ar";
  isRTL: boolean;
  t: Record<string, string>;
  userProfile: ProfilePageUserProfile;
  activeListings: Post[];
  soldListings: Post[];
  favoriteIds: string[];
  isAuthenticated: boolean;
  currentUserId?: string;
  currentUserDisplayName?: string;
  onPostClick?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onUpdatePost?: (post: UpdatePostInput) => void;
  onAddPost?: (post: CreatePostInput) => void | Promise<void>;
  onAddPostClick?: () => void;
  onFavoriteToggle?: (postId: string) => void;
}

export function ProfileListingsSection({
  language,

  t,
  userProfile,
  activeListings,
  soldListings,
  favoriteIds,
  isAuthenticated,
  currentUserId,
  currentUserDisplayName,
  onPostClick,
  onDeletePost,
  onUpdatePost,
  onAddPost,
  onAddPostClick,
  onFavoriteToggle,
}: ProfileListingsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const favoriteIdsSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const defaultCity = language === "ar" ? "عمّان" : "Amman";

  const handleAddPostAction = () => {
    if (onAddPostClick) {
      onAddPostClick();
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
              <Package className={`w-4 h-4 me-2`} />
              {t.activeListings} ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="sold">
              <Package className={`w-4 h-4 me-2`} />
              {t.soldListings} ({soldListings.length})
            </TabsTrigger>
          </TabsList>

          {onAddPostClick ? (
            <Button
              size="sm"
              className="w-full sm:w-auto hover:opacity-90"
              onClick={handleAddPostAction}
            >
              <Plus className={`w-4 h-4 me-2`} />
              {t.addPost}
            </Button>
          ) : (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-full sm:w-auto hover:opacity-90"
                  onClick={handleAddPostAction}
                >
                  <Plus className={`w-4 h-4 me-2`} />
                  {t.addPost}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-dialog-90vh overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.postYourItem}</DialogTitle>
                  <DialogDescription>{t.postItemDescription}</DialogDescription>
                </DialogHeader>
                <SellItemDialogContent
                  language={language}
                  onClose={() => setIsAddDialogOpen(false)}
                  onSubmit={(post) => {
                    if (onAddPost) {
                      void onAddPost(post);
                    }
                  }}
                  userProfile={{
                    id: userProfile.id || "",
                    name: userProfile.name || "",
                    firstName: userProfile.firstName || "",
                    lastName: userProfile.lastName || "",
                    email: userProfile.email || "",
                    phone: userProfile.phone || "+962",
                    location: userProfile.location || userProfile.city || defaultCity,
                    city: userProfile.city || defaultCity,
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
              {activeListings.map((post) => (
                <div key={post.id} className="relative group">
                  <PostCard
                    post={post}
                    onPostClick={onPostClick}
                    isFavorite={favoriteIdsSet.has(post.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    isAuthenticated={isAuthenticated}
                    currentUserId={isAuthenticated ? currentUserId : undefined}
                    currentUserDisplayName={currentUserDisplayName}
                    language={language}
                  />
                </div>
              ))}
            </div>
          ) : (
            <MarketplaceEmptyState
              title={t.noActiveListings}
              description={t.noActiveListingsDescription}
              actionLabel={t.addPost}
              onAction={handleAddPostAction}
              icon={Package}
              className="py-20"
            />
          )}
        </TabsContent>

        <TabsContent value="sold" className="mt-0">
          {soldListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {soldListings.map((post) => (
                <div key={post.id} className="relative group">
                  <PostCard
                    post={post}
                    onPostClick={onPostClick}
                    isFavorite={favoriteIdsSet.has(post.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    isAuthenticated={isAuthenticated}
                    currentUserId={isAuthenticated ? currentUserId : undefined}
                    currentUserDisplayName={currentUserDisplayName}
                    language={language}
                  />
                  <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onPostClick ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl bg-background/90 p-0 shadow-md backdrop-blur-sm hover:bg-muted"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          onPostClick(post.id);
                        }}
                        title={t.viewPost}
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </Button>
                    ) : null}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl bg-background/90 p-0 shadow-md backdrop-blur-sm hover:bg-muted"
                      onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        setPostToEdit(post);
                      }}
                      title={t.editPost}
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>

                    {onDeletePost ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl bg-background/90 p-0 shadow-md backdrop-blur-sm hover:bg-destructive/10"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          setPostToDelete(post.id);
                        }}
                        title={t.deletePost}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <MarketplaceEmptyState
              title={t.noSoldListings}
              description={t.noSoldListingsDescription}
              actionLabel={t.addPost}
              onAction={handleAddPostAction}
              icon={Package}
              className="py-20"
            />
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={postToDelete !== null}
        onOpenChange={() => setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deletePost}</AlertDialogTitle>
            <AlertDialogDescription>{t.deletePostConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (postToDelete && onDeletePost) {
                  onDeletePost(postToDelete);
                }
                setPostToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={postToEdit !== null} onOpenChange={() => setPostToEdit(null)}>
        {postToEdit ? (
          <EditPostDialog
            post={postToEdit}
            onSave={(updatedPost) => {
              setPostToEdit(null);
              if (onUpdatePost) {
                onUpdatePost(updatedPost);
              }
            }}
            onCancel={() => setPostToEdit(null)}
            language={language}
          />
        ) : null}
      </Dialog>
    </>
  );
}
