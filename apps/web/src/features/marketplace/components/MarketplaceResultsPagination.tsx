import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
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

  return (
    <div className={className}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={onPrevious}
              disabled={currentPage === 1 || isLoading}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive>
              {currentPage} / {totalPages}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={onNext}
              disabled={currentPage === totalPages || isLoading}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {showLoadingIndicator && isLoading ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">
            {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
          </span>
        </div>
      ) : null}
    </div>
  );
}
