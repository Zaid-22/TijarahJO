import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { Post, UserProfile } from "../../types";
import { isOwnPostForUser } from "./appRoutesUtils";

interface UsePostDetailsRouteDataParams {
  id: string | undefined;
  availablePosts: Post[];
  isLoadingPosts: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile;
}

export const usePostDetailsRouteData = ({
  id,
  availablePosts,
  isLoadingPosts,
  isAuthenticated,
  userProfile,
}: UsePostDetailsRouteDataParams) => {
  const post = availablePosts.find((item) => item.id === id);
  const [fallbackPost, setFallbackPost] = useState<Post | null>(null);
  const [isLoadingFallbackPost, setIsLoadingFallbackPost] =
    useState(false);

  useEffect(() => {
    let isCancelled = false;

    setFallbackPost(null);

    if (!id || isLoadingPosts || post) {
      setIsLoadingFallbackPost(false);
      return;
    }

    setIsLoadingFallbackPost(true);

    (async () => {
      try {
        const fetchedPost = await api.posts.getPost(id);
        if (isCancelled) {
          return;
        }
        setFallbackPost(fetchedPost);
      } catch {
        if (!isCancelled) {
          setFallbackPost(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFallbackPost(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [id, isLoadingPosts, post]);

  const resolvedPost = post || fallbackPost;
  const isLoadingRoutePost =
    (isLoadingPosts || isLoadingFallbackPost) && !resolvedPost;

  const isOwnPost = useMemo(
    () =>
      resolvedPost
        ? isOwnPostForUser(resolvedPost, userProfile, isAuthenticated)
        : false,
    [resolvedPost, userProfile, isAuthenticated],
  );

  return {
    resolvedPost,
    isLoadingRoutePost,
    isOwnPost,
  };
};
