import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { resolveCategoryName } from "../../../shared/lib/categoryVisuals";
import { Logo } from "../../../shared/ui/logo";

interface FooterProps {
  language: "en" | "ar";
}

type FooterCopy = {
  aboutText: string;
  quickLinks: string;
  categories: string;
  contactUs: string;
  termsConditions: string;
  privacyPolicy: string;
  faq: string;
  helpCenter: string;
  followUs: string;
  allRightsReserved: string;
  madeInJordan: string;
  address: string;
  email: string;
  phone: string;
};

const footerCopyByLanguage: Record<FooterProps["language"], FooterCopy> = {
  en: {
    aboutText:
      "TijarahJo is Jordan's trusted marketplace for buying and selling new and used posts with confidence.",
    quickLinks: "Quick Links",
    categories: "Top Categories",
    contactUs: "Contact",
    termsConditions: "Terms & Conditions",
    privacyPolicy: "Privacy Policy",
    faq: "FAQ",
    helpCenter: "Help Center",
    followUs: "Follow Us",
    allRightsReserved: "All rights reserved.",
    madeInJordan: "Made in Jordan",
    address: "Amman, Jordan",
    email: "info@tijarahjo.com",
    phone: "+962 7 9123 4567",
  },
  ar: {
    aboutText:
      "تجارة جو هو سوق الأردن الموثوق لبيع وشراء المنشورات الجديدة والمستعملة بكل ثقة.",
    quickLinks: "روابط سريعة",
    categories: "أهم الفئات",
    contactUs: "تواصل معنا",
    termsConditions: "الشروط والأحكام",
    privacyPolicy: "سياسة الخصوصية",
    faq: "الأسئلة الشائعة",
    helpCenter: "مركز المساعدة",
    followUs: "تابعنا",
    allRightsReserved: "جميع الحقوق محفوظة.",
    madeInJordan: "صنع في الأردن",
    address: "عمان، الأردن",
    email: "info@tijarahjo.com",
    phone: "+962 7 9123 4567",
  },
};

type SocialLink = {
  href: string;
  labelEn: string;
  labelAr: string;
  icon: LucideIcon;
};

const socialLinks: SocialLink[] = [
  {
    href: "https://www.facebook.com/TijarahJo",
    labelEn: "Facebook",
    labelAr: "فيسبوك",
    icon: Facebook,
  },
  {
    href: "https://x.com/TijarahJo",
    labelEn: "X",
    labelAr: "إكس",
    icon: Twitter,
  },
  {
    href: "https://www.instagram.com/TijarahJo",
    labelEn: "Instagram",
    labelAr: "إنستغرام",
    icon: Instagram,
  },
];

export function Footer({ language }: FooterProps) {
  const { categories, isLoading } = useCatalogCategories();
  const location = useLocation();
  const isRTL = language === "ar";
  const currentPath = `${location.pathname}${location.search}`;
  const currentYear = new Date().getFullYear();
  const content = footerCopyByLanguage[language];
  const topCategories = categories.slice(0, 5);

  return (
    <footer
      data-app-global-footer="true"
      dir={isRTL ? "rtl" : "ltr"}
      className="relative border-t border-white/10 bg-slate-950 text-slate-100 [content-visibility:auto] [contain-intrinsic-size:720px]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/75 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <section className="space-y-5 lg:col-span-5">
            <Link to="/" className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:opacity-90 transition-opacity">
              <Logo size="md" variant="light" className="drop-shadow-md" />
            </Link>
            <p className="max-w-md text-sm leading-7 text-slate-300">
              {content.aboutText}
            </p>
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-100">
                {content.followUs}
              </p>
              <div className="flex gap-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={
                        language === "ar" ? link.labelAr : link.labelEn
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-slate-300 transition-colors hover:border-primary/45 hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:text-primary"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-100/95">
              {content.quickLinks}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/terms"
                  state={{ fromPath: currentPath }}
                  className="rounded-sm text-slate-300 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {content.termsConditions}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  state={{ fromPath: currentPath }}
                  className="rounded-sm text-slate-300 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {content.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  state={{ fromPath: currentPath }}
                  className="rounded-sm text-slate-300 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {content.faq}
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  state={{ fromPath: currentPath }}
                  className="rounded-sm text-slate-300 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {content.helpCenter}
                </Link>
              </li>
            </ul>
          </section>

          <section className="space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-100/95">
              {content.categories}
            </h3>
            <ul className="space-y-3 text-sm">
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <li
                      key={`footer-category-skeleton-${index}`}
                      aria-hidden="true"
                      className="h-5 w-32 max-w-full animate-pulse rounded bg-white/10"
                    />
                  ))
                : topCategories.map((category) => (
                    <li key={String(category.id || category.name)}>
                      <Link
                        to={`/category/${encodeURIComponent(category.name)}`}
                        className="rounded-sm text-slate-300 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        {resolveCategoryName(category, language)}
                      </Link>
                    </li>
                  ))}
            </ul>
          </section>

          <section className="space-y-4 lg:col-span-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-100/95">
              {content.contactUs}
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/5 px-3 py-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                <span>{content.address}</span>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/5 px-3 py-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                <a
                  href={`mailto:${content.email}`}
                  className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {content.email}
                </a>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/5 px-3 py-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                <span dir="ltr">{content.phone}</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm text-slate-300 sm:flex-row sm:justify-between">
          <p>
            {language === "ar"
              ? `© ${currentYear} تجارة جو. ${content.allRightsReserved}`
              : `© ${currentYear} TijarahJo. ${content.allRightsReserved}`}
          </p>
        </div>
      </div>
    </footer>
  );
}
