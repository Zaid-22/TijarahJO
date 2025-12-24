import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { ProductCard } from "./ProductCard";
import { Footer } from "./Footer";
// import { Card, CardContent } from "../ui/card"; // Unused
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { translations, Language } from "../../translations";
import { Product } from "../../types";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Package, 
  MapPin,
  Calendar,
  Phone,
  Grid3x3,
  LayoutGrid,
  List,
  Columns
} from "lucide-react";

interface Seller {
  id: string;
  name: string;
  activeListings: number;
  joinedDate: string;
  location: string;
  area?: string; // Area/neighborhood within the city
  initials: string;
  color: string;
  bio?: string;
  phone: string;
}

interface SellerProfilePageProps {
  seller: Seller;
  products: Product[];
  onBack: () => void;
  onProductClick: (productId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (productId: string) => void;
  language: Language;
  isAuthenticated: boolean;
}

export function SellerProfilePage({ 
  seller, 
  products,
  onBack, 
  onProductClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  isAuthenticated
}: SellerProfilePageProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const [viewMode, setViewMode] = useState<"grid-4" | "grid-3" | "grid-2" | "list">("grid-4");
  const [activeTab, setActiveTab] = useState("products");
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [sellerData, setSellerData] = useState<{ joinedDate: string; avatar?: string } | null>(null);

  // Fetch actual seller data from API
  useEffect(() => {
    const fetchSellerData = async () => {
      if (seller.id) {
        try {
          const apiBaseUrl =
            (import.meta as any).env?.VITE_API_BASE_URL ||
            "http://localhost:5033/api";
          const response = await fetch(`${apiBaseUrl}/users/${seller.id}`);
          if (response.ok) {
            const userData = await response.json();
            const user = userData.data || userData;
            if (user) {
              const joinDate = user.JoinDate || user.joinDate;
              const formattedDate = joinDate
                ? new Date(joinDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : seller.joinedDate;
              setSellerData({
                joinedDate: formattedDate,
                avatar: user.Avatar || user.avatar,
              });
            }
          }
        } catch (error) {
          console.warn("[SellerProfilePage] Failed to fetch seller data:", error);
        }
      }
    };
    fetchSellerData();
  }, [seller.id, seller.joinedDate]);

  // Get seller's products
  const sellerProducts = products.filter(p => p.seller === seller.name);
  // Only show ACTIVE products to buyers (not SOLD or DELETED)
  const activeProducts = sellerProducts.filter(p => p.status !== "SOLD" && p.status !== "DELETED");

  // Format phone number with masking
  const formatPhone = (phone: string, revealed: boolean) => {
    if (revealed) {
      // Show full number formatted nicely
      return phone;
    }
    // Show masked version: +962 *** ***
    return `${phone.substring(0, 4)} *** ***`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F6FA" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={onBack}
                style={{ color: "#0A4ABF" }}
                className="hover:bg-blue-50 transition-all duration-200 hover:scale-105 -ml-2"
              >
                <ArrowLeft className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="hidden sm:inline">{t.backToMarketplace || "Back"}</span>
              </Button>
              
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
              
              <button 
                onClick={onBack}
                className="cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-3 active:scale-95 hidden sm:block"
                title="Return to Home"
              >
                <Logo />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b" style={{ borderColor: "#F5F6FA" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="w-32 h-32">
                {sellerData?.avatar && (
                  <AvatarImage src={sellerData.avatar} alt={seller.name} />
                )}
                <AvatarFallback 
                  className="text-3xl"
                  style={{ 
                    backgroundColor: seller.color + "20",
                    color: seller.color
                  }}
                >
                  {seller.initials}
                </AvatarFallback>
              </Avatar>
              
              {/* Contact Buttons - Mobile */}
              <div className="flex md:hidden gap-3 w-full">
                <Button 
                  className="flex-1 hover:opacity-90"
                  style={{ backgroundColor: "#25D366", color: "white" }}
                  onClick={() => window.open(`https://wa.me/${seller.phone}`, '_blank')}
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  <span className="sr-only">{t.sendMessage || "Message"}</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  style={{ borderColor: "#0A4ABF", color: "#0A4ABF" }}
                  onClick={() => setShowPhoneDialog(true)}
                >
                  <Phone className="w-5 h-5" />
                  <span className="sr-only">{t.call || "Call"}</span>
                </Button>
              </div>
            </div>

            {/* Seller Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 style={{ color: "#000000" }}>{seller.name}</h1>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{seller.location}{seller.area ? `, ${seller.area}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{t.joined || "Joined"} {sellerData?.joinedDate || seller.joinedDate}</span>
                    </div>
                  </div>
                  {seller.bio && (
                    <p className="text-gray-600 max-w-2xl mb-4">
                      {seller.bio}
                    </p>
                  )}
                </div>

                {/* Contact Buttons - Desktop */}
                <div className="hidden md:flex gap-3">
                  <Button 
                    className="hover:opacity-90"
                    style={{ backgroundColor: "#25D366", color: "white" }}
                    onClick={() => window.open(`https://wa.me/${seller.phone}`, '_blank')}
                  >
                    <WhatsAppIcon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t.sendMessage || "Message"}
                  </Button>
                  <Button 
                    variant="outline"
                    style={{ borderColor: "#0A4ABF", color: "#0A4ABF" }}
                    onClick={() => setShowPhoneDialog(true)}
                  >
                    <Phone className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t.call || "Call"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="products">
                {t.activeListings || "Active"}
              </TabsTrigger>
            </TabsList>

            {/* View Mode Controls */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border" style={{ borderColor: "#E5E7EB" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-4")}
                  className={`h-8 w-8 p-0 ${viewMode === "grid-4" ? "bg-blue-50" : ""}`}
                  style={{ color: viewMode === "grid-4" ? "#0A4ABF" : "#6B7280" }}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-3")}
                  className={`h-8 w-8 p-0 ${viewMode === "grid-3" ? "bg-blue-50" : ""}`}
                  style={{ color: viewMode === "grid-3" ? "#0A4ABF" : "#6B7280" }}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-2")}
                  className={`h-8 w-8 p-0 ${viewMode === "grid-2" ? "bg-blue-50" : ""}`}
                  style={{ color: viewMode === "grid-2" ? "#0A4ABF" : "#6B7280" }}
                >
                  <Columns className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-8 w-8 p-0 ${viewMode === "list" ? "bg-blue-50" : ""}`}
                  style={{ color: viewMode === "list" ? "#0A4ABF" : "#6B7280" }}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="products">
            {activeProducts.length > 0 ? (
              <div className={`grid ${viewMode === "grid-4" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : viewMode === "grid-3" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : viewMode === "grid-2" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-6`}>
                {activeProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    onProductClick={onProductClick}
                    viewMode={viewMode}
                    isFavorite={favoriteIds.includes(product.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: "#F5F6FA" }}
                >
                  <Package className="w-12 h-12" style={{ color: "#0A4ABF" }} />
                </div>
                <h3 className="mb-2" style={{ color: "#000000" }}>
                  {t.noActiveListings || "No Active Listings"}
                </h3>
                <p className="text-gray-600">
                  {t.noActiveListingsDescription || "This seller doesn't have any active listings at the moment."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Phone Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">
            {language === "ar" ? "اتصل بالبائع" : "Call Seller"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? "اتصل بالبائع عبر الهاتف"
              : "Call the seller by phone"}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-6 p-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(10, 74, 191, 0.1)" }}>
              <Phone className="w-8 h-8" style={{ color: "#0A4ABF" }} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">
                {language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </h3>
              <p className="text-sm text-gray-500">
                {language === "ar"
                  ? phoneRevealed 
                    ? "انقر على الرقم للاتصال بالبائع"
                    : "انقر على الزر لعرض رقم الهاتف"
                  : phoneRevealed 
                    ? "Click the number to call the seller"
                    : "Click the button to reveal the phone number"}
              </p>
            </div>
            
            {/* Phone Number Display */}
            <div className="w-full">
              <div 
                className="px-6 py-4 rounded-lg text-center"
                style={{ 
                  backgroundColor: "#F5F6FA",
                  border: "2px dashed #0A4ABF"
                }}
              >
                <div className="text-2xl font-bold tracking-wider" style={{ color: "#0A4ABF" }}>
                  {formatPhone(seller.phone, phoneRevealed)}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              {!phoneRevealed ? (
                <Button
                  className="flex-1"
                  style={{
                    backgroundColor: "#0A4ABF",
                    color: "white",
                  }}
                  onClick={() => setPhoneRevealed(true)}
                >
                  <Phone className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {language === "ar" ? "عرض رقم الهاتف" : "Show Phone Number"}
                </Button>
              ) : (
                <a
                  href={`tel:${seller.phone}`}
                  className="flex-1"
                >
                  <Button
                    className="w-full"
                    style={{
                      backgroundColor: "#0A4ABF",
                      color: "white",
                    }}
                  >
                    <Phone className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {language === "ar" ? "اتصل الآن" : "Call Now"}
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPhoneDialog(false);
                  setPhoneRevealed(false);
                }}
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer language={language} />
    </div>
  );
}