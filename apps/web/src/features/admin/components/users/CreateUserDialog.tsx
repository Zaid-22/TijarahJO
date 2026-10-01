import { useState, useEffect } from "react";
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
import { validateLoginField, type LoginFormValues } from "../../../auth/loginValidation";
import { APP_CONFIG } from "../../../../constants/appConfig";

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) {
      setTouched({});
    }
  }, [open]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const mappedValues: LoginFormValues = {
    ...formData,
    identifier: formData.email,
    confirmPassword: formData.password,
    city: "admin-creation",
    area: "admin-creation",
  };

  const errors = {
    firstName: validateLoginField("firstName", mappedValues, true),
    lastName: "",
    email: validateLoginField("identifier", mappedValues, true),
    password: validateLoginField("password", mappedValues, true),
    phone: formData.phone.trim()
      ? validateLoginField("phone", mappedValues, true)
      : "",
  };

  const hasErrors = Object.values(errors).some(Boolean) || !formData.roleId;

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
          <div className="grid grid-cols-4 items-start gap-4 pt-2">
            <Label htmlFor="firstName" className="text-right mt-3">
              First Name <span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  onFormDataChange({ ...formData, firstName: e.target.value })
                }
                onBlur={() => handleBlur("firstName")}
                className={touched.firstName && errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.firstName && errors.firstName && (
                <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="lastName" className="text-right mt-3">
              Last Name
            </Label>
            <div className="col-span-3">
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  onFormDataChange({ ...formData, lastName: e.target.value })
                }
                onBlur={() => handleBlur("lastName")}
                className={touched.lastName && errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.lastName && errors.lastName && (
                <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="email" className="text-right mt-3">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  onFormDataChange({ ...formData, email: e.target.value })
                }
                onBlur={() => handleBlur("email")}
                className={touched.email && errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="password" className="text-right mt-3">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  onFormDataChange({ ...formData, password: e.target.value })
                }
                onBlur={() => handleBlur("password")}
                className={touched.password && errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="phone" className="text-right mt-3">
              Phone
            </Label>
            <div className="col-span-3">
              <div className="relative flex items-center w-full">
                <div
                  className="absolute select-none z-10 text-muted-foreground font-medium text-sm sm:text-base flex items-center left-3"
                  dir="ltr"
                >
                  <span className="inline-flex items-center border-e border-border pe-3 me-1">
                    {APP_CONFIG.defaultPhonePrefix}
                  </span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (digits.length <= 9) {
                      onFormDataChange({ ...formData, phone: digits });
                    }
                  }}
                  onBlur={() => handleBlur("phone")}
                  className={`pl-18 tabular-nums text-left [direction:ltr] ${touched.phone && errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  maxLength={9}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="role" className="text-right mt-3">
              Role <span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
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
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isCreatingUser}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isCreatingUser || hasErrors}>
            {isCreatingUser ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
