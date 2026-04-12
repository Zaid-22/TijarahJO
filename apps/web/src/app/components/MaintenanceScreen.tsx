import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../../shared/ui/logo";

type MaintenanceScreenProps = {
  language: "en" | "ar";
  maintenanceReason?: string | null;
  maintenanceExpectedReturn?: string | null;
};

const copyByLanguage = {
  en: {
    title: "We'll be back shortly.",
    description: "The marketplace is temporarily unavailable.",
    expectedReturnLabel: "Expected return",
    expectedReturnFallback: "Within about 1 hour",
    reasonLabel: "Why this is happening",
    reasonFallback: "Performance improvements and feature updates.",
    guidanceLabel: "What you can do now",
    guidance: "Please check back in a little while. Admins can still sign in and use the dashboard.",
    adminAction: "Admin sign in",
  },
  ar: {
    title: "سنعود قريباً.",
    description: "السوق متوقف مؤقتاً.",
    expectedReturnLabel: "الوقت المتوقع للعودة",
    expectedReturnFallback: "خلال حوالي ساعة",
    reasonLabel: "سبب التوقف",
    reasonFallback: "تحسين الأداء وإضافة ميزات جديدة.",
    guidanceLabel: "ماذا يمكنك أن تفعل الآن",
    guidance:
      "يرجى المحاولة مرة أخرى بعد قليل. لا يزال بإمكان المشرفين تسجيل الدخول واستخدام لوحة الإدارة.",
    adminAction: "دخول المشرفين",
  },
} as const;

export function MaintenanceScreen({
  language,
  maintenanceReason,
  maintenanceExpectedReturn,
}: MaintenanceScreenProps) {
  const isArabic = language === "ar";
  const copy = copyByLanguage[language];
  const textAlignClass = isArabic ? "text-right" : "text-left";
  const reason = maintenanceReason?.trim() || copy.reasonFallback;
  const expectedReturn =
    maintenanceExpectedReturn?.trim() || copy.expectedReturnFallback;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef3ff_55%,_#ffffff_100%)] text-slate-950"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.12),_transparent_62%)]" />

      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10 sm:px-8 lg:px-10">
        <section
          className={`w-full rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 ${textAlignClass}`}
        >
          <div className={`mb-8 flex ${isArabic ? "justify-start sm:justify-end" : "justify-start"}`}>
            <Logo size="md" />
          </div>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {copy.description}
            </p>
          </div>

          <div className="mt-8 space-y-3 border-t border-slate-200 pt-6">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {copy.expectedReturnLabel}
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {expectedReturn}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {copy.reasonLabel}
              </p>
              <p className="mt-1 text-sm leading-7 text-slate-700">
                {reason}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {copy.guidanceLabel}
              </p>
              <p className="mt-1 text-sm leading-7 text-slate-700">
                {copy.guidance}
              </p>
            </div>
          </div>

          <div
            className={`mt-10 flex ${
              isArabic ? "justify-start sm:justify-end" : "justify-start"
            }`}
          >
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95"
            >
              <span>{copy.adminAction}</span>
              <ArrowRight
                className={`h-4.5 w-4.5 ${isArabic ? "rotate-180" : ""}`}
              />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
