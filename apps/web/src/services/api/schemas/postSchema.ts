import { RawPost } from "../posts/types";
import { asRecord, toIntegerOrDefault } from "../normalizers";

type ParsedPagination = {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  postsPerPage: number;
};

type ParsedPostsEnvelope = {
  posts: RawPost[];
  pagination: Record<string, unknown>;
};

export function parseRawPost(value: unknown): RawPost | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    PostID: record.PostID ?? record.postID ?? record.postId,
    postID: record.postID ?? record.postId,
    postId: record.postId,
    id: record.id,
    UserID: record.UserID ?? record.userID ?? record.UserId ?? record.userId,
    userID: record.userID ?? record.userId,
    UserId: record.UserId ?? record.userId,
    userId: record.userId,
    SellerID: record.SellerID ?? record.SellerId ?? record.sellerId,
    SellerId: record.SellerId ?? record.sellerId,
    sellerId: record.sellerId,
    CategoryID:
      record.CategoryID ?? record.categoryID ?? record.CategoryId ?? record.categoryId,
    CategoryId: record.CategoryId ?? record.categoryId,
    categoryID: record.categoryID ?? record.categoryId,
    categoryId: record.categoryId,
    Category: record.Category,
    category: record.category,
    Seller: record.Seller,
    seller: record.seller,
    PostTitle: record.PostTitle ?? record.postTitle,
    postTitle: record.postTitle,
    name: record.name ?? record.postTitle,
    PostDescription: record.PostDescription ?? record.postDescription,
    postDescription: record.postDescription,
    description: record.description ?? record.postDescription,
    Price: record.Price ?? record.price,
    price: record.price,
    Location: record.Location,
    location: record.location,
    LocationAr: record.LocationAr,
    locationAr: record.locationAr,
    City: record.City,
    CityId: record.CityId ?? record.cityId,
    cityId: record.cityId,
    Area: record.Area,
    area: record.area,
    AreaAr: record.AreaAr,
    areaAr: record.areaAr,
    Phone: record.Phone,
    phone: record.phone,
    AreaId: record.AreaId ?? record.areaId,
    areaId: record.areaId,
    PostImageURL: record.PostImageURL,
    postImageURL: record.postImageURL,
    ThumbnailImage: record.ThumbnailImage,
    thumbnailImage: record.thumbnailImage,
    thumbnailImageURL: record.thumbnailImageURL,
    thumbnailImageUrl: record.thumbnailImageUrl,
    Image: record.Image,
    image: record.image,
    Images: record.Images,
    images: record.images,
    CreatedAt: record.CreatedAt ?? record.createdAt,
    createdAt: record.createdAt,
    Views: record.Views ?? record.views,
    views: record.views,
    AverageRating: record.AverageRating,
    averageRating: record.averageRating,
    ReviewCount: record.ReviewCount,
    reviewCount: record.reviewCount,
    Status: record.Status ?? record.status,
    status: record.status,
    IsDeleted: record.IsDeleted ?? record.isDeleted,
    isDeleted: record.isDeleted,
  };
}

export function parseRawPostsCollection(value: unknown): RawPost[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => parseRawPost(entry))
    .filter((entry): entry is RawPost => entry !== null);
}

export function parsePostsEnvelope(value: unknown): ParsedPostsEnvelope | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const rawPosts = record.posts ?? record.Posts;
  if (!Array.isArray(rawPosts)) {
    return null;
  }

  return {
    posts: parseRawPostsCollection(rawPosts),
    pagination:
      asRecord(record.pagination ?? record.Pagination ?? {}) ?? {},
  };
}

export function parsePaginationPayload(
  value: unknown,
  fallbackPage: number,
  fallbackRowsPerPage: number,
  fallbackTotalPosts: number,
): ParsedPagination {
  const record = asRecord(value) ?? {};

  const currentPage = toIntegerOrDefault(record.currentPage, fallbackPage, 1);
  const postsPerPage = toIntegerOrDefault(
    record.postsPerPage,
    fallbackRowsPerPage,
    1,
  );
  const totalPosts = toIntegerOrDefault(
    record.totalPosts,
    fallbackTotalPosts,
    0,
  );
  const totalPages = toIntegerOrDefault(
    record.totalPages,
    totalPosts > 0 ? Math.ceil(totalPosts / postsPerPage) : 0,
    0,
  );

  return {
    currentPage,
    totalPages,
    totalPosts,
    postsPerPage,
  };
}
