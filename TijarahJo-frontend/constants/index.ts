// Brand Colors
export const BRAND_COLORS = {
  primary: "#0A4ABF",
  primaryLight: "#3E7EFF",
  primaryDark: "#08398f",
  secondary: "#FF6347",
  accent: "#10B981",
  danger: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
} as const;

// Jordanian Cities
export const JORDANIAN_CITIES = [
  "Amman",
  "Irbid",
  "Zarqa",
  "Aqaba",
  "Madaba",
  "Salt",
  "Jerash",
  "Karak",
  "Mafraq",
  "Tafilah",
  "Ma'an",
  "Ajloun",
] as const;

// Product Categories
export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Accessories",
  "Fashion",
  "Home & Garden",
  "Furniture",
  "Sports",
  "Vehicles",
  "Books",
] as const;

// View Modes
export const VIEW_MODES = {
  GRID_4: "grid-4",
  GRID_3: "grid-3",
  GRID_2: "grid-2",
  LIST: "list",
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;

// Z-Index Levels
export const Z_INDEX = {
  DROPDOWN: 10,
  STICKY: 50,
  MODAL: 100,
  TOAST: 1000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  FAVORITES: "tijarahjo_favorites",
  LANGUAGE: "tijarahjo_language",
  DARK_MODE: "tijarahjo_dark_mode",
  USER_PROFILE: "tijarahjo_user_profile",
  AUTH_TOKEN: "tijarahjo_auth_token",
} as const;

// Debounce Delays
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 150,
} as const;

// Product Constraints
export const PRODUCT_CONSTRAINTS = {
  MIN_PRICE: 1,
  MAX_PRICE: 999999,
  MAX_IMAGES: 10,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

// User Constraints
export const USER_CONSTRAINTS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  PHONE_LENGTH: 10,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  LOAD_MORE_COUNT: 10,
} as const;

// Currency
export const CURRENCY = {
  CODE: "JOD",
  SYMBOL: "JOD",
  NAME: "Jordanian Dinar",
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: "MMM YYYY",
  MEDIUM: "MMM DD, YYYY",
  LONG: "MMMM DD, YYYY",
  FULL: "dddd, MMMM DD, YYYY",
} as const;

// Image Fallback
export const IMAGE_FALLBACK = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=400&fit=crop";

// Phone Number Format
export const PHONE_FORMAT = {
  COUNTRY_CODE: "+962",
  DISPLAY_FORMAT: "+962 XX XXX XXXX",
} as const;
