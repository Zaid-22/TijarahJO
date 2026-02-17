import { CategoriesResponse, Category } from "../../types/api";
import { apiRequest } from "./client";

function transformCategoryModelToCategory(
  categoryModel: any,
  fallbackIndex?: number,
): Category {
  const categoryId =
    categoryModel.CategoryID?.toString() ||
    categoryModel.categoryID?.toString() ||
    categoryModel.id;

  const uniqueId =
    categoryId ||
    (fallbackIndex !== undefined
      ? `category-${fallbackIndex}`
      : `category-${Date.now()}-${Math.random()}`);

  const name =
    categoryModel.CategoryName || categoryModel.categoryName || categoryModel.name || "";
  const nameAr =
    categoryModel.NameAr ||
    categoryModel.nameAr ||
    categoryModel.categoryNameAr ||
    name;

  return {
    id: uniqueId,
    name,
    nameAr,
    icon: categoryModel.Icon || categoryModel.icon || "box",
    color: categoryModel.Color || categoryModel.color || "#0A4ABF",
    image: categoryModel.Image || categoryModel.image || "",
    postCount: 0,
  };
}

export const categoriesApi = {
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await apiRequest<any[]>("/categories/All", {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      const categories = response.data.map((cat: any, index: number) =>
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
    const response = await apiRequest<any>(`/categories/${id}`, {
      method: "GET",
    });

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
    const backendCategory = {
      CategoryName: data.name,
      NameAr: data.nameAr || data.name,
      Icon: data.icon || "box",
      Color: data.color || "#0A4ABF",
      Image: data.image || "",
    };

    const response = await apiRequest<any>("/categories", {
      method: "POST",
      body: JSON.stringify(backendCategory),
    });

    if (response.success && response.data) {
      return {
        success: true,
        category: transformCategoryModelToCategory(response.data),
      };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to create category",
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
    const backendCategory = {
      CategoryID: parseInt(id, 10),
      CategoryName: data.name,
      NameAr: data.nameAr,
      Icon: data.icon,
      Color: data.color,
      Image: data.image,
    };

    const response = await apiRequest<any>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(backendCategory),
    });

    if (response.success && response.data) {
      return {
        success: true,
        category: transformCategoryModelToCategory(response.data),
      };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to update category",
    };
  },

  deleteCategory: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiRequest(`/categories/${id}`, {
      method: "DELETE",
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to delete category",
    };
  },

  exists: async (id: string): Promise<boolean> => {
    const response = await apiRequest<boolean>(`/categories/Exists/${id}`, {
      method: "GET",
    });

    return response.success ? Boolean(response.data) : false;
  },
};
