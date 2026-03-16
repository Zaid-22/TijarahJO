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
    PostID: record.PostID,
    postID: record.postID,
    id: record.id,
    UserID: record.UserID,
    userID: record.userID,
    UserId: record.UserId,
    SellerID: record.SellerID,
    SellerId: record.SellerId,
    sellerId: record.sellerId,
    CategoryID: record.CategoryID,
    CategoryId: record.CategoryId,
    categoryID: record.categoryID,
    categoryId: record.categoryId,
    Category: record.Category,
    category: record.category,
    Seller: record.Seller,
    seller: record.seller,
    PostTitle: record.PostTitle,
    name: record.name,
    PostDescription: record.PostDescription,
    description: record.description,
    Price: record.Price,
    price: record.price,
    Location: record.Location,
    location: record.location,
    City: record.City,
    CityId: record.CityId,
    cityId: record.cityId,
    Area: record.Area,
    AreaId: record.AreaId,
    areaId: record.areaId,
    area: record.area,
    PostImageURL: record.PostImageURL,
    postImageURL: record.postImageURL,
    Image: record.Image,
    image: record.image,
    Images: record.Images,
    images: record.images,
    CreatedAt: record.CreatedAt,
    createdAt: record.createdAt,
    Views: record.Views,
    views: record.views,
    Status: record.Status,
    status: record.status,
    IsDeleted: record.IsDeleted,
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
