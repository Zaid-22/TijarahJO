import { parseUserSchema } from "./schemas/userSchema";
import { readString } from "./normalizers";

export type RawUser = {
  Id?: unknown;
  id?: unknown;
  UserID?: unknown;
  userID?: unknown;
  Email?: unknown;
  email?: unknown;
  FirstName?: unknown;
  firstName?: unknown;
  LastName?: unknown;
  lastName?: unknown;
  Phone?: unknown;
  phone?: unknown;
  City?: unknown;
  city?: unknown;
  Area?: unknown;
  area?: unknown;
  Bio?: unknown;
  bio?: unknown;
  Avatar?: unknown;
  avatar?: unknown;
  JoinedDate?: unknown;
  joinedDate?: unknown;
  JoinDate?: unknown;
  joinDate?: unknown;
  Status?: unknown;
  status?: unknown;
  RoleID?: unknown;
  roleID?: unknown;
  SuspendedUntil?: unknown;
  suspendedUntil?: unknown;
  RoleName?: unknown;
  roleName?: unknown;
  IsDeleted?: unknown;
  isDeleted?: unknown;
  CityId?: unknown;
  cityId?: unknown;
  AreaId?: unknown;
  areaId?: unknown;
};

export type UserProfileRecord = {
  id: string;
  userId?: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
  cityId?: number;
  areaId?: number;
  bio: string;
  avatar?: string;
  joinedAt: string;
  status: number;
  suspendedUntil?: string;
  roleId: number;
  isDeleted: boolean;
  name: string;
};

export type AdminUserRecord = {
  rawStatus: number;
  isDeleted: boolean;
  id: string;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  status: "active" | "suspended" | "banned";
  suspendedUntil?: string;
  joinedDate: string;
  joinedAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  avatar?: string;
  raw: RawUser;
};

export type MutableUserFields = {
  email: string;
  firstName: string;
  lastName: string;
  isDeleted: boolean;
};

function resolveRoleName(roleId: number, rawRoleName: unknown): string {
  const normalizedRoleName = readString(rawRoleName);
  if (normalizedRoleName) {
    return normalizedRoleName;
  }

  if (roleId === 1) {
    return "Admin";
  }

  if (roleId === 2) {
    return "User";
  }

  return `Role #${roleId}`;
}

export function normalizeUserProfile(
  user: RawUser,
  fallbackUserId: string,
): UserProfileRecord | null {
  const parsedUser = parseUserSchema(user, fallbackUserId);
  if (!parsedUser) {
    return null;
  }

  return {
    id: parsedUser.id,
    userId: parsedUser.userId,
    email: parsedUser.email,
    firstName: parsedUser.firstName,
    lastName: parsedUser.lastName,
    phone: parsedUser.phone,
    city: parsedUser.city,
    area: parsedUser.area,
    cityId: parsedUser.cityId,
    areaId: parsedUser.areaId,
    bio: parsedUser.bio,
    avatar: parsedUser.avatar,
    joinedAt: parsedUser.joinedAt,
    status: parsedUser.status,
    suspendedUntil: parsedUser.suspendedUntil,
    roleId: parsedUser.roleId,
    isDeleted: parsedUser.isDeleted,
    name: `${parsedUser.firstName} ${parsedUser.lastName}`.trim(),
  };
}

export function normalizeAdminUser(user: RawUser): AdminUserRecord | null {
  const parsedUser = parseUserSchema(user);
  if (!parsedUser) {
    return null;
  }

  const suspendedUntil = parsedUser.suspendedUntil;
  const suspendedUntilDate = suspendedUntil ? new Date(suspendedUntil) : null;
  const isTimedSuspended =
    parsedUser.status === 1 &&
    suspendedUntilDate !== null &&
    !Number.isNaN(suspendedUntilDate.getTime()) &&
    suspendedUntilDate.getTime() > Date.now();

  return {
    rawStatus: parsedUser.status,
    isDeleted: parsedUser.isDeleted,
    id: parsedUser.id,
    name: `${parsedUser.firstName} ${parsedUser.lastName}`.trim(),
    email: parsedUser.email,
    roleId: parsedUser.roleId,
    roleName: resolveRoleName(
      parsedUser.roleId,
      user.RoleName ?? user.roleName,
    ),
    status:
      parsedUser.status !== 1 || parsedUser.isDeleted
        ? "banned"
        : isTimedSuspended
          ? "suspended"
          : "active",
    suspendedUntil,
    joinedDate: parsedUser.joinedDate,
    joinedAt: parsedUser.joinedAt,
    firstName: parsedUser.firstName,
    lastName: parsedUser.lastName,
    phone: parsedUser.phone,
    city: parsedUser.city,
    avatar: parsedUser.avatar,
    raw: parsedUser.raw as RawUser,
  };
}

export function resolveMutableUserFields(
  user: UserProfileRecord | null,
): MutableUserFields | null {
  if (!user) {
    return null;
  }

  const email = user.email;
  const firstName = user.firstName;
  if (!email || !firstName) {
    return null;
  }

  return {
    email,
    firstName,
    lastName: user.lastName || "",
    isDeleted: user.isDeleted,
  };
}
