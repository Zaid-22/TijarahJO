import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/ui/table";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Badge } from "../../../shared/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/ui/dialog";
import { Label } from "../../../shared/ui/label";
import { toast } from "sonner";
import { api } from "../../../services/api";

type RoleRecord = {
  id: string;
  name: string;
  createdAt: string;
};

type RoleLike = {
  RoleID?: unknown;
  roleID?: unknown;
  id?: unknown;
  RoleName?: unknown;
  roleName?: unknown;
  name?: unknown;
  CreatedAt?: unknown;
  createdAt?: unknown;
};

const initialFormData = { roleName: "" };

function normalizeRole(role: RoleLike | null | undefined): RoleRecord {
  const resolvedId = String(role?.RoleID ?? role?.roleID ?? role?.id ?? "").trim();
  return {
    id: resolvedId,
    name: String(role?.RoleName ?? role?.roleName ?? role?.name ?? "").trim(),
    createdAt: String(role?.CreatedAt ?? role?.createdAt ?? ""),
  };
}

function formatDate(value: string): string {
  if (!value) {
    return "N/A";
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }
  return parsedDate.toLocaleDateString();
}

function isSystemRoleId(roleId: string): boolean {
  const normalizedId = Number(roleId);
  return Number.isInteger(normalizedId) && (normalizedId === 1 || normalizedId === 2);
}

export function RolesManagement() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchRoles = async () => {
    try {
      const response = await api.roles.getRoles();
      if (Array.isArray(response)) {
        setRoles(
          response
            .map(normalizeRole)
            .filter((role) => role.id.length > 0 && role.name.length > 0),
        );
      } else {
        toast.error("Failed to fetch roles");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching roles");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [roles, searchQuery],
  );

  const ensureRoleExists = async (roleId: string): Promise<boolean> => {
    const exists = await api.roles.exists(roleId);
    if (!exists) {
      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
      toast.error("Role no longer exists");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    const roleName = formData.roleName.trim();
    if (!roleName) {
      toast.error("Role name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedRole) {
        const stillExists = await ensureRoleExists(selectedRole.id);
        if (!stillExists) {
          setIsEditOpen(false);
          return;
        }

        const response = await api.roles.updateRole(selectedRole.id, {
          RoleName: roleName,
        });

        if (response.success) {
          const updatedRole = normalizeRole(
            response.role || {
              RoleID: Number(selectedRole.id),
              RoleName: roleName,
              CreatedAt: selectedRole.createdAt,
            },
          );

          setRoles((prevRoles) =>
            prevRoles.map((role) => (role.id === selectedRole.id ? updatedRole : role)),
          );
          toast.success("Role updated");
          setIsEditOpen(false);
        } else {
          toast.error(response.message || "Failed to update role");
        }
      } else {
        const response = await api.roles.createRole({
          RoleName: roleName,
        });

        if (response.success && response.role) {
          const newRole = normalizeRole(response.role);
          if (newRole.id && newRole.name) {
            setRoles((prevRoles) => [...prevRoles, newRole]);
          } else {
            await fetchRoles();
          }
          toast.success("Role added");
          setIsAddOpen(false);
        } else {
          toast.error(response.message || "Failed to create role");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setFormData(initialFormData);
      setSelectedRole(null);
      setIsSaving(false);
    }
  };

  const openEdit = async (role: RoleRecord) => {
    if (isSystemRoleId(role.id)) {
      toast.error("System roles cannot be edited");
      return;
    }

    const stillExists = await ensureRoleExists(role.id);
    if (!stillExists) {
      return;
    }

    const latestRole = await api.roles.getRole(role.id);
    const sourceRole = latestRole ? normalizeRole(latestRole) : role;

    setSelectedRole(sourceRole);
    setFormData({ roleName: sourceRole.name });
    setIsEditOpen(true);
  };

  const deleteRole = async (role: RoleRecord) => {
    if (isSystemRoleId(role.id)) {
      toast.error("System roles cannot be deleted");
      return;
    }

    if (
      !window.confirm(`Are you sure you want to delete the role "${role.name}"?`)
    ) {
      return;
    }

    try {
      const stillExists = await ensureRoleExists(role.id);
      if (!stillExists) {
        return;
      }

      const response = await api.roles.deleteRole(role.id);
      if (response.success) {
        setRoles((prevRoles) => prevRoles.filter((r) => r.id !== role.id));
        toast.success("Role deleted");
      } else {
        toast.error(response.message || "Failed to delete role");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Roles Management
        </h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search roles..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog
            open={isAddOpen}
            onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) {
                setFormData(initialFormData);
                setSelectedRole(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setSelectedRole(null);
                  setFormData(initialFormData);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
                <DialogDescription>Create a new user role.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roleName" className="text-right">
                    Role Name
                  </Label>
                  <Input
                    id="roleName"
                    value={formData.roleName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, roleName: e.target.value }))
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => {
                const isSystemRole = isSystemRoleId(role.id);

                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{formatDate(role.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={isSystemRole ? "secondary" : "outline"}>
                        {isSystemRole ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(role)}
                          disabled={isSystemRole}
                          title={isSystemRole ? "System roles cannot be edited" : "Edit role"}
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRole(role)}
                          disabled={isSystemRole}
                          className="hover:text-red-600 hover:bg-red-50"
                          title={isSystemRole ? "System roles cannot be deleted" : "Delete role"}
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

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedRole(null);
            setFormData(initialFormData);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-roleName" className="text-right">
                Role Name
              </Label>
              <Input
                id="edit-roleName"
                value={formData.roleName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, roleName: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
