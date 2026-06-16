import { lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../../shared/ui/dialog";
import type { Language } from "../../../types";

const LoginPage = lazy(() =>
  import("../pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  allowSignup?: boolean;
  onLogin: (userData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    area?: string;
    cityId?: number;
    areaId?: number;
    avatar?: string;
    joinedDate?: string;
    role?: "user" | "admin";
    hasAdminAccess?: boolean;
    permissions?: string[];
  }) => void;
  onContinueAsGuest: () => void;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  language,
  allowSignup = true,
  onLogin,
  onContinueAsGuest,
}: LoginPromptModalProps) {
  const isRTL = language === "ar";
  const modalStyle = { maxHeight: "85vh" };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md p-0 bg-transparent border-0 shadow-none w-[95vw] sm:w-full overflow-y-auto [&>button]:hidden flex flex-col justify-start sm:justify-center items-center"
        dir={isRTL ? "rtl" : "ltr"}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Login Menu</DialogTitle>
        <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-4 sm:p-6 lg:p-8 relative overflow-y-auto" style={modalStyle}>
          {/* Custom close button styled nicely */}
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-5 ${isRTL ? "left-5" : "right-5"} rounded-full p-1.5 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/20`}
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <Suspense
            fallback={
              <div className="min-h-96 animate-pulse rounded-2xl bg-card" />
            }
          >
            <LoginPage
              isModal
              allowSignup={allowSignup}
              language={language}
              onLogin={onLogin}
              onContinueAsGuest={onContinueAsGuest}
              onSuccess={onClose}
            />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
}
