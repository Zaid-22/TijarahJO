import { translations, type Language } from "../../../translations";

export interface UnifiedProfileLabels {
  joined: string;
  jordan: string;
  reviews: string;
  reviewCountWord: string;
  newSeller: string;
  chatWithSeller: string;
  callSeller: string;
  call: string;
  activeListings: string;
  soldListings: string;
  aboutMe: string;
  noBio: string;
  noActiveListings: string;
  noSoldListings: string;
  writeReview: string;
  reviewPlaceholder: string;
  submitting: string;
  postReview: string;
  noReviews: string;
  userLabel: string;
  loginToReview: string;
  writeComment: string;
  invalidSeller: string;
  reviewSubmitted: string;
  reviewFailed: string;
  reviewError: string;
  addPost: string;
  editProfile: string;
  settings: string;
  editPost: string;
  deletePost: string;
  deletePostConfirm: string;
  cancel: string;
  delete: string;
  viewPost: string;
  reviewsDescription: string;
  reviewPrompt: string;
  rateStar: (star: number) => string;
}

function normalizeLabel(value: string | undefined, fallback: string): string {
  const normalized = String(value || "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

export function buildUnifiedProfileLabels(
  language: Language,
): UnifiedProfileLabels {
  const t = translations[language];
  const isRTL = language === "ar";

  return {
    joined: isRTL ? "انضم" : "Joined",
    jordan: isRTL ? "الأردن" : "Jordan",
    reviews: isRTL ? "التقييمات" : "Reviews",
    reviewCountWord: isRTL ? "تقييم" : "reviews",
    newSeller: isRTL ? "جديد" : "New",
    chatWithSeller: isRTL ? "دردشة" : "Chat",
    callSeller: isRTL ? "اتصال" : "Call",
    call: isRTL ? "اتصال" : "Call",
    activeListings: normalizeLabel(
      t.activeListings,
      isRTL ? "الإعلانات النشطة" : "Active Listings",
    ),
    soldListings: normalizeLabel(
      t.soldListings,
      isRTL ? "الإعلانات المباعة" : "Sold Listings",
    ),
    aboutMe: isRTL ? "نبذة عن البائع" : "About the Seller",
    noBio: isRTL
      ? "لا توجد نبذة متاحة حالياً."
      : "No seller bio available yet.",
    noActiveListings: isRTL
      ? "لا توجد إعلانات نشطة."
      : "No active listings.",
    noSoldListings: isRTL
      ? "لا توجد إعلانات مباعة."
      : "No sold listings.",
    writeReview: isRTL ? "اكتب تقييماً" : "Write a Review",
    reviewPlaceholder: isRTL ? "شارك تجربتك..." : "Share your experience...",
    submitting: isRTL ? "جارٍ الإرسال..." : "Submitting...",
    postReview: isRTL ? "نشر التقييم" : "Post Review",
    noReviews: isRTL ? "لا توجد تقييمات بعد." : "No reviews yet.",
    userLabel: isRTL ? "مستخدم" : "User",
    loginToReview: isRTL
      ? "يرجى تسجيل الدخول لإضافة تقييم"
      : "Please login to review",
    writeComment: isRTL ? "يرجى كتابة تعليق" : "Please write a comment",
    invalidSeller: isRTL ? "معرّف البائع غير صالح" : "Invalid seller ID",
    reviewSubmitted: isRTL ? "تم إرسال التقييم بنجاح!" : "Review submitted!",
    reviewFailed: isRTL ? "فشل إرسال التقييم" : "Failed to submit review",
    reviewError: isRTL
      ? "حدث خطأ أثناء إرسال التقييم"
      : "Error submitting review",
    addPost: normalizeLabel(t.addPost, isRTL ? "إضافة منشور" : "Add Post"),
    editProfile: normalizeLabel(
      t.editProfile,
      isRTL ? "تعديل الملف الشخصي" : "Edit Profile",
    ),
    settings: isRTL ? "الإعدادات" : "Settings",
    editPost: normalizeLabel(
      t.editPost,
      isRTL ? "تعديل المنشور" : "Edit Post",
    ),
    deletePost: normalizeLabel(
      t.deletePost,
      isRTL ? "حذف المنشور" : "Delete Post",
    ),
    deletePostConfirm: normalizeLabel(
      t.deletePostConfirm,
      isRTL
        ? "هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete this post? This action cannot be undone.",
    ),
    cancel: normalizeLabel(t.cancel, isRTL ? "إلغاء" : "Cancel"),
    delete: normalizeLabel(t.delete, isRTL ? "حذف" : "Delete"),
    viewPost: normalizeLabel(t.viewPost, isRTL ? "عرض المنشور" : "View post"),
    reviewsDescription: isRTL
      ? "آراء وتجارب المشترين مع هذا البائع"
      : "Buyer feedback and experience with this seller",
    reviewPrompt: isRTL
      ? "شارك تقييمك لمساعدة الآخرين."
      : "Share your rating to help other buyers.",
    rateStar: (star: number) =>
      isRTL
        ? `قيّم ${star} نجمة${star > 1 ? "ات" : ""}`
        : `Rate ${star} star${star > 1 ? "s" : ""}`,
  };
}
