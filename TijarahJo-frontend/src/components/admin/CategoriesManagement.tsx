import { useState } from "react";
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
import { useEffect } from "react";
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

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.nameAr && cat.nameAr.includes(searchQuery)),
  );

  const handleSave = async () => {
    try {
      if (selectedCategory) {
        // Edit mode
        const response = await api.categories.updateCategory(
          selectedCategory.id,
          {
            name: formData.name,
            nameAr: formData.nameAr,
            color: formData.color,
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
          name: formData.name,
          nameAr: formData.nameAr,
          color: formData.color,
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

    setFormData({ name: "", nameAr: "", color: "#0A4ABF" });
    setSelectedCategory(null);
  };

  const openEdit = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.nameAr || "",
      color: category.color,
    });
    setIsEditOpen(true);
  };

  const deleteCategory = async (category: any) => {
    if (window.confirm(`Are you sure you want to delete ${category.name}?`)) {
      try {
        const response = await api.categories.deleteCategory(category.id);
        if (response.success) {
          setCategories((prevCategories) =>
            prevCategories.filter((c) => c.id !== category.id),
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
                  setFormData({ name: "", nameAr: "", color: "#0A4ABF" });
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
                  colSpan={6}
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
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
