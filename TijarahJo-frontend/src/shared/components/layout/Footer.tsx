import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

interface FooterProps {
  language: "en" | "ar";
}

export function Footer({ language }: FooterProps) {
  const t = {
    en: {
      about: "About TijarahJo",
      aboutText: "Your trusted marketplace in Jordan for buying and selling new and used items. Safe, easy, and reliable.",
      quickLinks: "Quick Links",
      categories: "Categories",
      support: "Support",
      contactUs: "Contact Us",
      termsConditions: "Terms & Conditions",
      privacyPolicy: "Privacy Policy",
      faq: "FAQ",
      helpCenter: "Help Center",
      electronics: "Electronics",
      vehicles: "Vehicles",
      realEstate: "Real Estate",
      fashion: "Fashion & Clothing",
      furniture: "Furniture",
      mobilePhones: "Mobile Phones",
      followUs: "Follow Us",
      allRightsReserved: "© 2024 TijarahJo. All rights reserved.",
      address: "Amman, Jordan",
      email: "info@tijarahjo.com",
      phone: "+962 7 9123 4567",
    },
    ar: {
      about: "حول تجارة جو",
      aboutText: "سوقك الموثوق في الأردن لبيع وشراء السلع الجديدة والمستعملة. آمن وسهل وموثوق.",
      quickLinks: "روابط سريعة",
      categories: "الفئات",
      support: "الدعم",
      contactUs: "اتصل بنا",
      termsConditions: "الشروط والأحكام",
      privacyPolicy: "سياسة الخصوصية",
      faq: "الأسئلة الشائعة",
      helpCenter: "مركز المساعدة",
      electronics: "الإلكترونيات",
      vehicles: "المركبات",
      realEstate: "العقارات",
      fashion: "الأزياء والملابس",
      furniture: "الأثاث",
      mobilePhones: "الهواتف المحمولة",
      followUs: "تابعنا",
      allRightsReserved: "© 2024 تجارة جو. جميع الحقوق محفوظة.",
      address: "عمان، الأردن",
      email: "info@tijarahjo.com",
      phone: "+962 7 9123 4567",
    },
  };

  const content = t[language];

  return (
    <footer className="bg-black border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-white text-lg">
              {content.about}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {content.aboutText}
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-gray-400 flex items-center justify-center">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-900 text-gray-400 flex items-center justify-center">
                <Twitter className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-900 text-gray-400 flex items-center justify-center">
                <Instagram className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white text-lg">
              {content.quickLinks}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-gray-400">
                  {content.contactUs}
                </span>
              </li>
              <li>
                <span className="text-gray-400">
                  {content.termsConditions}
                </span>
              </li>
              <li>
                <span className="text-gray-400">
                  {content.privacyPolicy}
                </span>
              </li>
              <li>
                <span className="text-gray-400">
                  {content.faq}
                </span>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-white text-lg">
              {content.categories}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-gray-400">
                  {content.electronics}
                </span>
              </li>
              <li>
                <span className="text-gray-400">
                  {content.vehicles}
                </span>
              </li>
              <li>
                <span className="text-gray-400">
                  {content.realEstate}
                </span>
              </li>
              <li>
                <span className="text-gray-400">
                  {content.fashion}
                </span>
              </li>
              <li>
                <span className="text-gray-400">
                  {content.mobilePhones}
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-white text-lg">
              {content.contactUs}
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{content.address}</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{content.email}</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span dir="ltr">{content.phone}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {content.allRightsReserved}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
