import { toast } from "sonner";

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Share content using native share API or fallback to clipboard
 * Works on all platforms (desktop and mobile)
 */
export const shareContent = async (
  data: ShareData,
  language: "en" | "ar" = "en"
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
          description: language === "ar" 
            ? "يمكنك الآن لصق الرابط في أي مكان"
            : "You can now paste the link anywhere",
          duration: 3000,
        }
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
    console.error("Share failed:", error);
    
    // Fallback: try to copy to clipboard again
    try {
      await navigator.clipboard.writeText(data.url);
      toast.success(
        language === "ar" ? "تم نسخ الرابط" : "Link copied",
        {
          duration: 2000,
        }
      );
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
        }
      );
      return false;
    }
  }
};

/**
 * Generate share URL for a product
 */
export const getProductShareUrl = (productId: string): string => {
  // In production, this would be the actual domain
  const baseUrl = window.location.origin;
  return `${baseUrl}?product=${productId}`;
};

/**
 * Generate share data for a product
 */
export const getProductShareData = (product: {
  id: string;
  name: string;
  price: number;
  category: string;
  location: string;
}): ShareData => {
  const url = getProductShareUrl(product.id);
  const title = `${product.name} - TijarahJo`;
  const text = `Check out this ${product.category} for ${product.price} JOD in ${product.location} on TijarahJo!\n\n${product.name}`;
  
  return { title, text, url };
};

/**
 * Share a product
 */
export const shareProduct = async (
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    location: string;
  },
  language: "en" | "ar" = "en"
): Promise<boolean> => {
  const shareData = getProductShareData(product);
  return shareContent(shareData, language);
};
