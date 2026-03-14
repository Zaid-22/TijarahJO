import { Search, MessageCircle, ThumbsUp } from "lucide-react";
import type { Language } from "../../../types";

type HomeHowItWorksSectionProps = {
  language: Language;
};

const STEPS_EN = [
  {
    icon: Search,
    title: "Browse & Find",
    description:
      "Explore thousands of listings across all categories. Filter by location, price, and condition.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageCircle,
    title: "Chat & Connect",
    description:
      "Message sellers directly through our built-in chat. Ask questions, negotiate, and arrange details.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: ThumbsUp,
    title: "Meet & Deal",
    description:
      "Meet locally, inspect the item, and complete the deal safely. It's that simple!",
    gradient: "from-emerald-500 to-green-500",
  },
];

const STEPS_AR = [
  {
    icon: Search,
    title: "تصفّح واعثر",
    description:
      "اكتشف آلاف الإعلانات في جميع الفئات. فلتر حسب الموقع، السعر، والحالة.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageCircle,
    title: "تواصل مع البائع",
    description:
      "تحدث مباشرة مع البائعين عبر المحادثة المدمجة. اسأل، تفاوض، ورتب التفاصيل.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: ThumbsUp,
    title: "قابل وأتمم الصفقة",
    description:
      "قابل البائع محلياً، افحص المنتج، وأتمم الصفقة بأمان. بهذه البساطة!",
    gradient: "from-emerald-500 to-green-500",
  },
];

export function HomeHowItWorksSection({
  language,
}: HomeHowItWorksSectionProps) {
  const steps = language === "ar" ? STEPS_AR : STEPS_EN;

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary border border-primary/20 mb-4">
          {language === "ar" ? "كيف يعمل" : "How It Works"}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          {language === "ar"
            ? "ثلاث خطوات بسيطة"
            : "Three Simple Steps"}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {language === "ar"
            ? "ابدأ البيع أو الشراء في دقائق"
            : "Start buying or selling in minutes"}
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const delayClass = [
            "animate-delay-[0ms]", 
            "animate-delay-[150ms]", 
            "animate-delay-[300ms]"
          ][Math.min(index, 2)];

          return (
            <div
              key={step.title}
              className={`relative group text-center p-6 sm:p-8 rounded-3xl bg-card border border-border hover:border-primary/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up ${delayClass}`}
            >
              {/* Step Number */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-bold text-muted-foreground">
                  {index + 1}
                </span>
              </div>

              {/* Icon */}
              <div
                className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="h-8 w-8 text-white" strokeWidth={1.75} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-foreground mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
