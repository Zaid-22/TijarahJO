import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/ui/dialog";
import { Button } from "../../../../shared/ui/button";
import { Input } from "../../../../shared/ui/input";
import { Label } from "../../../../shared/ui/label";
import type { CreateUserForm } from "./types";
import type { NormalizedRole } from "../../../../services/api/roles";

interface CreateUserDialogProps {
  open: boolean;
  isCreatingUser: boolean;
  formData: CreateUserForm;
  roles: NormalizedRole[];
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (next: CreateUserForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateUserDialog({
  open,
  isCreatingUser,
  formData,
  roles,
  onOpenChange,
  onFormDataChange,
  onSubmit,
  onCancel,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Add a new user account from the admin dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              First Name
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                onFormDataChange({ ...formData, firstName: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                onFormDataChange({ ...formData, lastName: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                onFormDataChange({ ...formData, email: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                onFormDataChange({ ...formData, password: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                onFormDataChange({ ...formData, phone: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <select
              id="role"
              value={formData.roleId}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  roleId: e.target.value,
                })
              }
              disabled={roles.length === 0}
              className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {roles.length === 0 && (
                <option value="">No roles available</option>
              )}
              {roles.map((role) => (
                <option key={role.RoleID} value={String(role.RoleID)}>
                  {role.RoleName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isCreatingUser}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isCreatingUser}>
            {isCreatingUser ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
