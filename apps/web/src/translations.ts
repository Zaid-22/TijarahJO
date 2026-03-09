import { Language } from "./types";

// Re-export Language type for convenience
export type { Language };

/** All valid translation keys — use this type for compile-time safety. */
export type TranslationKey =
  | "heroTitle"
  | "heroSubtitle"
  | "browseItems"
  | "startSelling"
  | "categoriesTitle"
  | "categoriesSubtitle"
  | "viewAll"
  | "searchPlaceholder"
  | "backToMarketplace"
  | "back"
  | "filters"
  | "priceRange"
  | "allPrices"
  | "sortBy"
  | "mostRecent"
  | "priceLowToHigh"
  | "priceHighToLow"
  | "nameAZ"
  | "activeFilters"
  | "clearAll"
  | "clearFilters"
  | "favorites"
  | "noFavorites"
  | "noFavoritesDescription"
  | "browseListing"
  | "myProfile"
  | "memberSince"
  | "editProfile"
  | "activeListings"
  | "soldListings"
  | "addPost"
  | "postYourItem"
  | "noActiveListings"
  | "noActiveListingsDescription"
  | "noSoldListings"
  | "noSoldListingsDescription"
  | "viewPost"
  | "editPost"
  | "deletePostConfirm"
  | "cancel"
  | "delete"
  | "contactInformation"
  | "phone"
  | "about"
  | "chatWithSeller"
  | "postSoldMessage"
  | "sellItem"
  | "sellItemDescription"
  | "itemTitle"
  | "itemTitlePlaceholder"
  | "price"
  | "pricePlaceholder"
  | "category"
  | "categoryPlaceholder"
  | "location"
  | "locationPlaceholder"
  | "itemImages"
  | "uploadImages"
  | "imagesHint"
  | "description"
  | "descriptionPlaceholder"
  | "postItemButton"
  | "backToListings"
  | "marketplace"
  | "removePost"
  | "whyRemovingPost"
  | "reasonSold"
  | "reasonNoLongerAvailable"
  | "reasonMistake"
  | "reasonOther"
  | "otherReasonPlaceholder"
  | "confirmRemove"
  | "viewMyProfile"
  | "viewSellerProfile"
  | "deletePost"
  | "callSeller"
  | "soldOut"
  | "descriptionTitle"
  | "locationTitle"
  | "postedDaysAgo"
  | "views"
  | "jordan"
  | "memberSinceShort"
  | "activeListingsShort"
  | "items"
  | "postStatisticsTitle"
  | "totalViewsLabel"
  | "postStatusLabel"
  | "imagesCountLabel"
  | "postedAtLabel"
  | "updatedAtLabel"
  | "statusActive"
  | "statusSold"
  | "statusDeleted"
  | "notAvailable"
  // Menu
  | "menu"
  | "menuDescription"
  // Form validation
  | "titleRequired"
  | "categoryRequired"
  | "locationRequired"
  | "imagesRequired"
  | "fileSizeTooLarge"
  | "invalidFileType"
  // Profile edit
  | "profilePicture"
  | "profilePictureDesc"
  | "uploadPhoto"
  | "removePhoto"
  | "photoRequirements"
  | "personalInformation"
  | "personalInformationDesc"
  | "firstName"
  | "enterFirstName"
  | "middleName"
  | "enterMiddleName"
  | "lastName"
  | "enterLastName"
  | "enterPhone"
  | "city"
  | "selectCity"
  | "area"
  | "enterArea"
  | "bio"
  | "enterBio"
  | "characters"
  | "accountStatistics"
  | "accountStatisticsDesc"
  | "saveChanges";

/** Typed translation map — guarantees all keys exist. */
export type TranslationMap = Record<TranslationKey, string>;

export const translations: Record<Language, TranslationMap> = {
  en: {
    heroTitle: "Buy & Sell Anything in Jordan",
    heroSubtitle: "Your trusted marketplace for new and used posts",
    browseItems: "Browse Posts",
    startSelling: "Start Selling",
    categoriesTitle: "Shop by Category",
    categoriesSubtitle: "Explore thousands of posts across Jordan",
    viewAll: "View All",
    searchPlaceholder: "Search in TijarahJo...",
    backToMarketplace: "Back to Marketplace",
    back: "Back",
    filters: "Filters",
    priceRange: "Price Range",
    allPrices: "All Prices",
    sortBy: "Sort By",
    mostRecent: "Most Recent",
    priceLowToHigh: "Price: Low to High",
    priceHighToLow: "Price: High to Low",
    nameAZ: "Name: A-Z",
    activeFilters: "Active filters",
    clearAll: "Clear all",
    clearFilters: "Clear Filters",
    favorites: "My Favorites",
    noFavorites: "No Favorites Yet",
    noFavoritesDescription:
      "Start adding items to your favorites to see them here. Click the heart icon on any post to save it.",
    browseListing: "Browse Listings",
    myProfile: "My Profile",
    memberSince: "Member since",
    editProfile: "Edit Profile",
    activeListings: "Active Listings",
    soldListings: "Sold Listings",
    addPost: "Add Post",
    postYourItem: "Post Your Post",
    noActiveListings: "No Active Listings",
    noActiveListingsDescription:
      "You don't have any active listings. Start selling by adding your first post!",
    noSoldListings: "No Sold Listings",
    noSoldListingsDescription:
      "You don't have any sold listings. Start selling by adding your first post!",
    viewPost: "View post",
    editPost: "Edit Post",
    deletePostConfirm:
      "Are you sure you want to delete this post? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    contactInformation: "Contact Information",
    phone: "Phone",
    about: "About",
    chatWithSeller: "Chat with Seller",
    postSoldMessage: "This post has been sold",
    // Create Post Page
    sellItem: "Create Post",
    sellItemDescription: "Fill in the details below to list your post for sale",
    itemTitle: "Post Name",
    itemTitlePlaceholder: "e.g. iPhone 13 Pro",
    price: "Price (JOD)",
    pricePlaceholder: "0.00",
    category: "Category",
    categoryPlaceholder: "e.g. Electronics",
    location: "City",
    locationPlaceholder: "e.g. Amman",
    itemImages: "Post Images",
    uploadImages: "Upload Images",
    imagesHint: "Add up to 5 images. First image will be the cover photo.",
    description: "Description",
    descriptionPlaceholder: "Describe your post...",
    postItemButton: "Publish Post",
    // Post Details Page
    backToListings: "Back to Listings",
    marketplace: "Marketplace",
    removePost: "Remove Post",
    whyRemovingPost: "Why are you removing this post?",
    reasonSold: "It was sold",
    reasonNoLongerAvailable: "No longer available",
    reasonMistake: "Listed by mistake",
    reasonOther: "Other",
    otherReasonPlaceholder: "Tell us more...",
    confirmRemove: "Confirm Removal",
    viewMyProfile: "View My Profile",
    viewSellerProfile: "View Seller Profile",
    deletePost: "Delete Post",
    callSeller: "Call Seller",
    soldOut: "SOLD OUT",
    descriptionTitle: "Description",
    locationTitle: "Location",
    postedDaysAgo: "Posted 2 days ago",
    views: "views",
    jordan: "Jordan",
    memberSinceShort: "Member since",
    activeListingsShort: "Active listings",
    items: "posts",
    postStatisticsTitle: "Post Statistics",
    totalViewsLabel: "Total views",
    postStatusLabel: "Status",
    imagesCountLabel: "Images",
    postedAtLabel: "Posted at",
    updatedAtLabel: "Last updated",
    statusActive: "Active",
    statusSold: "Sold",
    statusDeleted: "Deleted",
    notAvailable: "N/A",
    // Menu
    menu: "Menu",
    menuDescription: "Navigate through TijarahJo",
    // Form validation
    titleRequired: "Title is required",
    categoryRequired: "Category is required",
    locationRequired: "Location is required",
    imagesRequired: "At least one image is required",
    fileSizeTooLarge: "File size is too large",
    invalidFileType: "Invalid file type",
    // Profile edit
    profilePicture: "Profile Picture",
    profilePictureDesc: "Upload a photo to personalize your profile",
    uploadPhoto: "Upload Photo",
    removePhoto: "Remove Photo",
    photoRequirements: "JPG, PNG or WebP. Max 5MB.",
    personalInformation: "Personal Information",
    personalInformationDesc: "Update your personal details",
    firstName: "First Name",
    enterFirstName: "Enter first name",
    middleName: "Middle Name",
    enterMiddleName: "Enter middle name",
    lastName: "Last Name",
    enterLastName: "Enter last name",
    enterPhone: "Enter phone number",
    city: "City",
    selectCity: "Select city",
    area: "Area",
    enterArea: "Enter area",
    bio: "Bio",
    enterBio: "Tell us about yourself...",
    characters: "characters",
    accountStatistics: "Account Statistics",
    accountStatisticsDesc: "Overview of your account activity",
    saveChanges: "Save Changes",
  },
  ar: {
    heroTitle: "اشتري وبيع أي شيء في الأردن",
    heroSubtitle: "سوقك الموثوق للمنشورات الجديدة والمستعملة",
    browseItems: "تصفح المنشورات",
    startSelling: "ابدأ البيع",
    categoriesTitle: "تسوق حسب الفئة",
    categoriesSubtitle: "استكشف آلاف المنشورات في جميع أنحاء الأردن",
    viewAll: "عرض الكل",
    searchPlaceholder: "ابحث في تجارة جو...",
    backToMarketplace: "العودة إلى السوق",
    back: "العودة",
    filters: "الفلاتر",
    priceRange: "نطاق السعر",
    allPrices: "كل الأسعار",
    sortBy: "الترتيب حسب",
    mostRecent: "الأحدث",
    priceLowToHigh: "السعر: من الأقل للأعلى",
    priceHighToLow: "السعر: من الأعلى للأقل",
    nameAZ: "الاسم: أ-ي",
    activeFilters: "الفلاتر النشطة",
    clearAll: "مسح الكل",
    clearFilters: "مسح الفلاتر",
    favorites: "مفضلتي",
    noFavorites: "لا توجد مفضلات بعد",
    noFavoritesDescription:
      "ابدأ بإضافة العناصر إلى المفضلة لتظهر هنا. اضغط على أيقونة القلب في أي منشور للحفظ.",
    browseListing: "تصفح المنشورات",
    myProfile: "ملفي الشخصي",
    memberSince: "عضو منذ",
    editProfile: "تعديل الملف الشخصي",
    activeListings: "الإعلانات النشطة",
    soldListings: "الإعلانات المباعة",
    addPost: "إضافة منشور",
    postYourItem: "انشر منشورك",
    noActiveListings: "لا توجد إعلانات نشطة",
    noActiveListingsDescription:
      "ليس لديك أي إعلانات نشطة. ابدأ البيع بإضافة أول منشور لك!",
    noSoldListings: "لا توجد إعلانات مباعة",
    noSoldListingsDescription:
      "ليس لديك أي إعلانات مباعة. ابدأ البيع بإضافة أول منشور لك!",
    viewPost: "عرض المنشور",
    editPost: "تعديل المنشور",
    deletePostConfirm:
      "هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    delete: "حذف",
    contactInformation: "معلومات التواصل",
    phone: "الهاتف",
    about: "نبذة",
    chatWithSeller: "الدردشة مع البائع",
    postSoldMessage: "تم بيع هذا المنشور",
    // Create Post Page
    sellItem: "إنشاء منشور",
    sellItemDescription: "املأ التفاصيل أدناه لإدراج منشورك للبيع",
    itemTitle: "اسم المنشور",
    itemTitlePlaceholder: "مثال: iPhone 13 Pro",
    price: "السعر (دينار أردني)",
    pricePlaceholder: "0.00",
    category: "الفئة",
    categoryPlaceholder: "مثال: إلكترونيات",
    location: "المدينة",
    locationPlaceholder: "مثال: عمان",
    itemImages: "صور المنشور",
    uploadImages: "رفع الصور",
    imagesHint: "أضف حتى 5 صور. الصورة الأولى ستكون صورة الغلاف.",
    description: "الوصف",
    descriptionPlaceholder: "اوصف منشورك...",
    postItemButton: "نشر المنشور",
    // Post Details Page
    backToListings: "العودة إلى القوائم",
    marketplace: "السوق",
    removePost: "إزالة المنشور",
    whyRemovingPost: "لماذا تريد إزالة هذا المنشور؟",
    reasonSold: "تم بيعه",
    reasonNoLongerAvailable: "لم يعد متاحاً",
    reasonMistake: "تم إدراجه بالخطأ",
    reasonOther: "أخرى",
    otherReasonPlaceholder: "أخبرنا المزيد...",
    confirmRemove: "تأكيد الإزالة",
    viewMyProfile: "عرض ملفي الشخصي",
    viewSellerProfile: "عرض ملف البائع",
    deletePost: "حذف المنشور",
    callSeller: "اتصل بالبائع",
    soldOut: "تم البيع",
    descriptionTitle: "الوصف",
    locationTitle: "الموقع",
    postedDaysAgo: "نُشر منذ يومين",
    views: "مشاهدة",
    jordan: "الأردن",
    memberSinceShort: "عضو منذ",
    activeListingsShort: "الإعلانات النشطة",
    items: "منشور",
    postStatisticsTitle: "إحصائيات المنشور",
    totalViewsLabel: "إجمالي المشاهدات",
    postStatusLabel: "الحالة",
    imagesCountLabel: "الصور",
    postedAtLabel: "تاريخ النشر",
    updatedAtLabel: "آخر تحديث",
    statusActive: "نشط",
    statusSold: "مباع",
    statusDeleted: "محذوف",
    notAvailable: "غير متاح",
    // Menu
    menu: "القائمة",
    menuDescription: "تصفح تجارة جو",
    // Form validation
    titleRequired: "العنوان مطلوب",
    categoryRequired: "الفئة مطلوبة",
    locationRequired: "الموقع مطلوب",
    imagesRequired: "يجب إضافة صورة واحدة على الأقل",
    fileSizeTooLarge: "حجم الملف كبير جداً",
    invalidFileType: "نوع الملف غير صالح",
    // Profile edit
    profilePicture: "صورة الملف الشخصي",
    profilePictureDesc: "ارفع صورة لتخصيص ملفك الشخصي",
    uploadPhoto: "رفع صورة",
    removePhoto: "إزالة الصورة",
    photoRequirements: "JPG، PNG أو WebP. الحد الأقصى 5 ميغا.",
    personalInformation: "المعلومات الشخصية",
    personalInformationDesc: "حدّث بياناتك الشخصية",
    firstName: "الاسم الأول",
    enterFirstName: "أدخل الاسم الأول",
    middleName: "الاسم الأوسط",
    enterMiddleName: "أدخل الاسم الأوسط",
    lastName: "الاسم الأخير",
    enterLastName: "أدخل الاسم الأخير",
    enterPhone: "أدخل رقم الهاتف",
    city: "المدينة",
    selectCity: "اختر المدينة",
    area: "المنطقة",
    enterArea: "أدخل المنطقة",
    bio: "النبذة",
    enterBio: "أخبرنا عن نفسك...",
    characters: "حرف",
    accountStatistics: "إحصائيات الحساب",
    accountStatisticsDesc: "نظرة عامة على نشاط حسابك",
    saveChanges: "حفظ التغييرات",
  },
};
