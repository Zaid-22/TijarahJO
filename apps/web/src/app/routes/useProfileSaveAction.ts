import { useCallback } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { UserProfile } from "../../types";
import type { EditProfileFormProfile } from "../../features/profile/types";
import { api } from "../../services/api";
import { deferredToast } from "../../utils/toast";
import { resolveCurrentUserId } from "./appRoutesUtils";
import { resolveCityId, resolveAreaId } from "../../services/api/posts/lookups";

interface UseProfileSaveActionParams {
  navigate: NavigateFunction;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => boolean;
  isCurrentProfileOwner: (userId: string) => boolean;
}

export function useProfileSaveAction({
  navigate,
  userProfile,
  setUserProfile,
  isCurrentProfileOwner,
}: UseProfileSaveActionParams) {
  return useCallback(
    async (updatedProfile: EditProfileFormProfile) => {
      const resolvedUserId = resolveCurrentUserId(userProfile);
      if (!resolvedUserId) {
        const message = "Unable to resolve account ID. Please sign in again.";
        deferredToast.error(message);
        throw new Error(message);
      }

      const assertCurrentOwner = () => {
        if (!isCurrentProfileOwner(resolvedUserId)) {
          throw new Error(
            "Your active account changed while saving. Please review the current profile and try again.",
          );
        }
      };

      assertCurrentOwner();

      const trimmedFirstName = updatedProfile.firstName.trim();
      const trimmedLastName = updatedProfile.lastName.trim();
      const trimmedPhone = updatedProfile.phone.trim();
      const trimmedCity = updatedProfile.city.trim();
      const trimmedArea = updatedProfile.area.trim();
      const trimmedBio = updatedProfile.bio.trim();
      const trimmedAvatar = (updatedProfile.avatar || "").trim();
      const currentAvatar = (userProfile.avatar || "").trim();
      const shouldSendAvatar = trimmedAvatar != currentAvatar;
      const normalizedEmail = (
        updatedProfile.email || userProfile.email
      ).trim();

      if (!normalizedEmail) {
        const message = "Email is required to update your profile.";
        deferredToast.error(message);
        throw new Error(message);
      }

      if (!trimmedPhone) {
        const message = "Phone number is required to update your profile.";
        deferredToast.error(message);
        throw new Error(message);
      }

      if (trimmedCity && !trimmedArea) {
        const message = "Area is required when a city is selected.";
        deferredToast.error(message);
        throw new Error(message);
      }

      try {
        const cityId = trimmedCity
          ? await resolveCityId(trimmedCity)
          : undefined;
        const areaId = cityId && trimmedArea
          ? await resolveAreaId(cityId, trimmedArea)
          : undefined;

        assertCurrentOwner();

        await api.users.updateUser(resolvedUserId, {
          Email: normalizedEmail,
          FirstName: trimmedFirstName,
          LastName: trimmedLastName,
          Phone: trimmedPhone,
          CityId: cityId,
          AreaId: areaId,
          Bio: trimmedBio || null,
          ...(shouldSendAvatar ? { Avatar: trimmedAvatar || null } : {}),
        });

        assertCurrentOwner();

        const profileCommitted = setUserProfile({
          ...userProfile,
          ...updatedProfile,
          id: resolvedUserId,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: normalizedEmail,
          phone: trimmedPhone,
          city: trimmedCity,
          area: trimmedArea,
          bio: trimmedBio,
          avatar: shouldSendAvatar ? (trimmedAvatar || null) : userProfile.avatar,
          location: `${trimmedCity}, ${trimmedArea}`,
          name:
            `${trimmedFirstName} ${trimmedLastName}`.trim() || normalizedEmail,
        });
        if (!profileCommitted) {
          assertCurrentOwner();
          throw new Error("The profile could not be applied to the active account.");
        }

        deferredToast.success("Profile updated");
        navigate("/profile");
      } catch (error) {
        if (isCurrentProfileOwner(resolvedUserId)) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update profile";
          deferredToast.error(errorMessage);
        }
        throw error;
      }
    },
    [isCurrentProfileOwner, navigate, setUserProfile, userProfile],
  );
}
