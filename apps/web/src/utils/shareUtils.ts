import { toast } from "sonner";
import { logger } from "../shared/lib/logger";

interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Share content using native share API or fallback to clipboard
 * Works on all platforms (desktop and mobile)
 */
const shareContent = async (
  data: ShareData,
  language: "en" | "ar" = "en",
): Promise<boolean> => {
  try {
    // Check if native share is available (mobile browsers and some desktop browsers)
    if (navigator.share && navigator.canShare?.(data)) {
      await navigator.share(data);
      return true;
    } else {
      // Desktop fallback - copy to clipboard
      await navigator.clipboard.writeText(data.url);

      // Show success toast
      toast.success(
        language === "ar" ? "تم نسخ الرابط" : "Link copied to clipboard",
        {
          description:
            language === "ar"
              ? "يمكنك الآن لصق الرابط في أي مكان"
              : "You can now paste the link anywhere",
          duration: 3000,
        },
      );

      return true;
    }
  } catch (error) {
    // Handle user cancellation (AbortError)
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled the share - this is normal, don't show error
      return false;
    }

    // Handle other errors
    logger.warn("Share failed:", error);

    // Fallback: try to copy to clipboard again
    try {
      await navigator.clipboard.writeText(data.url);
      toast.success(language === "ar" ? "تم نسخ الرابط" : "Link copied", {
        duration: 2000,
      });
      return true;
    } catch (clipboardError) {
      // Final fallback - show manual copy prompt
      toast.error(
        language === "ar"
          ? "فشلت المشاركة. يرجى نسخ الرابط يدوياً"
          : "Share failed. Please copy the link manually",
        {
          description: data.url,
          duration: 5000,
        },
      );
      return false;
    }
  }
};

/**
 * Generate share URL for a post
 */
const getPostShareUrl = (postId: string): string => {
  // In postion, this would be the actual domain
  const baseUrl = window.location.origin;
  return `${baseUrl}?post=${postId}`;
};

/**
 * Generate share data for a post
 */
const getPostShareData = (post: {
  id: string;
  name: string;
  price: number;
  category: string;
  location: string;
}): ShareData => {
  const url = getPostShareUrl(post.id);
  const title = `${post.name} - TijarahJo`;
  const text = `Check out this ${post.category} for ${post.price} JOD in ${post.location} on TijarahJo!\n\n${post.name}`;

  return { title, text, url };
};

/**
 * Share a post
 */
export const sharePost = async (
  post: {
    id: string;
    name: string;
    price: number;
    category: string;
    location: string;
  },
  language: "en" | "ar" = "en",
): Promise<boolean> => {
  const shareData = getPostShareData(post);
  return shareContent(shareData, language);
};
