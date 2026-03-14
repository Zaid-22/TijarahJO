import { SellItemDialogContent } from "../components/SellItemDialog";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { translations } from "../../../translations";
import { Language } from "../../../types";
import { UserProfile } from "../../../types";
import { CreatePostInput } from "../../../app/routes/appRoutesUtils";

interface SellItemPageProps {
  language: Language;
  onBack: () => void;
  onSubmit: (post: CreatePostInput) => void | Promise<void>;
  userProfile: UserProfile;
  darkMode?: boolean;
}

export function SellItemPage({
  language,
  onBack,
  onSubmit,
  userProfile,
  darkMode = false,
}: SellItemPageProps) {
  const t = translations[language];
  const isRTL = language === "ar";

  return (
    <PageShell>
      <SubpageHeader
        onBack={onBack}
        isRTL={isRTL}
        backLabel={language === "ar" ? "العودة" : "Back"}
        showLogo={true}
        onLogoClick={onBack}
        logoDarkMode={darkMode}
      />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {t.sellItem || "Create Post"}
            </h1>
            <p className="text-base font-normal text-muted-foreground">
              {t.sellItemDescription ||
                "Fill in the details below to list your post for sale"}
            </p>
          </div>

          <SellItemDialogContent
            language={language}
            onClose={onBack}
            onSubmit={onSubmit}
            userProfile={userProfile}
          />
        </div>
      </main>
    </PageShell>
  );
}
