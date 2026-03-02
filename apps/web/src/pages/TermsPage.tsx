import { FileText } from "lucide-react";
import type { Language } from "../translations";
import { SubpageHeader } from "../shared/ui/subpage-header";
import { Card, CardContent } from "../shared/ui/card";
import { PageShell } from "../shared/ui/page-shell";
import { InfoPageIntroCard, InfoPageSupportCard } from "../shared/ui/info-page";

interface TermsPageProps {
  language: Language;
  onBack: () => void;
}

export function TermsPage({ language, onBack }: TermsPageProps) {
  const isRTL = language === "ar";
  const content = language === "ar"
    ? {
      title: "الشروط والأحكام",
      subtitle: "القواعد الأساسية التي تنظّم استخدامك للمنصة.",
      helpLabel: "هل لديك سؤال قانوني؟",
      helpCta: "فتح مركز المساعدة",
      sections: [
        {
          title: "الاستخدام المقبول",
          body: "يجب استخدام المنصة لشراء وبيع السلع والخدمات القانونية فقط.",
        },
        {
          title: "مسؤولية المحتوى",
          body: "المستخدم مسؤول بالكامل عن دقة المحتوى المنشور وصحته.",
        },
        {
          title: "السلوك داخل المنصة",
          body: "يُمنع إساءة الاستخدام أو انتحال الهوية أو نشر محتوى مخالف.",
        },
      ],
    }
    : {
      title: "Terms & Conditions",
      subtitle: "Core rules that define how the platform should be used.",
      helpLabel: "Need legal clarification?",
      helpCta: "Open Help Center",
      sections: [
        {
          title: "Acceptable Use",
          body: "Use the platform only for legal buying and selling activities.",
        },
        {
          title: "Content Responsibility",
          body: "Each user is responsible for the accuracy and legality of posted content.",
        },
        {
          title: "Platform Conduct",
          body: "Abuse, impersonation, and prohibited content are not allowed.",
        },
      ],
    };

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={onBack}
        isRTL={isRTL}
        backLabel={language === "ar" ? "العودة" : "Back"}
        title={content.title}
        showLogo={false}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <InfoPageIntroCard
          icon={FileText}
          title={content.title}
          description={content.subtitle}
        />

        <Card className="border-border bg-card/95 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            {content.sections.map((section) => (
              <section
                key={section.title}
                className="space-y-2 rounded-lg border border-border bg-background/70 p-4"
              >
                <h2 className="text-lg text-foreground">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              </section>
            ))}
          </CardContent>
        </Card>

        <InfoPageSupportCard label={content.helpLabel} ctaLabel={content.helpCta} />
      </div>
    </PageShell>
  );
}
