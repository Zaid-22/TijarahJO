import { SellItemDialogContent } from "../components/figma/SellItemDialog";
import { Logo } from "../components/ui/logo";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { translations } from "../translations";
import { Language } from "../types";
import { UserProfile } from "../types";

interface SellItemPageProps {
  language: Language;
  onBack: () => void;
  onSubmit: (product: {
    name: string;
    price: number;
    category: string;
    location: string;
    area: string;
    description: string;
    image: string;
    images: string[];
  }) => void;
  userProfile: UserProfile;
  onGoToSettings?: () => void;
  darkMode?: boolean;
}

export function SellItemPage({
  language,
  onBack,
  onSubmit,
  userProfile,
  onGoToSettings,
  darkMode = false,
}: SellItemPageProps) {
  const t = translations[language];
  const isRTL = language === "ar";

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
              </Button>
              <Logo size="md" darkMode={darkMode} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#111111] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {t.sellItem || "Create Post"}
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 font-normal">
              {t.sellItemDescription ||
                "Fill in the details below to list your post for sale"}
            </p>
          </div>

          <SellItemDialogContent
            language={language}
            onClose={onBack}
            onSubmit={onSubmit}
            userProfile={userProfile}
            onGoToSettings={onGoToSettings}
          />
        </div>
      </main>
    </div>
  );
}
