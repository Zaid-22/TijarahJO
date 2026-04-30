import { TypeToConfirmDialog } from "../../../../shared/ui/type-to-confirm-dialog";
import type { NormalizedRole } from "../../../../services/api/roles";
import { CreateUserDialog } from "./CreateUserDialog";
import { SuspendUserDialog } from "./SuspendUserDialog";
import type { CreateUserForm } from "./types";

interface PendingUserAction {
  id: string;
  displayName: string;
}

interface UsersManagementDialogsProps {
  isCreateOpen: boolean;
  isCreatingUser: boolean;
  createForm: CreateUserForm;
  roles: NormalizedRole[];
  pendingDeleteUser: PendingUserAction | null;
  pendingSuspendUser: PendingUserAction | null;
  suspendDurationHours: string;
  isSuspending: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onCreateFormChange: (form: CreateUserForm) => void;
  onCreateSubmit: () => void;
  onCreateCancel: () => void;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  onSuspendOpenChange: (open: boolean) => void;
  onSuspendDurationChange: (value: string) => void;
  onSuspend: () => void;
}

export function UsersManagementDialogs({
  isCreateOpen,
  isCreatingUser,
  createForm,
  roles,
  pendingDeleteUser,
  pendingSuspendUser,
  suspendDurationHours,
  isSuspending,
  onCreateOpenChange,
  onCreateFormChange,
  onCreateSubmit,
  onCreateCancel,
  onDeleteOpenChange,
  onDeleteConfirm,
  onSuspendOpenChange,
  onSuspendDurationChange,
  onSuspend,
}: UsersManagementDialogsProps) {
  return (
    <>
      <CreateUserDialog
        open={isCreateOpen}
        isCreatingUser={isCreatingUser}
        formData={createForm}
        roles={roles}
        onOpenChange={onCreateOpenChange}
        onFormDataChange={onCreateFormChange}
        onSubmit={onCreateSubmit}
        onCancel={onCreateCancel}
      />

      <TypeToConfirmDialog
        open={pendingDeleteUser !== null}
        onOpenChange={onDeleteOpenChange}
        title="Delete User"
        description={
          pendingDeleteUser
            ? `Delete user "${pendingDeleteUser.displayName}"? This action cannot be undone.`
            : ""
        }
        impactItems={[
          "All active listings",
          "All submitted reviews",
        ]}
        confirmPhrase="DELETE"
        onConfirm={onDeleteConfirm}
      />

      <SuspendUserDialog
        open={pendingSuspendUser !== null}
        onOpenChange={onSuspendOpenChange}
        userName={pendingSuspendUser?.displayName}
        durationHours={suspendDurationHours}
        onDurationChange={onSuspendDurationChange}
        onSuspend={onSuspend}
        isSuspending={isSuspending}
      />
    </>
  );
}
