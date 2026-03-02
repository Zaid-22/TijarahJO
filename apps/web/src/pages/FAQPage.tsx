import { HelpCircle } from "lucide-react";
import { SubpageHeader } from "../shared/ui/subpage-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../shared/ui/accordion";
import { Card, CardContent } from "../shared/ui/card";
import { PageShell } from "../shared/ui/page-shell";
import { InfoPageIntroCard, InfoPageSupportCard } from "../shared/ui/info-page";

interface FAQPageProps {
  language: "en" | "ar";
  onBack: () => void;
}

export function FAQPage({ language, onBack }: FAQPageProps) {
  const isRTL = language === "ar";

  const content = {
    en: {
      title: "Frequently Asked Questions",
      back: "Back",
      subtitle:
        "Answers to common questions about buying, selling, and account usage.",
      stillNeedHelp: "Still need help?",
      helpCenterCta: "Open Help Center",
      questions: [
        {
          q: "How do I buy an item?",
          a: "You can browse items by category or search for specific posts. Once you find an item you like, you can contact the seller directly via the chat feature or by phone if listed.",
        },
        {
          q: "How do I sell an item?",
          a: "To sell an item, you need to sign in to your account. Click on the 'Sell' or 'Add Post' button, fill in the details about your post including images, price, and description, and then publish your listing.",
        },
        {
          q: "Is TijarahJo free to use?",
          a: "Yes, TijarahJo is completely free for both buyers and sellers. There are no listing fees or commissions.",
        },
        {
          q: "How do I contact support?",
          a: "You can contact our support team via the 'Contact Us' link in the footer or by emailing info@tijarahjo.com.",
        },
        {
          q: "Can I edit my post after publishing?",
          a: "Yes, you can edit your posts at any time from your profile page via the 'Active Listings' tab.",
        },
      ],
    },
    ar: {
      title: "الأسئلة الشائعة",
      back: "عودة",
      subtitle:
        "إجابات على الأسئلة الشائعة حول الشراء والبيع واستخدام الحساب.",
      stillNeedHelp: "هل تحتاج مساعدة إضافية؟",
      helpCenterCta: "فتح مركز المساعدة",
      questions: [
        {
          q: "كيف يمكنني شراء منشور؟",
          a: "يمكنك تصفح المنشورات حسب الفئة أو البحث عن منشورات محددة. بمجرد العثور على منشور يعجبك، يمكنك التواصل مع البائع مباشرة عبر ميزة الدردشة أو عبر الهاتف إذا كان مدرجاً.",
        },
        {
          q: "كيف يمكنني بيع منشور؟",
          a: "لبيع منشور، تحتاج إلى تسجيل الدخول إلى حسابك. انقر على زر 'بيع' أو 'إضافة منشور'، واملأ التفاصيل حول منشورك بما في ذلك الصور والسعر والوصف، ثم انشر إعلانك.",
        },
        {
          q: "هل استخدام تجارة جو مجاني؟",
          a: "نعم، تجارة جو مجاني تماماً لكل من المشترين والبائعين. لا توجد رسوم إدراج أو عمولات.",
        },
        {
          q: "كيف يمكنني التواصل مع الدعم؟",
          a: "يمكنك التواصل مع فريق الدعم لدينا عبر رابط 'اتصل بنا' في أسفل الصفحة أو عن طريق إرسال بريد إلكتروني إلى info@tijarahjo.com.",
        },
        {
          q: "هل يمكنني تعديل إعلاني بعد النشر؟",
          a: "نعم، يمكنك تعديل إعلاناتك في أي وقت من صفحة ملفك الشخصي عبر تبويب 'الإعلانات النشطة'.",
        },
      ],
    },
  };

  const t = content[language];

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={onBack}
        isRTL={isRTL}
        backLabel={t.back}
        showLogo={false}
        title={t.title}
      />

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <InfoPageIntroCard
          icon={HelpCircle}
          title={t.title}
          description={t.subtitle}
        />

        <Card className="border-border bg-card/95 backdrop-blur-sm">
          <CardContent className="pt-6 md:pt-8">
            <Accordion type="single" collapsible className="w-full">
              {t.questions.map((item) => {
                const stableItemId = item.q
                  .toLowerCase()
                  .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
                  .replace(/^-+|-+$/g, "");

                return (
                  <AccordionItem
                    key={`${language}-${stableItemId}`}
                    value={`item-${language}-${stableItemId}`}
                  >
                    <AccordionTrigger className="text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <InfoPageSupportCard label={t.stillNeedHelp} ctaLabel={t.helpCenterCta} />
      </div>
    </PageShell>
  );
}
