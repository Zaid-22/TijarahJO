import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { Category } from "../../../types/api";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { ConfirmActionDialog } from "../../../shared/ui/confirm-action-dialog";
import { CategoriesTable } from "./categories/CategoriesTable";
import { CategoryDialog } from "./categories/CategoryDialog";
import {
  CategoryFormData,
  getDefaultCategoryFormData,
} from "./categories/types";
import { logger } from "../../../shared/lib/logger";

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [pendingDeleteCategory, setPendingDeleteCategory] =
    useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(
    getDefaultCategoryFormData,
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (category.nameAr && category.nameAr.includes(searchQuery)),
      ),
    [categories, searchQuery],
  );

  const resetForm = () => {
    setFormData(getDefaultCategoryFormData());
    setSelectedCategory(null);
  };

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getCategories();
      if (response.success) {
        setCategories(response.categories);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      logger.warn("[CategoriesManagement] Failed to fetch categories", error);
      toast.error("Error fetching categories");
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const ensureCategoryExists = async (categoryId: string): Promise<boolean> => {
    const exists = await api.categories.exists(categoryId);
    if (!exists) {
      setCategories((previous) =>
        previous.filter((category) => category.id !== categoryId),
      );
      toast.error("Category no longer exists");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (selectedCategory) {
        const stillExists = await ensureCategoryExists(selectedCategory.id);
        if (!stillExists) {
          setIsEditOpen(false);
          resetForm();
          return;
        }

        const response = await api.categories.updateCategory(selectedCategory.id, {
          name: trimmedName,
          nameAr: formData.nameAr.trim(),
          color: formData.color,
          icon: formData.icon.trim(),
          image: formData.image.trim(),
        });

        if (response.success && response.category) {
          const updatedCategory = response.category;
          setCategories((previous) =>
            previous.map((category) =>
              category.id === selectedCategory.id ? updatedCategory : category,
            ),
          );
          toast.success("Category updated");
          setIsEditOpen(false);
          resetForm();
          return;
        }

        toast.error(response.message || "Failed to update");
        return;
      }

      const response = await api.categories.createCategory({
        name: trimmedName,
        nameAr: formData.nameAr.trim(),
        color: formData.color,
        icon: formData.icon.trim(),
        image: formData.image.trim(),
      });

      if (response.success && response.category) {
        const createdCategory = response.category;
        setCategories((previous) => [...previous, createdCategory]);
        toast.success("Category added");
        setIsAddOpen(false);
        resetForm();
      } else {
        toast.error(response.message || "Failed to add");
      }
    } catch (error) {
      logger.warn("[CategoriesManagement] Failed to save category", error);
      toast.error("An error occurred");
    }
  };

  const openEdit = async (category: Category) => {
    const categoryId = String(category?.id || "").trim();
    if (!categoryId) {
      toast.error("Invalid category");
      return;
    }

    const stillExists = await ensureCategoryExists(categoryId);
    if (!stillExists) {
      return;
    }

    const latestCategory = await api.categories.getCategory(categoryId);
    const sourceCategory = latestCategory || category;

    setSelectedCategory(sourceCategory);
    setFormData({
      name: sourceCategory.name,
      nameAr: sourceCategory.nameAr || "",
      color: sourceCategory.color,
      icon: sourceCategory.icon || "box",
      image: sourceCategory.image || "",
    });
    setIsEditOpen(true);
  };

  const deleteCategory = async (category: Category) => {
    try {
      const categoryId = String(category?.id || "").trim();
      if (!categoryId) {
        toast.error("Invalid category");
        return;
      }

      const stillExists = await ensureCategoryExists(categoryId);
      if (!stillExists) {
        return;
      }

      const response = await api.categories.deleteCategory(categoryId);
      if (response.success) {
        setCategories((previous) =>
          previous.filter((nextCategory) => nextCategory.id !== categoryId),
        );
        toast.success("Category deleted");
      } else {
        toast.error(response.message || "Failed to delete");
      }
    } catch (error) {
      logger.warn("[CategoriesManagement] Failed to delete category", error);
      toast.error("Error deleting category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-foreground">
          Categories Management
        </h1>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <CategoriesTable
        categories={filteredCategories}
        onEdit={(category) => {
          void openEdit(category);
        }}
        onDeleteRequest={setPendingDeleteCategory}
      />

      <CategoryDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        title="Add New Category"
        description="Create a new post category."
        saveLabel="Save Category"
        idPrefix="create-category"
        formData={formData}
        onFormDataChange={setFormData}
        onSave={() => {
          void handleSave();
        }}
      />

      <CategoryDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        title="Edit Category"
        saveLabel="Save Changes"
        idPrefix="edit-category"
        formData={formData}
        onFormDataChange={setFormData}
        onSave={() => {
          void handleSave();
        }}
      />

      <ConfirmActionDialog
        open={pendingDeleteCategory !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteCategory(null);
          }
        }}
        title="Delete category?"
        description={
          pendingDeleteCategory
            ? `Are you sure you want to delete "${pendingDeleteCategory.name}"?`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDeleteCategory) {
            return;
          }

          void deleteCategory(pendingDeleteCategory);
          setPendingDeleteCategory(null);
        }}
      />
    </div>
  );
}
