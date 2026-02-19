import { CategoriesResponse, Category } from "../../types/api";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";

type RawCategoryModel = {
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

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function transformCategoryModelToCategory(
  categoryModel: RawCategoryModel,
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
      categoryModel.CategoryName ?? categoryModel.categoryName ?? categoryModel.name,
    ) || "Uncategorized";
  const nameAr =
    readString(
      categoryModel.NameAr ?? categoryModel.nameAr ?? categoryModel.categoryNameAr,
    ) || name;

  return {
    id: uniqueId,
    name,
    nameAr,
    icon: readString(categoryModel.Icon ?? categoryModel.icon) || "box",
    color: readString(categoryModel.Color ?? categoryModel.color) || "#0A4ABF",
    image: readString(categoryModel.Image ?? categoryModel.image),
    postCount: 0,
  };
}

export const categoriesApi = {
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await apiRequest<RawCategoryModel[]>("/categories", {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      const categories = response.data.map((cat, index) =>
        transformCategoryModelToCategory(cat, index),
      );

      return {
        success: true,
        categories,
      };
    }

    return { success: false, categories: [] };
  },

  getCategory: async (id: string): Promise<Category | null> => {
    const normalizedCategoryId = toPositiveIntegerId(id);
    if (!normalizedCategoryId) {
      return null;
    }

    const response = await apiRequest<RawCategoryModel>(
      `/categories/${normalizedCategoryId}`,
      {
        method: "GET",
      },
    );

    if (response.success && response.data) {
      return transformCategoryModelToCategory(response.data);
    }

    return null;
  },

  createCategory: async (data: {
    name: string;
    nameAr: string;
    icon?: string;
    color?: string;
    image?: string;
  }): Promise<{ success: boolean; category?: Category; message?: string }> => {
    const name = data.name.trim();
    if (!name) {
      return {
        success: false,
        message: "Category name is required",
      };
    }

    const backendCategory = {
      CategoryName: name,
      NameAr: data.nameAr.trim() || name,
      Icon: data.icon || "box",
      Color: data.color || "#0A4ABF",
      Image: data.image || "",
    };

    const response = await apiRequest<RawCategoryModel>("/categories", {
      method: "POST",
      body: JSON.stringify(backendCategory),
    });

    if (response.success && response.data) {
      return {
        success: true,
        category: transformCategoryModelToCategory(response.data),
      };
    }

    const errorMessage = !response.success
      ? response.error?.message || "Failed to create category"
      : "Failed to create category";

    return {
      success: false,
      message: errorMessage,
    };
  },

  updateCategory: async (
    id: string,
    data: {
      name?: string;
      nameAr?: string;
      icon?: string;
      color?: string;
      image?: string;
    },
  ): Promise<{ success: boolean; category?: Category; message?: string }> => {
    const normalizedCategoryId = toPositiveIntegerId(id);
    if (!normalizedCategoryId) {
      return {
        success: false,
        message: "Invalid category ID",
      };
    }

    const backendCategory = {
      CategoryID: normalizedCategoryId,
      CategoryName: data.name?.trim() || undefined,
      NameAr: data.nameAr?.trim() || undefined,
      Icon: data.icon,
      Color: data.color,
      Image: data.image,
    };

    const response = await apiRequest<RawCategoryModel>(
      `/categories/${normalizedCategoryId}`,
      {
        method: "PUT",
        body: JSON.stringify(backendCategory),
      },
    );

    if (response.success && response.data) {
      return {
        success: true,
        category: transformCategoryModelToCategory(response.data),
      };
    }

    const errorMessage = !response.success
      ? response.error?.message || "Failed to update category"
      : "Failed to update category";

    return {
      success: false,
      message: errorMessage,
    };
  },

  deleteCategory: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedCategoryId = toPositiveIntegerId(id);
    if (!normalizedCategoryId) {
      return {
        success: false,
        message: "Invalid category ID",
      };
    }

    const response = await apiRequest(`/categories/${normalizedCategoryId}`, {
      method: "DELETE",
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to delete category",
    };
  },

  exists: async (id: string): Promise<boolean> => {
    const normalizedCategoryId = toPositiveIntegerId(id);
    if (!normalizedCategoryId) {
      return false;
    }

    const response = await apiRequest<boolean>(
      `/categories/Exists/${normalizedCategoryId}`,
      {
        method: "GET",
      },
    );

    return response.success ? Boolean(response.data) : false;
  },
};
