import type { User, UserProfile } from "../../types";

export interface ProfileOwnerTransition {
  expectedPreviousOwnerId: string;
}

export function createProfileForAuthUser(user?: User | null): UserProfile {
  const displayName =
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    "Guest";

  return {
    id: user?.id || "",
    name: displayName,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    city: "",
    area: "",
    cityId: undefined,
    areaId: undefined,
    location: "",
    bio: "",
    avatar: user?.avatar || null,
    joinedDate: "Jan 2024",
  };
}

export function isOwnedProfileRequestCurrent({
  requestRunId,
  currentRunId,
  requestedUserId,
  profileOwnerId,
}: {
  requestRunId: number;
  currentRunId: number;
  requestedUserId: string;
  profileOwnerId: string;
}): boolean {
  return (
    requestRunId === currentRunId && requestedUserId === profileOwnerId
  );
}

export function canAdoptProfileForAuthTransition({
  expectedPreviousOwnerId,
  nextOwnerId,
  profileOwnerId,
  renderedAuthUserId,
}: {
  expectedPreviousOwnerId: string;
  nextOwnerId: string;
  profileOwnerId: string;
  renderedAuthUserId: string;
}): boolean {
  const expectedOwnerId = String(expectedPreviousOwnerId || "").trim();
  const normalizedNextOwnerId = String(nextOwnerId || "").trim();

  return (
    !!normalizedNextOwnerId &&
    String(profileOwnerId || "").trim() === expectedOwnerId &&
    String(renderedAuthUserId || "").trim() === expectedOwnerId
  );
}
