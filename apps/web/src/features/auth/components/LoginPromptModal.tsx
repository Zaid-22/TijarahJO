import { Dialog, DialogContent } from "../../../shared/ui/dialog";
import type { Language } from "../../../types";
import { LoginPage } from "../pages/LoginPage";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLogin: (userData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    joinedDate?: string;
    role?: "user" | "admin";
  }) => void;
  onContinueAsGuest: () => void;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  language,
  onLogin,
  onContinueAsGuest,
}: LoginPromptModalProps) {
  const isRTL = language === "ar";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none w-[95vw] sm:w-full overflow-y-auto [&>button]:hidden flex flex-col justify-start sm:justify-center items-center"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-4 sm:p-6 lg:p-8 relative">
          {/* Custom close button styled nicely */}
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} rounded-full p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none focus:ring-2 focus:ring-primary`}
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <LoginPage
            isModal
            language={language}
            onLogin={onLogin}
            onContinueAsGuest={onContinueAsGuest}
            onSuccess={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
