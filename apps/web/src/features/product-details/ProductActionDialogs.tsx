import { Phone } from "lucide-react";
import { EditProductDialog } from "../../features/marketplace/components/EditProductDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../shared/ui/alert-dialog";
import { Button } from "../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../shared/ui/dialog";
import type { Language, Product } from "../../types";

interface ProductActionDialogsProps {
  language: Language;
  isRTL: boolean;
  product: Product;
  sellerPhone: string | null;
  showEditDialog: boolean;
  setShowEditDialog: (open: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (open: boolean) => void;
  showPhoneDialog: boolean;
  setShowPhoneDialog: (open: boolean) => void;
  showMarkAsSoldDialog: boolean;
  setShowMarkAsSoldDialog: (open: boolean) => void;
  showRelistDialog: boolean;
  setShowRelistDialog: (open: boolean) => void;
  onUpdateProduct?: (product: Product) => void | Promise<void>;
  onDeleteProduct?: (productId: string) => void | Promise<void>;
}

export function ProductActionDialogs({
  language,
  isRTL,
  product,
  sellerPhone,
  showEditDialog,
  setShowEditDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  showPhoneDialog,
  setShowPhoneDialog,
  showMarkAsSoldDialog,
  setShowMarkAsSoldDialog,
  showRelistDialog,
  setShowRelistDialog,
  onUpdateProduct,
  onDeleteProduct,
}: ProductActionDialogsProps) {
  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditProductDialog
          product={product}
          onSave={(updatedProduct) => {
            if (onUpdateProduct) {
              void onUpdateProduct(updatedProduct);
            }
            setShowEditDialog(false);
          }}
          onCancel={() => setShowEditDialog(false)}
          language={language}
        />
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "هل أنت متأكد؟" : "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنتج نهائياً."
                : "This action cannot be undone. This will permanently delete the product."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (onDeleteProduct) {
                  await onDeleteProduct(product.id);
                }
                setShowDeleteDialog(false);
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {language === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">
            {language === "ar" ? "رقم الهاتف" : "Phone Number"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? "انقر على الرقم للاتصال بالبائع"
              : "Click the number to call the seller"}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-6 p-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center bg-[#0A4ABF1A]"
            >
              <Phone className="w-8 h-8 text-[#0A4ABF]" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">
                {language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </h3>
              <p className="text-sm text-gray-500">
                {language === "ar"
                  ? "انقر على الرقم للاتصال بالبائع"
                  : "Click the number to call the seller"}
              </p>
            </div>
            <a
              href={`tel:${sellerPhone || product.phone || "962700000000"}`}
              className="text-3xl font-semibold tracking-wide hover:opacity-80 transition-opacity text-[#0A4ABF]"
            >
              {sellerPhone || product.phone || "+962 7 0000 0000"}
            </a>
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <a
                href={`tel:${sellerPhone || product.phone || "962700000000"}`}
                className="flex-1"
              >
                <Button
                  className="w-full bg-[#0A4ABF] text-white hover:bg-[#083a99]"
                >
                  <Phone className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {language === "ar" ? "اتصل الآن" : "Call Now"}
                </Button>
              </a>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPhoneDialog(false)}
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showMarkAsSoldDialog}
        onOpenChange={setShowMarkAsSoldDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "تأكيد البيع" : "Confirm Sale"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "هل تريد تأكيد بيع هذا المنتج؟ سيتم وضع علامة 'مُباع' على المنتج ولن يتمكن المشترون من رؤيته."
                : "Are you sure you want to mark this post as sold? The post will be marked as 'SOLD' and buyers won't be able to view it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onUpdateProduct) {
                  void onUpdateProduct({ ...product, status: "SOLD" });
                }
                setShowMarkAsSoldDialog(false);
              }}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-[#0A4ABF] text-white hover:bg-[#083a99]"
            >
              {language === "ar" ? "تأكيد البيع" : "Mark as Sold"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRelistDialog} onOpenChange={setShowRelistDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "تأكيد إعادة الإدراج" : "Confirm Re-listing"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "هل تريد إعادة إدراج هذا المنتج؟ سيتم تنشيط المنتج مرة أخرى ويمكن للمشترين مشاهدته."
                : "Are you sure you want to re-list this post? The post will become active again and buyers will be able to view it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onUpdateProduct) {
                  void onUpdateProduct({ ...product, status: "ACTIVE" });
                }
                setShowRelistDialog(false);
              }}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-[#0A4ABF] text-white hover:bg-[#083a99]"
            >
              {language === "ar" ? "إعادة الإداج" : "Re-list Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
