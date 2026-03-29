import { ShieldAlert, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

type MaintenanceScreenProps = {
  language: "en" | "ar";
};

const copyByLanguage = {
  en: {
    eyebrow: "Scheduled maintenance",
    title: "We're improving TijarahJo right now.",
    description:
      "The public marketplace is temporarily unavailable while we finish maintenance. Please check back shortly.",
    adminHint: "Admins can still sign in to manage the platform.",
    adminAction: "Admin sign in",
  },
  ar: {
    eyebrow: "صيانة مجدولة",
    title: "نعمل الآن على تحسين تجارة جو.",
    description:
      "السوق العام غير متاح مؤقتاً بينما ننهي أعمال الصيانة. الرجاء المحاولة مرة أخرى بعد قليل.",
    adminHint: "لا يزال بإمكان المشرفين تسجيل الدخول لإدارة المنصة.",
    adminAction: "دخول المشرفين",
  },
} as const;

export function MaintenanceScreen({ language }: MaintenanceScreenProps) {
  const isArabic = language === "ar";
  const copy = copyByLanguage[language];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_45%,_#ffffff_100%)] text-slate-950"
    >
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16 sm:px-10">
        <div className="grid w-full gap-8 rounded-[2rem] border border-slate-200/80 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-12 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <ShieldAlert className="h-4 w-4" />
              <span>{copy.eyebrow}</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {copy.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {copy.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {copy.adminAction}
              </Link>
              <p className="text-sm text-slate-500">{copy.adminHint}</p>
            </div>
          </section>

          <aside className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-inner">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
              <Wrench className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">
              {isArabic ? "نعمل خلف الكواليس" : "Working behind the scenes"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {isArabic
                ? "نقوم حالياً بتحديثات على المنصة لضمان تجربة أفضل وأكثر استقراراً عند عودة الخدمة."
                : "We're applying platform updates so the marketplace comes back faster, cleaner, and more reliable."}
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {isArabic ? "لوحة الإدارة ستبقى متاحة للمشرفين." : "Admin tools remain available for administrators."}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {isArabic ? "سيعود السوق العام تلقائياً بعد إيقاف وضع الصيانة." : "The public marketplace will return automatically when maintenance mode is turned off."}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
