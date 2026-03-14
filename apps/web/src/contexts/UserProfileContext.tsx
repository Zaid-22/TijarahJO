import { createContext, ReactNode, useContext } from "react";
import { useUserProfile } from "../features/auth/hooks/useUserProfile";
import { UserProfile } from "../types";

interface UserProfileContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  currentUserDisplayName: string;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined,
);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const value = useUserProfile();

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error(
      "useUserProfileContext must be used within a UserProfileProvider",
    );
  }
  return context;
}
