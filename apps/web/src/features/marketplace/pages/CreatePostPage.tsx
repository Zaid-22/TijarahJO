import { CreatePostDialogContent } from "../components/CreatePostDialog";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";

import { Language } from "../../../types";
import { UserProfile } from "../../../types";
import { CreatePostInput } from "../../../app/routes/appRoutesUtils";

interface CreatePostPageProps {
  language: Language;
  onBack: () => void;
  onSubmit: (post: CreatePostInput) => void | Promise<void>;
  userProfile: UserProfile;
  darkMode?: boolean;
}

export function CreatePostPage({
  language,
  onBack,
  onSubmit,
  userProfile,
  darkMode = false,
}: CreatePostPageProps) {

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {language === "ar" ? "إنشاء منشور" : "Create Post"}
            </h1>
            <p className="text-base font-normal text-muted-foreground">
              {language === "ar"
                ? "قم بتعبئة التفاصيل أدناه لنشر إعلانك في السوق"
                : "Fill in the details below to list your post in the marketplace"}
            </p>
          </div>

          <CreatePostDialogContent
            language={language}
            onClose={onBack}
            onSubmit={onSubmit}
            userProfile={userProfile}
          />
        </div>
      </div>
    </PageShell>
  );
}
