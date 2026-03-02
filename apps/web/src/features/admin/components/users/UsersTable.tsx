import {
  MoreVertical,
  Shield,
  ShieldAlert,
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

interface UsersTableProps {
  users: AdminUserRecord[];
  onToggleRole: (userId: string, currentRole: "admin" | "user") => void;
  onChangeStatus: (userId: string, nextStatus: "active" | "banned") => void;
  onDeleteRequest: (user: AdminUserRecord) => void;
  onViewDetails: (userId: string) => void;
  formatJoinedDate: (value?: string) => string;
}

export function UsersTable({
  users,
  onToggleRole,
  onChangeStatus,
  onDeleteRequest,
  onViewDetails,
  formatJoinedDate,
}: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
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
                      <DropdownMenuItem
                        onClick={() => onToggleRole(user.id, user.role)}
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
