import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/ui/dialog";
import { Button } from "../../../../shared/ui/button";
import { CategoryFormFields } from "./CategoryFormFields";
import type { CategoryFormData } from "./types";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  saveLabel: string;
  idPrefix: string;
  formData: CategoryFormData;
  onFormDataChange: (next: CategoryFormData) => void;
  onSave: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  title,
  description,
  saveLabel,
  idPrefix,
  formData,
  onFormDataChange,
  onSave,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <CategoryFormFields
          formData={formData}
          idPrefix={idPrefix}
          onChange={onFormDataChange}
        />

        <DialogFooter>
          <Button onClick={onSave}>{saveLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
