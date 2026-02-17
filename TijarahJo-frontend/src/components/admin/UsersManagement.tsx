import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "../ui/badge";
import {
  Search,
  Plus,
  MoreVertical,
  UserX,
  UserCheck,
  Shield,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
import { toast } from "sonner";
import { api } from "../../services/api";

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

type CreateUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: "admin" | "user";
};

const initialCreateUserForm: CreateUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  role: "user",
};

export function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>(initialCreateUserForm);

  const fetchUsers = async () => {
    try {
      const response = await api.users.getAllUsers();
      if (response.success) {
        setUsers(response.users);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching users");
    } finally {
      // setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      console.error(error);
      toast.error("Error creating user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const exists = await api.users.exists(userId);
      if (!exists) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        toast.error("User no longer exists");
        return;
      }

      const success = await api.users.updateUserStatus(
        userId,
        newStatus as "active" | "banned",
      );

      if (success) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === userId ? { ...u, status: newStatus } : u,
          ),
        );
        toast.success(`User status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status");
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const exists = await api.users.exists(userId);
      if (!exists) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        toast.error("User no longer exists");
        return;
      }

      const success = await api.users.updateUserRole(
        userId,
        newRole as "admin" | "user",
      );

      if (success) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        toast.success(`User role updated to ${newRole}`);
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating role");
    }
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (!window.confirm(`Delete user "${displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const exists = await api.users.exists(userId);
      if (!exists) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        toast.error("User already deleted");
        return;
      }

      const response = await api.users.deleteUser(userId);
      if (response.success) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        toast.success(response.message || "User deleted");
      } else {
        toast.error(response.message || "Failed to delete user");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Users Management
        </h1>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                resetCreateForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
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
                    value={createForm.firstName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))
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
                    value={createForm.lastName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))
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
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, email: e.target.value }))
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
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, password: e.target.value }))
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
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
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
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        role: e.target.value === "admin" ? "admin" : "user",
                      }))
                    }
                    className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetCreateForm();
                  }}
                  disabled={isCreatingUser}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                  {isCreatingUser ? "Creating..." : "Create User"}
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
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatJoinedDate(user.joinedDate || user.joinedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : user.status === "banned"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleRole(user.id, user.role)}
                        >
                          {user.role === "admin" ? (
                            <>
                              <ShieldAlert className="w-4 h-4 mr-2" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Make Admin
                            </>
                          )}
                        </DropdownMenuItem>
                        {user.status !== "banned" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(user.id, "banned")
                            }
                            className="text-red-600 focus:text-red-600"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(user.id, "active")
                            }
                            className="text-green-600 focus:text-green-600"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unban User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
