import { Plus, Search } from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import { Input } from "../../../../shared/ui/input";

interface UsersManagementHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onAddUser: () => void;
}

export function UsersManagementHeader({
  searchQuery,
  onSearchQueryChange,
  onAddUser,
}: UsersManagementHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
      <h1 className="text-2xl font-bold text-foreground">Users Management</h1>

      <div className="flex w-full sm:w-auto items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, or phone..."
            className="pl-10"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </div>

        <Button onClick={onAddUser}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>
    </div>
  );
}
