import { useCallback } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { UserProfile } from "../../types";
import type { UserProfile as EditProfileFormProfile } from "../../pages/EditProfilePage";
import { api } from "../../services/api";
import { deferredToast } from "../../utils/toast";
import { resolveCurrentUserId } from "./appRoutesUtils";

interface UseProfileSaveActionParams {
  navigate: NavigateFunction;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
}

export function useProfileSaveAction({
  navigate,
  userProfile,
  setUserProfile,
}: UseProfileSaveActionParams) {
  return useCallback(
    async (updatedProfile: EditProfileFormProfile) => {
      const resolvedUserId = resolveCurrentUserId(userProfile);
      if (!resolvedUserId) {
        const message = "Unable to resolve account ID. Please sign in again.";
        deferredToast.error(message);
        throw new Error(message);
      }

      const trimmedFirstName = updatedProfile.firstName.trim();
      const trimmedLastName = updatedProfile.lastName.trim();
      const trimmedPhone = updatedProfile.phone.trim();
      const trimmedCity = updatedProfile.city.trim();
      const trimmedArea = updatedProfile.area.trim();
      const trimmedBio = updatedProfile.bio.trim();
      const trimmedAvatar = (updatedProfile.avatar || "").trim();
      const normalizedEmail = (updatedProfile.email || userProfile.email).trim();

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

      if (!trimmedCity) {
        const message = "City is required to update your profile.";
        deferredToast.error(message);
        throw new Error(message);
      }

      if (!trimmedArea) {
        const message = "Area is required to update your profile.";
        deferredToast.error(message);
        throw new Error(message);
      }

      try {
        await api.users.updateUser(resolvedUserId, {
          Email: normalizedEmail,
          FirstName: trimmedFirstName,
          LastName: trimmedLastName,
          Phone: trimmedPhone,
          City: trimmedCity,
          Area: trimmedArea,
          Bio: trimmedBio || null,
          Avatar: trimmedAvatar || null,
        });

        setUserProfile({
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
          avatar: trimmedAvatar,
          location: `${trimmedCity}, ${trimmedArea}`,
          name: `${trimmedFirstName} ${trimmedLastName}`.trim() || normalizedEmail,
        });

        deferredToast.success("Profile updated");
        navigate("/profile");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update profile";
        deferredToast.error(errorMessage);
        throw error;
      }
    },
    [navigate, setUserProfile, userProfile],
  );
}
