import { Shield } from "lucide-react";
import type { Language } from "../../../translations";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { Card, CardContent } from "../../../shared/ui/card";
import { PageShell } from "../../../shared/ui/page-shell";
import { InfoPageIntroCard, InfoPageSupportCard } from "../../../shared/ui/info-page";

interface PrivacyPageProps {
  language: Language;
  onBack: () => void;
}

export function PrivacyPage({ language, onBack }: PrivacyPageProps) {
  const isRTL = language === "ar";
  const content = language === "ar"
    ? {
      title: "سياسة الخصوصية",
      subtitle: "كيف نجمع البيانات ونستخدمها ونحميها داخل المنصة.",
      helpLabel: "تحتاج توضيحاً إضافياً؟",
      helpCta: "فتح مركز المساعدة",
      sections: [
        {
          title: "البيانات التي نجمعها",
          body: "قد نجمع بيانات الحساب، الرسائل، ومعلومات الاستخدام لتحسين الخدمة.",
        },
        {
          title: "استخدام البيانات",
          body: "نستخدم البيانات لتشغيل المنصة، الحماية من الاحتيال، وتحسين تجربة المستخدم.",
        },
        {
          title: "مشاركة البيانات",
          body: "لا نبيع بياناتك. قد نشاركها فقط عند الحاجة القانونية أو التشغيلية.",
        },
      ],
    }
    : {
      title: "Privacy Policy",
      subtitle: "How we collect, use, and protect data across the platform.",
      helpLabel: "Need additional clarification?",
      helpCta: "Open Help Center",
      sections: [
        {
          title: "Data We Collect",
          body: "We may collect account data, messages, and usage information to run the service.",
        },
        {
          title: "How Data Is Used",
          body: "We use data for platform operations, fraud prevention, and post marketplace improvements.",
        },
        {
          title: "Data Sharing",
          body: "We do not sell your data. Sharing is limited to legal or operational needs.",
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
          icon={Shield}
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
