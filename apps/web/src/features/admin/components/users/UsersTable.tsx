import {
  MoreVertical,
  Trash2,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu";
import { Badge } from "../../../../shared/ui/badge";
import { Button } from "../../../../shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/ui/table";
import type { AdminUserRecord } from "../../../../services/api/users";
import type { NormalizedRole } from "../../../../services/api/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/ui/select";

interface UsersTableProps {
  users: AdminUserRecord[];
  roles: NormalizedRole[];
  onChangeRole: (userId: string, nextRoleId: number) => void;
  onChangeStatus: (userId: string, nextStatus: "active" | "banned") => void;
  onDeleteRequest: (user: AdminUserRecord) => void;
  onViewDetails: (userId: string) => void;
  formatJoinedDate: (value?: string) => string;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function UsersTable({
  users,
  roles,
  onChangeRole,
  onChangeStatus,
  onDeleteRequest,
  onViewDetails,
  formatJoinedDate,
  selectedIds,
  onSelectionChange,
}: UsersTableProps) {
  const selectable =
    selectedIds !== undefined && onSelectionChange !== undefined;

  const allSelected =
    selectable && users.length > 0 && users.every((u) => selectedIds.has(u.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(users.map((u) => u.id)));
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all users"
                  className="h-4 w-4 rounded border-border"
                />
              </TableHead>
            )}
            <TableHead>User</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={selectable ? 6 : 5}
                className="py-8 text-center text-muted-foreground"
              >
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className={
                  selectable && selectedIds?.has(user.id) ? "bg-primary/5" : ""
                }
              >
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(user.id) ?? false}
                      onChange={() => toggleOne(user.id)}
                      aria-label={`Select ${user.name || user.email}`}
                      className="h-4 w-4 rounded border-border"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatJoinedDate(user.joinedDate || user.joinedAt)}
                </TableCell>
                <TableCell>
                  <Select
                    value={String(user.roleId)}
                    onValueChange={(value) => onChangeRole(user.id, Number(value))}
                  >
                    <SelectTrigger
                      className="w-[160px]"
                      aria-label={`Change role for ${user.name || user.email}`}
                    >
                      <SelectValue placeholder={user.roleName} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem
                          key={role.RoleID}
                          value={String(role.RoleID)}
                        >
                          {role.RoleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.status === "active"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : user.status === "banned"
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-border bg-muted text-muted-foreground"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Open actions menu for ${user.name || user.email}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(user.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View User Details
                      </DropdownMenuItem>

                      {user.status !== "banned" ? (
                        <DropdownMenuItem
                          onClick={() => onChangeStatus(user.id, "banned")}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Ban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onChangeStatus(user.id, "active")}
                          className="text-primary focus:text-primary"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Unban User
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => onDeleteRequest(user)}
                        className="text-destructive focus:text-destructive"
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
  );
}
