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

interface FallbackPostState {
  id: string;
  status: "idle" | "loading" | "done";
  error: string | null;
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
  const [fallbackState, setFallbackState] = useState<FallbackPostState>({
    id: "",
    status: "idle",
    error: null,
  });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    if (!id || isLoadingPosts || post) {
      return;
    }

    setFallbackState({ id, status: "loading", error: null });
    setFallbackPost(null);

    (async () => {
      try {
        const fetchedPost = await api.posts.getPost(id);
        if (isCancelled) {
          return;
        }
        setFallbackPost(fetchedPost);
        setFallbackState({ id, status: "done", error: null });
      } catch (error) {
        if (!isCancelled) {
          setFallbackPost(null);
          setFallbackState({
            id,
            status: "done",
            error:
              error instanceof Error
                ? error.message
                : "Failed to load post",
          });
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [id, isLoadingPosts, post, retryKey]);

  const fallbackPostForRoute =
    fallbackPost && String(fallbackPost.id) === String(id) ? fallbackPost : null;
  const resolvedPost = fallbackPostForRoute || post;
  const isFallbackDoneForId = fallbackState.id === id && fallbackState.status === "done";
  const isLoadingRoutePost = !!id && !resolvedPost && (isLoadingPosts || !isFallbackDoneForId);
  const routePostError =
    !resolvedPost && isFallbackDoneForId ? fallbackState.error : null;

  const retryRoutePost = useCallback(() => {
    setFallbackState({ id: id || "", status: "idle", error: null });
    setRetryKey((currentKey) => currentKey + 1);
  }, [id]);

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

  const replaceRoutePost = useCallback((nextPost: Post) => {
    setFallbackPost(nextPost);
    setFallbackState({ id: nextPost.id, status: "done", error: null });
  }, []);

  return {
    resolvedPost,
    isLoadingRoutePost,
    routePostError,
    retryRoutePost,
    isOwnPost,
    mutateRoutePost,
    replaceRoutePost,
  };
};
