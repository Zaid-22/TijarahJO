import { Link } from "react-router-dom";
import { HelpCircle, Mail, ShieldAlert } from "lucide-react";
import type { Language } from "../../../translations";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { PageShell } from "../../../shared/ui/page-shell";
import { buttonVariants } from "../../../shared/ui/button";
import { InfoPageIntroCard } from "../../../shared/ui/info-page";
import { cn } from "../../../shared/ui/utils";

interface HelpCenterPageProps {
  language: Language;
  onBack: () => void;
}

export function HelpCenterPage({ language, onBack }: HelpCenterPageProps) {
  const isRTL = language === "ar";
  const content = language === "ar"
    ? {
      title: "مركز المساعدة",
      subtitle:
        "حلول سريعة للأسئلة الشائعة، الدعم الفني، والإبلاغ عن المشكلات.",
      faq: "الأسئلة الشائعة",
      contact: "تواصل مع الدعم",
      report: "الإبلاغ عن مشكلة",
      contactDesc: "راسل فريق الدعم عند الحاجة إلى مساعدة فنية.",
      reportDesc: "أرسل بلاغاً يتضمن خطوات المشكلة وصوراً إن أمكن.",
      openPage: "فتح الصفحة",
      contactCta: "راسلنا",
      reportCta: "إرسال بلاغ",
    }
    : {
      title: "Help Center",
      subtitle:
        "Quick access to FAQs, technical support, and issue reporting.",
      faq: "Frequently Asked Questions",
      contact: "Contact Support",
      report: "Report an Issue",
      contactDesc: "Reach out to support when you need technical help.",
      reportDesc: "Send issue details with repostion steps and screenshots.",
      openPage: "Open page",
      contactCta: "Email support",
      reportCta: "Send report",
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

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <InfoPageIntroCard
          icon={HelpCircle}
          title={content.title}
          description={content.subtitle}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                {content.faq}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? "استعرض إجابات مفصلة للأسئلة الأكثر شيوعاً."
                  : "Browse detailed answers to common questions."}
              </p>
              <Link
                to="/faq"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-center border-primary text-primary",
                )}
              >
                {content.openPage}
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                {content.contact}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {content.contactDesc}
              </p>
              <a
                href="mailto:info@tijarahjo.com?subject=TijarahJo%20Support"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-center border-primary text-primary",
                )}
              >
                {content.contactCta}
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                {content.report}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {content.reportDesc}
              </p>
              <a
                href="mailto:info@tijarahjo.com?subject=TijarahJo%20Issue%20Report"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-center border-primary text-primary",
                )}
              >
                {content.reportCta}
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
