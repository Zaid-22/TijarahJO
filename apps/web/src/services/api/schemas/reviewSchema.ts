import { asRecord } from "../normalizers";
import type { RawReview } from "../reviews";

export function parseRawReview(value: unknown): RawReview | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    ReviewID: record.ReviewID,
    reviewID: record.reviewID,
    ReviewerID: record.ReviewerID,
    reviewerID: record.reviewerID,
    ReviewerName: record.ReviewerName,
    reviewerName: record.reviewerName,
    ReviewedUserID: record.ReviewedUserID,
    reviewedUserID: record.reviewedUserID,
    Rating: record.Rating,
    rating: record.rating,
    Comment: record.Comment,
    comment: record.comment,
    Timestamp: record.Timestamp,
    timestamp: record.timestamp,
  };
}

export function parseRawReviewsCollection(value: unknown): RawReview[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => parseRawReview(entry))
    .filter((entry): entry is RawReview => entry !== null);
}
