import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shared/ui/dialog";
import { Button } from "../../../shared/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Language } from "../../../types";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export function LoginPromptModal({ isOpen, onClose, language }: LoginPromptModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = language === "ar";
  
  const handleNavigate = (path: string) => {
    onClose();
    const currentPath = `${location.pathname}${location.search}`;
    navigate(path, { state: { fromPath: currentPath } });
  };
  
  const t = {
    title: isRTL ? "تسجيل الدخول مطلوب" : "Login Required",
    description: isRTL 
      ? "يرجى تسجيل الدخول أو إنشاء حساب جديد للتفاعل مع هذا المنشور والمزيد من الميزات." 
      : "Please log in or create a new account to interact with this post and access more features.",
    login: isRTL ? "تسجيل الدخول" : "Log In",
    signup: isRTL ? "إنشاء حساب" : "Create Account"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className={isRTL ? "text-right" : "text-left"}>
          <DialogTitle className="text-xl flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="mt-3 text-base">
            {t.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            className="w-full text-base h-12" 
            onClick={() => handleNavigate('/login')}
          >
            <LogIn className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.login}
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-base h-12"
            onClick={() => handleNavigate('/login')} 
          >
            <UserPlus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.signup}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
