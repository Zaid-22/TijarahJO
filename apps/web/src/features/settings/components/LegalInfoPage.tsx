import type { LucideIcon } from "lucide-react";
import type { Language } from "../../../translations";
import { Card, CardContent } from "../../../shared/ui/card";
import { InfoPageIntroCard, InfoPageSupportCard } from "../../../shared/ui/info-page";
import { PageShell } from "../../../shared/ui/page-shell";
import { SubpageHeader } from "../../../shared/ui/subpage-header";

export interface LegalInfoPageContent {
  title: string;
  subtitle: string;
  helpLabel: string;
  helpCta: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
}

interface LegalInfoPageProps {
  language: Language;
  onBack: () => void;
  icon: LucideIcon;
  content: Record<Language, LegalInfoPageContent>;
}

export function LegalInfoPage({
  language,
  onBack,
  icon,
  content,
}: LegalInfoPageProps) {
  const localizedContent = content[language];

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={onBack}
        isRTL={language === "ar"}
        backLabel={language === "ar" ? "العودة" : "Back"}
        title={localizedContent.title}
        showLogo={false}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <InfoPageIntroCard
          icon={icon}
          title={localizedContent.title}
          description={localizedContent.subtitle}
        />

        <Card className="border-border bg-card/95 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            {localizedContent.sections.map((section) => (
              <section
                key={section.title}
                className="space-y-2 rounded-lg border border-border bg-background/70 p-4"
              >
                <h2 className="text-lg text-foreground">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.body}
                </p>
              </section>
            ))}
          </CardContent>
        </Card>

        <InfoPageSupportCard
          label={localizedContent.helpLabel}
          ctaLabel={localizedContent.helpCta}
        />
      </div>
    </PageShell>
  );
}
