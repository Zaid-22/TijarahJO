import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { AdminUserRecord } from "../../../services/api/users";
import { UsersTable } from "./users/UsersTable";
import { BulkUserActionsBar } from "./users/BulkUserActionsBar";
import { UsersManagementHeader } from "./users/UsersManagementHeader";
import { UsersManagementDialogs } from "./users/UsersManagementDialogs";
import { CreateUserForm, initialCreateUserForm } from "./users/types";
import { logger } from "../../../shared/lib/logger";
import { useLocation, useNavigate } from "react-router-dom";
import { emitAuthSessionChanged } from "../../../contexts/authContextUtils";
import type { NormalizedRole } from "../../../services/api/roles";
import { buildCurrentPath } from "../../../shared/lib/backNavigation";
import {
  formatJoinedDate,
  getAssignableRoles,
  getDefaultCreateRoleId,
} from "./users/userManagementUtils";

export function UsersManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [roles, setRoles] = useState<NormalizedRole[]>([]);
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
  const [pendingSuspendUser, setPendingSuspendUser] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [suspendDurationHours, setSuspendDurationHours] = useState<string>("24");
  const [isSuspending, setIsSuspending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter(
      (user) =>
        (user.name || "").toLowerCase().includes(normalizedQuery) ||
        (user.email || "").toLowerCase().includes(normalizedQuery) ||
        (user.phone || "").toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery, users]);

  const assignableRoles = useMemo(() => getAssignableRoles(roles), [roles]);

  const resetCreateForm = () => {
    setCreateForm({
      ...initialCreateUserForm,
      roleId: getDefaultCreateRoleId(roles),
    });
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

  const fetchRoles = async () => {
    try {
      const nextRoles = await api.roles.getRoles();
      setRoles(nextRoles);
    } catch (error) {
      logger.warn("[UsersManagement] Failed to fetch roles", error);
      toast.error("Error fetching roles");
    }
  };

  useEffect(() => {
    void fetchUsers();
    void fetchRoles();
  }, []);

  useEffect(() => {
    const nextDefaultRoleId = getDefaultCreateRoleId(roles);
    if (!nextDefaultRoleId) {
      return;
    }

    const hasSelectedAssignableRole = assignableRoles.some(
      (role) => String(role.RoleID) === createForm.roleId,
    );

    if (!hasSelectedAssignableRole) {
      setCreateForm((previous) => ({
        ...previous,
        roleId: nextDefaultRoleId,
      }));
    }
  }, [assignableRoles, createForm.roleId, roles]);

  const handleCreateUser = async () => {
    const firstName = createForm.firstName.trim();
    const lastName = createForm.lastName.trim();
    const email = createForm.email.trim().toLowerCase();
    const password = createForm.password;
    const phone = createForm.phone.trim();
    const roleId = Number.parseInt(createForm.roleId, 10);

    const selectedRole = assignableRoles.find((role) => role.RoleID === roleId);

    if (
      !firstName ||
      !email ||
      !password ||
      !Number.isInteger(roleId) ||
      roleId < 1 ||
      !selectedRole
    ) {
      toast.error("First name, email, password, and a valid role are required");
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
        await Promise.all([fetchUsers(), fetchRoles()]);
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

  const handleSuspendUser = async () => {
    if (!pendingSuspendUser) return;
    const durationHours =
      suspendDurationHours === "null" ? null : Number(suspendDurationHours);

    setIsSuspending(true);
    try {
      const result = await api.admin.suspendUser(
        parseInt(pendingSuspendUser.id, 10),
        durationHours,
      );

      if (result.success) {
        toast.success(result.message ?? "User suspended successfully");
        setPendingSuspendUser(null);
        await fetchUsers();
      } else {
        toast.error(result.message ?? "Failed to suspend user");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Suspend user failed", error);
      toast.error("Failed to suspend user");
    } finally {
      setIsSuspending(false);
    }
  };

  const handleBulkSuspend = async (durationHours: number | null) => {
    if (selectedIds.size === 0) return;
    const userIds = Array.from(selectedIds)
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (userIds.length === 0) {
      toast.error("No valid users selected");
      return;
    }

    setIsSuspending(true);
    try {
      const results = await Promise.all(
        userIds.map((userId) => api.admin.suspendUser(userId, durationHours)),
      );
      const successCount = results.filter((result) => result.success).length;

      if (successCount > 0) {
        toast.success(
          durationHours === null
            ? `${successCount} users permanently banned`
            : `${successCount} users suspended`,
        );
        setSelectedIds(new Set());
        await fetchUsers();
      }

      if (successCount < userIds.length) {
        toast.error(
          `${userIds.length - successCount} users could not be suspended`,
        );
      }
    } catch (error) {
      logger.warn("[UsersManagement] Bulk suspend failed", error);
      toast.error("Failed to suspend selected users");
    } finally {
      setIsSuspending(false);
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
            user.id === userId
              ? { ...user, status: newStatus, suspendedUntil: undefined }
              : user,
          ),
        );
        emitAuthSessionChanged();
        toast.success(`User status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Failed to update user status", error);
      toast.error("Error updating status");
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: number) => {
    try {
      const exists = await api.users.exists(userId);
      if (!exists) {
        setUsers((previous) => previous.filter((user) => user.id !== userId));
        toast.error("User no longer exists");
        return;
      }

      const targetRole = roles.find((role) => role.RoleID === newRoleId);
      if (!targetRole) {
        toast.error("Selected role was not found");
        return;
      }

      const success = await api.users.updateUserRole(userId, newRoleId);
      if (success) {
        setUsers((previous) =>
          previous.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  roleId: targetRole.RoleID,
                  roleName: targetRole.RoleName,
                }
              : user,
          ),
        );
        emitAuthSessionChanged();
        toast.success(`User role updated to ${targetRole.RoleName}`);
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

  const handleBulkAction = async (status: "banned" | "active") => {
    if (selectedIds.size === 0) return;
    try {
      const success = await api.admin.bulkUpdateUserStatus(
        Array.from(selectedIds),
        status,
      );
      if (success) {
        setUsers((prev) =>
          prev.map((u) =>
            selectedIds.has(u.id)
              ? { ...u, status, suspendedUntil: undefined }
              : u,
          ),
        );
        toast.success(
          `${selectedIds.size} users ${status === "banned" ? "banned" : "activated"}`,
        );
        setSelectedIds(new Set());
      } else {
        toast.error("Bulk action failed");
      }
    } catch (error) {
      logger.warn("[UsersManagement] Bulk action failed", error);
      toast.error("Error performing bulk action");
    }
  };

  return (
    <div className="space-y-6">
      <UsersManagementHeader
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onAddUser={() => setIsCreateOpen(true)}
      />

      <UsersTable
        users={filteredUsers}
        roles={assignableRoles}
        onChangeRole={(userId, roleId) => {
          void handleRoleChange(userId, roleId);
        }}
        onChangeStatus={(userId, status) => {
          void handleStatusChange(userId, status);
        }}
        onViewDetails={(userId) => {
          navigate(`/admin/users/${userId}`, {
            state: { fromPath: currentPath },
          });
        }}
        onDeleteRequest={(user) => {
          setPendingDeleteUser({
            id: user.id,
            displayName: user.name || user.email,
          });
        }}
        onSuspendRequest={(user) => {
          setPendingSuspendUser({
            id: user.id,
            displayName: user.name || user.email,
          });
          setSuspendDurationHours("24");
        }}
        formatJoinedDate={formatJoinedDate}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkUserActionsBar
          selectedCount={selectedIds.size}
          isSuspending={isSuspending}
          onBan={() => void handleBulkAction("banned")}
          onActivate={() => void handleBulkAction("active")}
          onClear={() => setSelectedIds(new Set())}
          onSuspend={(durationHours) => void handleBulkSuspend(durationHours)}
        />
      )}

      <UsersManagementDialogs
        isCreateOpen={isCreateOpen}
        isCreatingUser={isCreatingUser}
        createForm={createForm}
        roles={assignableRoles}
        pendingDeleteUser={pendingDeleteUser}
        pendingSuspendUser={pendingSuspendUser}
        suspendDurationHours={suspendDurationHours}
        isSuspending={isSuspending}
        onCreateOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetCreateForm();
        }}
        onCreateFormChange={setCreateForm}
        onCreateSubmit={() => void handleCreateUser()}
        onCreateCancel={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
        onDeleteOpenChange={(open) => {
          if (!open) setPendingDeleteUser(null);
        }}
        onDeleteConfirm={() => {
          if (!pendingDeleteUser) return;
          void handleDeleteUser(pendingDeleteUser.id);
          setPendingDeleteUser(null);
        }}
        onSuspendOpenChange={(open) => {
          if (!open) setPendingSuspendUser(null);
        }}
        onSuspendDurationChange={setSuspendDurationHours}
        onSuspend={() => void handleSuspendUser()}
      />
    </div>
  );
}
