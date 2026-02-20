import { createContext, ReactNode, useContext } from "react";
import { AuthContextType } from "./authContextTypes";
import { useAuthProviderController } from "./useAuthProviderController";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthProviderController();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
