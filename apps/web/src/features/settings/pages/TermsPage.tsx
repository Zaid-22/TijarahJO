import { FileText } from "lucide-react";
import type { Language } from "../../../translations";
import {
  LegalInfoPage,
  type LegalInfoPageContent,
} from "../components/LegalInfoPage";

interface TermsPageProps {
  language: Language;
  onBack: () => void;
}

const TERMS_CONTENT: Record<Language, LegalInfoPageContent> = {
  ar: {
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
  },
  en: {
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
  },
};

export function TermsPage({ language, onBack }: TermsPageProps) {
  return (
    <LegalInfoPage
      language={language}
      onBack={onBack}
      icon={FileText}
      content={TERMS_CONTENT}
    />
  );
}
