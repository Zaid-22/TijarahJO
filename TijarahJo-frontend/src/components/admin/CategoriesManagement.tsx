import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { api } from "../../services/api";

export function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    color: "#0A4ABF",
    icon: "box",
    image: "",
  });

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getCategories();
      if (response.success) {
        setCategories(response.categories);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const ensureCategoryExists = async (categoryId: string): Promise<boolean> => {
    const exists = await api.categories.exists(categoryId);
    if (!exists) {
      setCategories((prevCategories) =>
        prevCategories.filter((c) => c.id !== categoryId),
      );
      toast.error("Category no longer exists");
      return false;
    }
    return true;
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.nameAr && cat.nameAr.includes(searchQuery)),
  );

  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (selectedCategory) {
        // Edit mode
        const stillExists = await ensureCategoryExists(selectedCategory.id);
        if (!stillExists) {
          setIsEditOpen(false);
          return;
        }

        const response = await api.categories.updateCategory(
          selectedCategory.id,
          {
            name: trimmedName,
            nameAr: formData.nameAr.trim(),
            color: formData.color,
            icon: formData.icon.trim(),
            image: formData.image.trim(),
          },
        );

        if (response.success) {
          setCategories((prevCategories) =>
            prevCategories.map((c) =>
              c.id === selectedCategory.id ? response.category : c,
            ),
          );
          toast.success("Category updated");
          setIsEditOpen(false);
        } else {
          toast.error(response.message || "Failed to update");
        }
      } else {
        // Add mode
        const response = await api.categories.createCategory({
          name: trimmedName,
          nameAr: formData.nameAr.trim(),
          color: formData.color,
          icon: formData.icon.trim(),
          image: formData.image.trim(),
        });

        if (response.success) {
          setCategories((prevCategories) => [...prevCategories, response.category]);
          toast.success("Category added");
          setIsAddOpen(false);
        } else {
          toast.error(response.message || "Failed to add");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }

    setFormData({
      name: "",
      nameAr: "",
      color: "#0A4ABF",
      icon: "box",
      image: "",
    });
    setSelectedCategory(null);
  };

  const openEdit = async (category: any) => {
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

  const deleteCategory = async (category: any) => {
    if (window.confirm(`Are you sure you want to delete ${category.name}?`)) {
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

        const response = await api.categories.deleteCategory(category.id);
        if (response.success) {
          setCategories((prevCategories) =>
            prevCategories.filter((c) => c.id !== categoryId),
          );
          toast.success("Category deleted");
        } else {
          toast.error(response.message || "Failed to delete");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error deleting category");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Categories Management
        </h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search categories..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setSelectedCategory(null);
                  setFormData({
                    name: "",
                    nameAr: "",
                    color: "#0A4ABF",
                    icon: "box",
                    image: "",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new product category.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name (EN)
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nameAr" className="text-right">
                    Name (AR)
                  </Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    className="col-span-3"
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Color
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-12 p-1 h-10"
                    />
                    <span className="text-sm text-gray-500">
                      {formData.color}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="icon" className="text-right">
                    Icon Name
                  </Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="box"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Image URL
                  </Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="https://example.com/category.jpg"
                  />
                </div>
                {formData.image.trim() ? (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div />
                    <img
                      src={formData.image}
                      alt="Category preview"
                      className="col-span-3 h-24 w-full rounded-md object-cover border border-gray-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <DialogFooter>
                <Button onClick={handleSave}>Save Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (AR)</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Subcategories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((cat, idx) => {
                const Icon = typeof cat.icon === "function" ? cat.icon : Plus;
                return (
                  <TableRow key={cat.id || idx}>
                    <TableCell>
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 w-fit">
                        <Icon
                          className="w-5 h-5"
                          style={{ color: cat.color }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{cat.icon || "box"}</div>
                    </TableCell>
                    <TableCell>
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="h-12 w-16 rounded object-cover border border-gray-200"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="font-arabic">{cat.nameAr}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs text-gray-500">
                          {cat.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {/* {cat.subcategories?.length || 0} sub */}0 sub
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCategory(cat)}
                          className="hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name (EN)
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-nameAr" className="text-right">
                Name (AR)
              </Label>
              <Input
                id="edit-nameAr"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                className="col-span-3"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-12 p-1 h-10"
                />
                <span className="text-sm text-gray-500">{formData.color}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-icon" className="text-right">
                Icon Name
              </Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="col-span-3"
                placeholder="box"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-image" className="text-right">
                Image URL
              </Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="col-span-3"
                placeholder="https://example.com/category.jpg"
              />
            </div>
            {formData.image.trim() ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <div />
                <img
                  src={formData.image}
                  alt="Category preview"
                  className="col-span-3 h-24 w-full rounded-md object-cover border border-gray-200"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
