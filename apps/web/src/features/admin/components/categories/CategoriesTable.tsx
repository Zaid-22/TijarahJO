import { Pencil, Trash2 } from "lucide-react";
import { Category } from "../../../../types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/ui/table";
import { Button } from "../../../../shared/ui/button";

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
            <TableHead>Image</TableHead>
            <TableHead>Name (EN)</TableHead>
            <TableHead>Name (AR)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No categories found
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={`category-${String(category.id || category.name || "unknown")}`}>
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
