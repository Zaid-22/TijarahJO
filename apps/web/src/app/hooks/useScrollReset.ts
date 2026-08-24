import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Language } from "../../types";

const ROUTE_LABELS: Record<string, Record<Language, string>> = {
  "": { en: "Marketplace", ar: "السوق" },
  admin: { en: "Administration", ar: "لوحة الإدارة" },
  category: { en: "Category listings", ar: "إعلانات الفئة" },
  chat: { en: "Messages", ar: "الرسائل" },
  compare: { en: "Compare listings", ar: "مقارنة الإعلانات" },
  "complete-profile": { en: "Complete profile", ar: "إكمال الملف الشخصي" },
  faq: { en: "Frequently asked questions", ar: "الأسئلة الشائعة" },
  favorites: { en: "Favorites", ar: "المفضلة" },
  "forgot-password": { en: "Reset password", ar: "إعادة تعيين كلمة المرور" },
  help: { en: "Help center", ar: "مركز المساعدة" },
  login: { en: "Sign in", ar: "تسجيل الدخول" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  post: { en: "Listing details", ar: "تفاصيل الإعلان" },
  posts: { en: "All listings", ar: "جميع الإعلانات" },
  privacy: { en: "Privacy policy", ar: "سياسة الخصوصية" },
  profile: { en: "Profile", ar: "الملف الشخصي" },
  register: { en: "Create account", ar: "إنشاء حساب" },
  search: { en: "Search results", ar: "نتائج البحث" },
  sell: { en: "Create listing", ar: "إنشاء إعلان" },
  seller: { en: "Seller profile", ar: "ملف البائع" },
  settings: { en: "Settings", ar: "الإعدادات" },
  terms: { en: "Terms and conditions", ar: "الشروط والأحكام" },
  "verify-email": { en: "Verify email", ar: "تأكيد البريد الإلكتروني" },
};

const ROUTE_DESCRIPTIONS: Record<string, Record<Language, string>> = {
  "": {
    en: "Buy and sell new and used items across Jordan on TijarahJO.",
    ar: "اشترِ وبِع المنتجات الجديدة والمستعملة في جميع أنحاء الأردن على تجارة جو.",
  },
  category: {
    en: "Browse marketplace listings in this category on TijarahJO.",
    ar: "تصفح إعلانات السوق ضمن هذه الفئة على تجارة جو.",
  },
  faq: {
    en: "Find answers to frequently asked questions about using TijarahJO.",
    ar: "اعثر على إجابات للأسئلة الشائعة حول استخدام تجارة جو.",
  },
  help: {
    en: "Get help buying, selling, and managing your TijarahJO account.",
    ar: "احصل على المساعدة في الشراء والبيع وإدارة حسابك على تجارة جو.",
  },
  post: {
    en: "View listing details, seller information, and photos on TijarahJO.",
    ar: "اعرض تفاصيل الإعلان ومعلومات البائع والصور على تجارة جو.",
  },
  posts: {
    en: "Browse available marketplace listings from sellers across Jordan.",
    ar: "تصفح إعلانات السوق المتاحة من البائعين في جميع أنحاء الأردن.",
  },
  privacy: {
    en: "Read the TijarahJO privacy policy and learn how information is handled.",
    ar: "اقرأ سياسة الخصوصية في تجارة جو وتعرّف على كيفية التعامل مع المعلومات.",
  },
  seller: {
    en: "View this seller's profile, listings, and marketplace reputation.",
    ar: "اعرض ملف البائع وإعلاناته وسمعته في السوق.",
  },
  terms: {
    en: "Read the terms and conditions for using the TijarahJO marketplace.",
    ar: "اقرأ الشروط والأحكام الخاصة باستخدام سوق تجارة جو.",
  },
};

const INDEXABLE_ROUTE_SEGMENTS = new Set([
  "",
  "category",
  "faq",
  "help",
  "post",
  "posts",
  "privacy",
  "seller",
  "terms",
]);
const PUBLIC_SITE_ORIGIN = "https://tijarahjo.online";

function resolvePrimarySegment(pathname: string): string {
  return pathname.toLowerCase().split("/").filter(Boolean)[0] ?? "";
}

function resolveRouteLabel(pathname: string, language: Language): string {
  const primarySegment = resolvePrimarySegment(pathname);

  return (
    ROUTE_LABELS[primarySegment]?.[language] ??
    (language === "ar" ? "الصفحة غير موجودة" : "Page not found")
  );
}

function updateRouteMetadata(
  pathname: string,
  language: Language,
  routeLabel: string,
) {
  const primarySegment = resolvePrimarySegment(pathname);
  const description =
    ROUTE_DESCRIPTIONS[primarySegment]?.[language] ??
    (language === "ar"
      ? `${routeLabel} على منصة تجارة جو.`
      : `${routeLabel} on the TijarahJO marketplace.`);
  const descriptionMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  descriptionMeta?.setAttribute("content", description);

  let robotsMeta =
    document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement("meta");
    robotsMeta.name = "robots";
    document.head.appendChild(robotsMeta);
  }

  const isIndexable = INDEXABLE_ROUTE_SEGMENTS.has(primarySegment);
  robotsMeta.content = isIndexable ? "index, follow" : "noindex, nofollow";

  const existingCanonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"][data-route-managed="true"]',
  );
  if (!isIndexable) {
    existingCanonical?.remove();
    return;
  }

  const canonical = existingCanonical ?? document.createElement("link");
  canonical.rel = "canonical";
  canonical.dataset.routeManaged = "true";
  const normalizedPathname =
    pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  canonical.href = `${PUBLIC_SITE_ORIGIN}${normalizedPathname}`;
  if (!existingCanonical) {
    document.head.appendChild(canonical);
  }
}

/**
 * Resets scroll position, updates page metadata, and announces client-side
 * route changes without moving focus during the initial application load.
 */
export function useScrollReset(language: Language) {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);
  const [routeAnnouncement, setRouteAnnouncement] = useState("");

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    const routeLabel = resolveRouteLabel(location.pathname, language);
    document.title = `${routeLabel} | TijarahJO`;
    updateRouteMetadata(location.pathname, language, routeLabel);

    if (previousPathnameRef.current === location.pathname) {
      return;
    }

    previousPathnameRef.current = location.pathname;
    setRouteAnnouncement("");

    const animationFrame = window.requestAnimationFrame(() => {
      const mainContent = document.getElementById("main-content");
      mainContent?.focus({ preventScroll: true });
      setRouteAnnouncement(
        language === "ar"
          ? `تم الانتقال إلى ${routeLabel}`
          : `Navigated to ${routeLabel}`,
      );
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [language, location.pathname]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  return routeAnnouncement;
}
