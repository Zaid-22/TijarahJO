import { Shield } from "lucide-react";
import type { Language } from "../../../translations";
import {
  LegalInfoPage,
  type LegalInfoPageContent,
} from "../components/LegalInfoPage";

interface PrivacyPageProps {
  language: Language;
  onBack: () => void;
}

const PRIVACY_CONTENT: Record<Language, LegalInfoPageContent> = {
  ar: {
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
  },
  en: {
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
  },
};

export function PrivacyPage({ language, onBack }: PrivacyPageProps) {
  return (
    <LegalInfoPage
      language={language}
      onBack={onBack}
      icon={Shield}
      content={PRIVACY_CONTENT}
    />
  );
}
