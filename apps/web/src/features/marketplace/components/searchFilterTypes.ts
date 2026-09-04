export interface SearchFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "date" | "price" | "views";
  sortOrder?: "asc" | "desc";
}
