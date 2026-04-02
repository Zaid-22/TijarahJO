import { Post } from "../../../types";

export interface RawPostImage {
  PostID?: unknown;
  postId?: unknown;
  PostImageID?: unknown;
  postImageID?: unknown;
  postImageId?: unknown;
  PostImageURL?: unknown;
  postImageURL?: unknown;
  ThumbnailPostImageURL?: unknown;
  thumbnailPostImageURL?: unknown;
  thumbnailPostImageUrl?: unknown;
  IsDeleted?: unknown;
  isDeleted?: unknown;
}

export interface RawCategory {
  CategoryID?: unknown;
  categoryID?: unknown;
  id?: unknown;
  CategoryName?: unknown;
  categoryName?: unknown;
  name?: unknown;
}

export interface RawUserLookup {
  UserID?: unknown;
  userID?: unknown;
  Id?: unknown;
  id?: unknown;
  Name?: unknown;
  name?: unknown;
  FirstName?: unknown;
  firstName?: unknown;
  LastName?: unknown;
  lastName?: unknown;
  Email?: unknown;
  email?: unknown;
}

export interface RawPost {
  PostID?: unknown;
  postID?: unknown;
  id?: unknown;
  UserID?: unknown;
  userID?: unknown;
  UserId?: unknown;
  SellerID?: unknown;
  SellerId?: unknown;
  sellerId?: unknown;
  CategoryID?: unknown;
  CategoryId?: unknown;
  categoryID?: unknown;
  categoryId?: unknown;
  Category?: unknown;
  category?: unknown;
  Seller?: unknown;
  seller?: unknown;
  PostTitle?: unknown;
  name?: unknown;
  PostDescription?: unknown;
  description?: unknown;
  Price?: unknown;
  price?: unknown;
  Location?: unknown;
  location?: unknown;
  City?: unknown;
  city?: unknown;
  CityId?: unknown;
  cityId?: unknown;
  Area?: unknown;
  area?: unknown;
  AreaId?: unknown;
  areaId?: unknown;
  PostImageURL?: unknown;
  postImageURL?: unknown;
  ThumbnailImage?: unknown;
  thumbnailImage?: unknown;
  thumbnailImageURL?: unknown;
  thumbnailImageUrl?: unknown;
  Image?: unknown;
  image?: unknown;
  Images?: unknown;
  images?: unknown;
  CreatedAt?: unknown;
  createdAt?: unknown;
  Views?: unknown;
  views?: unknown;
  AverageRating?: unknown;
  averageRating?: unknown;
  ReviewCount?: unknown;
  reviewCount?: unknown;
  Status?: unknown;
  status?: unknown;
  IsDeleted?: unknown;
}

export type PostStatus = NonNullable<Post["status"]>;
