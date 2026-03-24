import {
  asRecord,
  readString,
  toBoolean,
  toIntegerOrDefault,
} from "../normalizers";
import { toIsoStringOrNow } from "../shared";

export type ParsedAuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  bio: string;
  avatar?: string;
  joinedDate: string;
  roleID: number;
  isDeleted: boolean;
  RoleName?: string;
};

type ParsedAuthEnvelope = {
  successFlag: boolean | null;
  message: string;
  user: ParsedAuthUser | null;
  requiresTwoFactor: boolean;
  twoFactorToken?: string;
};

function parseAuthUser(value: unknown): ParsedAuthUser | null {
  const userRecord = asRecord(value);
  if (!userRecord) {
    return null;
  }

  const joinedDate = toIsoStringOrNow(
    userRecord.JoinedDate ?? userRecord.joinedDate,
  );

  return {
    id: String(userRecord.Id ?? userRecord.id ?? ""),
    firstName: readString(userRecord.FirstName ?? userRecord.firstName),
    lastName: readString(userRecord.LastName ?? userRecord.lastName),
    email: readString(userRecord.Email ?? userRecord.email),
    phone: readString(userRecord.Phone ?? userRecord.phone),
    city: readString(userRecord.City ?? userRecord.city),
    area: readString(userRecord.Area ?? userRecord.area),
    bio: readString(userRecord.Bio ?? userRecord.bio),
    avatar: readString(userRecord.Avatar ?? userRecord.avatar) || undefined,
    joinedDate,
    roleID: toIntegerOrDefault(userRecord.RoleID ?? userRecord.roleID, 2, 1),
    isDeleted: toBoolean(userRecord.IsDeleted ?? userRecord.isDeleted, false),
    RoleName: readString(userRecord.RoleName ?? userRecord.roleName),
  };
}

export function parseAuthEnvelope(payload: unknown): ParsedAuthEnvelope | null {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    return null;
  }

  const successValue = payloadRecord.Success ?? payloadRecord.success;
  const successFlag = typeof successValue === "boolean" ? successValue : null;
  const message = readString(payloadRecord.Message ?? payloadRecord.message);
  const requiresTwoFactor = toBoolean(
    payloadRecord.RequiresTwoFactor ?? payloadRecord.requiresTwoFactor,
    false,
  );
  const twoFactorToken =
    readString(payloadRecord.TwoFactorToken ?? payloadRecord.twoFactorToken) ||
    undefined;

  return {
    successFlag,
    message,
    user: parseAuthUser(payloadRecord.User ?? payloadRecord.user),
    requiresTwoFactor,
    twoFactorToken,
  };
}
