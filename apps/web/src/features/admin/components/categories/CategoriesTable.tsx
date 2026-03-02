import { Plus, Pencil, Trash2 } from "lucide-react";
import { Category } from "../../../../types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/ui/table";
import { Badge } from "../../../../shared/ui/badge";
import { Button } from "../../../../shared/ui/button";
import {
  resolveCategorySwatchClass,
  resolveCategoryTextClass,
} from "../../../../shared/lib/categoryVisuals";

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDeleteRequest: (category: Category) => void;
}

export function CategoriesTable({
  categories,
  onEdit,
  onDeleteRequest,
}: CategoriesTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No categories found
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={`category-${String(category.id || category.name || "unknown")}`}>
                <TableCell>
                  <div className="w-fit rounded-lg bg-muted p-2">
                    <Plus
                      className={`w-5 h-5 ${resolveCategoryTextClass(category.color)}`}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{category.icon || "box"}</div>
                </TableCell>
                <TableCell>
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-12 w-16 rounded border border-border object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No image</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="font-arabic">{category.nameAr}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full ${resolveCategorySwatchClass(category.color)}`}
                    />
                    <span className="text-xs text-muted-foreground">{category.color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">0 sub</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit category ${category.name}`}
                      onClick={() => onEdit(category)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete category ${category.name}`}
                      onClick={() => onDeleteRequest(category)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
