import { toPositiveIntegerId } from "../../../utils/idValidation";
import { asRecord, readString, toIntegerOrDefault } from "../normalizers";
import { toIsoStringOrNow } from "../shared";

const DEFAULT_ACTIVE_STATUS = 1;
const DEFAULT_USER_ROLE_ID = 2;

type ParsedUserSchema = {
  id: string;
  userId?: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
  bio: string;
  avatar?: string;
  joinedDate: string;
  joinedAt: string;
  status: number;
  suspendedUntil?: string;
  roleId: number;
  isDeleted: boolean;
  raw: Record<string, unknown>;
  cityId?: number;
  areaId?: number;
};

function resolveRawUserId(
  record: Record<string, unknown>,
  fallbackId: string,
): string {
  const normalizeCandidate = (candidate: unknown): string => {
    if (typeof candidate === "string") {
      const normalized = candidate.trim();
      return normalized.length > 0 ? normalized : "";
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      const normalized = Math.trunc(candidate);
      return normalized > 0 ? String(normalized) : "";
    }

    if (typeof candidate === "bigint") {
      return candidate > 0n ? String(candidate) : "";
    }

    return "";
  };

  const candidates = [
    record.Id,
    record.id,
    record.UserID,
    record.userID,
    fallbackId,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

function resolveJoinDate(record: Record<string, unknown>): string {
  return (
    readString(record.JoinedDate) ||
    readString(record.joinedDate) ||
    readString(record.JoinDate) ||
    readString(record.joinDate) ||
    new Date().toISOString()
  );
}

export function parseUserSchema(
  value: unknown,
  fallbackUserId = "",
): ParsedUserSchema | null {
  const userRecord = asRecord(value);
  if (!userRecord) {
    return null;
  }

  const id = resolveRawUserId(userRecord, fallbackUserId);
  if (!id) {
    return null;
  }

  const joinedDate = resolveJoinDate(userRecord);
  const firstName = readString(userRecord.FirstName ?? userRecord.firstName);
  const lastName = readString(userRecord.LastName ?? userRecord.lastName);

  return {
    id,
    userId: toPositiveIntegerId(id) ?? toPositiveIntegerId(fallbackUserId),
    email: readString(userRecord.Email ?? userRecord.email),
    firstName,
    lastName,
    phone: readString(userRecord.Phone ?? userRecord.phone),
    city: readString(userRecord.City ?? userRecord.city),
    area: readString(userRecord.Area ?? userRecord.area),
    bio: readString(userRecord.Bio ?? userRecord.bio),
    avatar: readString(userRecord.Avatar ?? userRecord.avatar) || undefined,
    joinedDate,
    joinedAt: toIsoStringOrNow(joinedDate),
    status: toIntegerOrDefault(
      userRecord.Status ?? userRecord.status,
      DEFAULT_ACTIVE_STATUS,
    ),
    suspendedUntil:
      readString(userRecord.SuspendedUntil ?? userRecord.suspendedUntil) ||
      undefined,
    roleId: toIntegerOrDefault(
      userRecord.RoleID ?? userRecord.roleID,
      DEFAULT_USER_ROLE_ID,
      1,
    ),
    isDeleted: Boolean(userRecord.IsDeleted ?? userRecord.isDeleted ?? false),
    raw: userRecord,
    cityId: toPositiveIntegerId(userRecord.CityId ?? userRecord.cityId),
    areaId: toPositiveIntegerId(userRecord.AreaId ?? userRecord.areaId),
  };
}

export function parseUsersCollection(value: unknown): ParsedUserSchema[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => parseUserSchema(entry))
    .filter((entry): entry is ParsedUserSchema => entry !== null);
}
