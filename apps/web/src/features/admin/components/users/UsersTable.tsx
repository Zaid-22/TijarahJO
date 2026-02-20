import {
  MoreVertical,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
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

interface UsersTableProps {
  users: AdminUserRecord[];
  onToggleRole: (userId: string, currentRole: "admin" | "user") => void;
  onChangeStatus: (userId: string, nextStatus: "active" | "banned") => void;
  onDeleteRequest: (user: AdminUserRecord) => void;
  formatJoinedDate: (value?: string) => string;
}

export function UsersTable({
  users,
  onToggleRole,
  onChangeStatus,
  onDeleteRequest,
  formatJoinedDate,
}: UsersTableProps) {
  return (
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
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </span>
                    <span className="text-sm text-gray-500">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>{formatJoinedDate(user.joinedDate || user.joinedAt)}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Open actions menu for ${user.name || user.email}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onToggleRole(user.id, user.role)}>
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
                          onClick={() => onChangeStatus(user.id, "banned")}
                          className="text-red-600 focus:text-red-600"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Ban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onChangeStatus(user.id, "active")}
                          className="text-green-600 focus:text-green-600"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Unban User
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => onDeleteRequest(user)}
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
  );
}
