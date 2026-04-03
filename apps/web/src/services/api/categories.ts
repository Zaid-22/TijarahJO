import { CategoriesResponse, Category } from "../../types/api";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";
import {
  parseCategoryCollectionPayload,
  parseCategoryExistsPayload,
  parseCategoryPayload,
  normalizeCategory,
} from "./schemas/categorySchema";

export const categoriesApi = {
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await apiRequest<unknown>("/categories", {
      method: "GET",
    });

    if (response.success) {
      const rawCategories = parseCategoryCollectionPayload(response.data);
      const categories = rawCategories.map((cat, index) =>
        normalizeCategory(cat, index),
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

    const response = await apiRequest<unknown>(
      `/categories/${normalizedCategoryId}`,
      {
        method: "GET",
      },
    );

    if (response.success) {
      const categoryModel = parseCategoryPayload(response.data);
      if (categoryModel) {
        return normalizeCategory(categoryModel);
      }
    }

    return null;
  },

  createCategory: async (data: {
    name: string;
    nameAr: string;
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
      Image: data.image || "",
    };

    try {
      const response = await apiRequest<unknown>("/categories", {
        method: "POST",
        body: JSON.stringify(backendCategory),
      });

      if (response.success) {
        const categoryModel = parseCategoryPayload(response.data);
        if (!categoryModel) {
          return {
            success: false,
            message: "Invalid category response",
          };
        }

        return {
          success: true,
          category: normalizeCategory(categoryModel),
        };
      }

      const errorMessage = response.error?.message || "Failed to create category";
      // eslint-disable-next-line no-console
      console.warn("[categoriesApi.createCategory] API error:", response.error);
      return {
        success: false,
        message: errorMessage,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[categoriesApi.createCategory] Exception:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create category",
      };
    }
  },

  updateCategory: async (
    id: string,
    data: {
      name?: string;
      nameAr?: string;
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
      Image: data.image,
    };

    const response = await apiRequest<unknown>(
      `/categories/${normalizedCategoryId}`,
      {
        method: "PUT",
        body: JSON.stringify(backendCategory),
      },
    );

    if (response.success) {
      const categoryModel = parseCategoryPayload(response.data);
      if (!categoryModel) {
        return {
          success: false,
          message: "Invalid category response",
        };
      }

      return {
        success: true,
        category: normalizeCategory(categoryModel),
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

    return response.success ? parseCategoryExistsPayload(response.data) : false;
  },

  uploadImage: async (file: File): Promise<{ success: boolean; url?: string; message?: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiRequest<{ Url?: string }>("/categories/upload-image", {
      method: "POST",
      body: formData as unknown as BodyInit,
    });

    if (response.success) {
      return { success: true, url: response.data?.Url };
    }

    return { 
      success: false, 
      message: response.error?.message || "Failed to upload category image" 
    };
  },
};
