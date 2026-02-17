import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

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
      questions: [
        {
          q: "How do I buy an item?",
          a: "You can browse items by category or search for specific products. Once you find an item you like, you can contact the seller directly via the chat feature or by phone if listed.",
        },
        {
          q: "How do I sell an item?",
          a: "To sell an item, you need to sign in to your account. Click on the 'Sell' or 'Add Post' button, fill in the details about your product including images, price, and description, and then publish your listing.",
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
      questions: [
        {
          q: "كيف يمكنني شراء منتج؟",
          a: "يمكنك تصفح المنتجات حسب الفئة أو البحث عن منتجات محددة. بمجرد العثور على منتج يعجبك، يمكنك التواصل مع البائع مباشرة عبر ميزة الدردشة أو عبر الهاتف إذا كان مدرجاً.",
        },
        {
          q: "كيف يمكنني بيع منتج؟",
          a: "لبيع منتج، تحتاج إلى تسجيل الدخول إلى حسابك. انقر على زر 'بيع' أو 'إضافة إعلان'، واملأ التفاصيل حول منتجك بما في ذلك الصور والسعر والوصف، ثم انشر إعلانك.",
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
    <div className="bg-gray-50 dark:bg-[#1a1a1a] pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className={`hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full h-10 w-10 p-0 ${isRTL ? "-mr-2" : "-ml-2"}`}
          >
            <ArrowLeft className={`w-6 h-6 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {t.questions.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-medium">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
