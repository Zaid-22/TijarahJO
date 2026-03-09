import type { Category } from "../../../types/api";
import { asRecord, readString } from "../normalizers";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { COLORS } from "../../../constants/colors";

type RawCategory = {
  CategoryID?: unknown;
  categoryID?: unknown;
  id?: unknown;
  CategoryName?: unknown;
  categoryName?: unknown;
  name?: unknown;
  NameAr?: unknown;
  nameAr?: unknown;
  categoryNameAr?: unknown;
  Icon?: unknown;
  icon?: unknown;
  Color?: unknown;
  color?: unknown;
  Image?: unknown;
  image?: unknown;
};

const DEFAULT_CATEGORY_COLOR = COLORS.PRIMARY;

function parseRawCategory(value: unknown): RawCategory | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const hasCategoryIdentity =
    record.CategoryID !== undefined ||
    record.categoryID !== undefined ||
    record.id !== undefined ||
    record.CategoryName !== undefined ||
    record.categoryName !== undefined ||
    record.name !== undefined;
  if (!hasCategoryIdentity) {
    return null;
  }

  return {
    CategoryID: record.CategoryID,
    categoryID: record.categoryID,
    id: record.id,
    CategoryName: record.CategoryName,
    categoryName: record.categoryName,
    name: record.name,
    NameAr: record.NameAr,
    nameAr: record.nameAr,
    categoryNameAr: record.categoryNameAr,
    Icon: record.Icon,
    icon: record.icon,
    Color: record.Color,
    color: record.color,
    Image: record.Image,
    image: record.image,
  };
}

function parseRawCategoryCollection(value: unknown): RawCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => parseRawCategory(entry))
    .filter((entry): entry is RawCategory => entry !== null);
}

function unwrapCategoryCollectionPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return value;
  }

  return (
    record.categories ??
    record.Categories ??
    record.data ??
    record.Data
  );
}

export function parseCategoryCollectionPayload(value: unknown): RawCategory[] {
  return parseRawCategoryCollection(unwrapCategoryCollectionPayload(value));
}

export function parseCategoryPayload(value: unknown): RawCategory | null {
  const directCategory = parseRawCategory(value);
  if (directCategory) {
    return directCategory;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return parseRawCategory(
    record.category ??
    record.Category ??
      record.data,
  );
}

export function parseCategoryExistsPayload(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return false;
  }

  const existsValue =
    record.exists ??
    record.Exists ??
    record.success ??
    record.Success ??
    record.data;

  return existsValue === true;
}

export function normalizeCategory(
  categoryModel: RawCategory,
  fallbackIndex?: number,
): Category {
  const numericCategoryId = toPositiveIntegerId(
    categoryModel.CategoryID ?? categoryModel.categoryID ?? categoryModel.id,
  );

  const fallbackId =
    fallbackIndex !== undefined ? `category-${fallbackIndex}` : "category-unknown";
  const uniqueId = numericCategoryId ? String(numericCategoryId) : fallbackId;

  const name =
    readString(
      categoryModel.CategoryName ??
        categoryModel.categoryName ??
        categoryModel.name,
    ) || "Uncategorized";
  const nameAr =
    readString(
      categoryModel.NameAr ??
        categoryModel.nameAr ??
        categoryModel.categoryNameAr,
    ) || name;

  return {
    id: uniqueId,
    name,
    nameAr,
    icon: readString(categoryModel.Icon ?? categoryModel.icon) || "box",
    color:
      readString(categoryModel.Color ?? categoryModel.color) ||
      DEFAULT_CATEGORY_COLOR,
    image: readString(categoryModel.Image ?? categoryModel.image),
    postCount: 0,
  };
}
