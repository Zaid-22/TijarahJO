import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationCurrent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../../../shared/ui/pagination";
import type { Language } from "../../../types";

interface MarketplaceResultsPaginationProps {
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  language: Language;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
  showLoadingIndicator?: boolean;
}

export function MarketplaceResultsPagination({
  currentPage,
  totalPages,
  isLoading = false,
  language,
  onPrevious,
  onNext,
  className,
  showLoadingIndicator = true,
}: MarketplaceResultsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const isRtl = language === "ar";
  const labels = isRtl
    ? {
        pagination: "ترقيم صفحات النتائج",
        previous: "السابق",
        previousPage: "الانتقال إلى الصفحة السابقة",
        next: "التالي",
        nextPage: "الانتقال إلى الصفحة التالية",
        currentPage: "الصفحة الحالية",
      }
    : {
        pagination: "Results pagination",
        previous: "Previous",
        previousPage: "Go to previous page",
        next: "Next",
        nextPage: "Go to next page",
        currentPage: "Current page",
      };

  return (
    <div className={className}>
      <Pagination aria-label={labels.pagination} dir={isRtl ? "rtl" : "ltr"}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={onPrevious}
              disabled={currentPage === 1 || isLoading}
              isRtl={isRtl}
              label={labels.previous}
              aria-label={labels.previousPage}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationCurrent
              aria-label={`${labels.currentPage}: ${currentPage} / ${totalPages}`}
            >
              {currentPage} / {totalPages}
            </PaginationCurrent>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={onNext}
              disabled={currentPage === totalPages || isLoading}
              isRtl={isRtl}
              label={labels.next}
              aria-label={labels.nextPage}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {showLoadingIndicator && isLoading ? (
        <div
          className="mt-6 flex items-center justify-center gap-3"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
          <span className="text-muted-foreground">
            {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
          </span>
        </div>
      ) : null}
    </div>
  );
}
