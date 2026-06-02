import { useEffect, useMemo, useState, useCallback } from "react";
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
  const [fallbackState, setFallbackState] = useState<{ id: string; status: "idle" | "loading" | "done" }>({
    id: "",
    status: "idle",
  });

  useEffect(() => {
    let isCancelled = false;

    if (!id || isLoadingPosts || post) {
      return;
    }

    setFallbackState({ id, status: "loading" });
    setFallbackPost(null);

    (async () => {
      try {
        const fetchedPost = await api.posts.getPost(id);
        if (isCancelled) {
          return;
        }
        setFallbackPost(fetchedPost);
        setFallbackState({ id, status: "done" });
      } catch {
        if (!isCancelled) {
          setFallbackPost(null);
          setFallbackState({ id, status: "done" });
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [id, isLoadingPosts, post]);

  const fallbackPostForRoute =
    fallbackPost && String(fallbackPost.id) === String(id) ? fallbackPost : null;
  const resolvedPost = fallbackPostForRoute || post;
  const isFallbackDoneForId = fallbackState.id === id && fallbackState.status === "done";
  const isLoadingRoutePost = !!id && !resolvedPost && (isLoadingPosts || !isFallbackDoneForId);

  const isOwnPost = useMemo(
    () =>
      resolvedPost
        ? isOwnPostForUser(resolvedPost, userProfile, isAuthenticated)
        : false,
    [resolvedPost, userProfile, isAuthenticated],
  );

  const mutateRoutePost = useCallback((updatedFields: Partial<Post>) => {
    setFallbackPost((prev) => {
      if (prev) {
        return { ...prev, ...updatedFields };
      }
      if (post) {
        return { ...post, ...updatedFields };
      }
      return null;
    });
  }, [post]);

  return {
    resolvedPost,
    isLoadingRoutePost,
    isOwnPost,
    mutateRoutePost,
  };
};
