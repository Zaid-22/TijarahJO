import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { api } from "../../../services/api";
import { AdminUserRecord } from "../../../services/api/users";
import { ConfirmActionDialog } from "../../../shared/ui/confirm-action-dialog";
import { CreateUserDialog } from "./users/CreateUserDialog";
import { UsersTable } from "./users/UsersTable";
import { CreateUserForm, initialCreateUserForm } from "./users/types";
import { logger } from "../../../shared/lib/logger";
import { useNavigate } from "react-router-dom";

function formatJoinedDate(dateValue?: string): string {
  if (!dateValue) {
    return "N/A";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString();
}

export function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>(
    initialCreateUserForm,
  );
  const [pendingDeleteUser, setPendingDeleteUser] = useState<{
    id: string;
    displayName: string;
  } | null>(null);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, users],
  );

  const resetCreateForm = () => {
    setCreateForm(initialCreateUserForm);
  };

  const fetchUsers = async () => {
    try {
      const response = await api.users.getAllUsers();
      if (response.success) {
        setUsers(response.users);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Failed to fetch users", error);
      toast.error("Error fetching users");
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const firstName = createForm.firstName.trim();
    const lastName = createForm.lastName.trim();
    const email = createForm.email.trim().toLowerCase();
    const password = createForm.password;
    const phone = createForm.phone.trim();
    const roleId = createForm.role === "admin" ? 1 : 2;

    if (!firstName || !email || !password) {
      toast.error("First name, email, and password are required");
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await api.users.createUser({
        Password: password,
        Email: email,
        FirstName: firstName,
        LastName: lastName,
        Phone: phone || null,
        JoinDate: new Date().toISOString(),
        Status: 1,
        RoleID: roleId,
        IsDeleted: false,
      });

      if (response.success) {
        toast.success("User created successfully");
        setIsCreateOpen(false);
        resetCreateForm();
        await fetchUsers();
      } else {
        toast.error(response.message || "Failed to create user");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Failed to create user", error);
      toast.error("Error creating user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: "active" | "banned",
  ) => {
    try {
      const exists = await api.users.exists(userId);
      if (!exists) {
        setUsers((previous) => previous.filter((user) => user.id !== userId));
        toast.error("User no longer exists");
        return;
      }

      const success = await api.users.updateUserStatus(userId, newStatus);
      if (success) {
        setUsers((previous) =>
          previous.map((user) =>
            user.id === userId ? { ...user, status: newStatus } : user,
          ),
        );
        toast.success(`User status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Failed to update user status", error);
      toast.error("Error updating status");
    }
  };

  const toggleRole = async (userId: string, currentRole: "admin" | "user") => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      const exists = await api.users.exists(userId);
      if (!exists) {
        setUsers((previous) => previous.filter((user) => user.id !== userId));
        toast.error("User no longer exists");
        return;
      }

      const success = await api.users.updateUserRole(userId, newRole);
      if (success) {
        setUsers((previous) =>
          previous.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user,
          ),
        );
        toast.success(`User role updated to ${newRole}`);
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Failed to update user role", error);
      toast.error("Error updating role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const exists = await api.users.exists(userId);
      if (!exists) {
        setUsers((previous) => previous.filter((user) => user.id !== userId));
        toast.error("User already deleted");
        return;
      }

      const response = await api.users.deleteUser(userId);
      if (response.success) {
        setUsers((previous) => previous.filter((user) => user.id !== userId));
        toast.success(response.message || "User deleted");
      } else {
        toast.error(response.message || "Failed to delete user");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Failed to delete user", error);
      toast.error("Error deleting user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-foreground">Users Management</h1>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            onClick={() => {
              setIsCreateOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <UsersTable
        users={filteredUsers}
        onToggleRole={(userId, role) => {
          void toggleRole(userId, role);
        }}
        onChangeStatus={(userId, status) => {
          void handleStatusChange(userId, status);
        }}
        onViewDetails={(userId) => {
          navigate(`/admin/users/${userId}`);
        }}
        onDeleteRequest={(user) => {
          setPendingDeleteUser({
            id: user.id,
            displayName: user.name || user.email,
          });
        }}
        formatJoinedDate={formatJoinedDate}
      />

      <CreateUserDialog
        open={isCreateOpen}
        isCreatingUser={isCreatingUser}
        formData={createForm}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            resetCreateForm();
          }
        }}
        onFormDataChange={setCreateForm}
        onSubmit={() => {
          void handleCreateUser();
        }}
        onCancel={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
      />

      <ConfirmActionDialog
        open={pendingDeleteUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteUser(null);
          }
        }}
        title="Delete user?"
        description={
          pendingDeleteUser
            ? `Delete user "${pendingDeleteUser.displayName}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDeleteUser) {
            return;
          }

          void handleDeleteUser(pendingDeleteUser.id);
          setPendingDeleteUser(null);
        }}
      />
    </div>
  );
}
