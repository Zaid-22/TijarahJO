import { PostResultsGrid } from "../components/PostResultsGrid";
import { PageShell } from "../../../shared/ui/page-shell";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import { translations, Language } from "../../../translations";
import { Post } from "../../../types";
import { useMarketplaceDiscoveryState } from "../../../shared/hooks/useMarketplaceDiscoveryState";
import { useCallback, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AdvancedSearchFilters, type SearchFilters } from "../components/AdvancedSearchFilters";
import { ArrowLeft } from "lucide-react";

interface AllPostsPageProps {
  onBack: () => void;
  posts: Post[];
  onPostClick: (postId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
  language: Language;
  isAuthenticated?: boolean;
  darkMode?: boolean;
  currentUserId?: string;
  onRequireAuth?: () => void;
}

export function AllPostsPage({
  onBack,
  posts,
  onPostClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  isAuthenticated = false,
  currentUserId,
  onRequireAuth,
}: AllPostsPageProps) {
  const t = translations[language];
  const [searchParams, setSearchParams] = useSearchParams();
  const sortFromUrl = searchParams.get("sortBy") as "date" | "views" | "price" | null;
  const initialSortBy = sortFromUrl || "views";

  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const initialPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const syncPageToUrl = useCallback(
    (page: number) => {
      const nextParams = new URLSearchParams(searchParams);
      if (page <= 1) {
        nextParams.delete("page");
      } else {
        nextParams.set("page", String(page));
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const [appliedSearchFilters, setAppliedSearchFilters] = useState<SearchFilters>({
    sortBy: initialSortBy,
    sortOrder: "desc",
  });
  const [draftSearchFilters, setDraftSearchFilters] = useState<SearchFilters>({
    sortBy: initialSortBy,
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredPosts = useMemo(() => {
    let results = [...posts];

    if (appliedSearchFilters.category) {
      results = results.filter(
        (p) =>
          p.category?.toLowerCase() === appliedSearchFilters.category?.toLowerCase()
      );
    }
    if (appliedSearchFilters.city) {
      results = results.filter((p) =>
        p.location?.toLowerCase().includes(appliedSearchFilters.city!.toLowerCase())
      );
    }
    if (appliedSearchFilters.minPrice != null) {
      results = results.filter((p) => p.price >= appliedSearchFilters.minPrice!);
    }
    if (appliedSearchFilters.maxPrice != null) {
      results = results.filter((p) => p.price <= appliedSearchFilters.maxPrice!);
    }
    
    if (appliedSearchFilters.sortBy) {
      const order = appliedSearchFilters.sortOrder === "asc" ? 1 : -1;
      results = [...results].sort((a, b) => {
        if (appliedSearchFilters.sortBy === "price") {
          return (a.price - b.price) * order;
        }
        if (appliedSearchFilters.sortBy === "views") {
          return ((a.views ?? 0) - (b.views ?? 0)) * order;
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (dateA - dateB) * order;
      });
    }

    return results;
  }, [posts, appliedSearchFilters]);

  const {
    viewMode,
    displayedResults: displayedPosts,
    shouldShowPagination,
    pagination,
  } = useMarketplaceDiscoveryState({
    items: filteredPosts,
    itemsPerPage: 12,
    defaultViewMode: "list",
    initialPage,
    onPageChange: syncPageToUrl,
    storageKey: "tijarahjo_view_mode_all_posts",
  });

  return (
    <PageShell>
      {/* Unified Header Section */}
      <div className="mx-auto w-full max-w-[94rem] px-4 pt-6 sm:px-6 lg:px-8 xl:px-10">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "ar" ? "العودة" : "Back to Marketplace"}
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {language === "ar" ? "جميع المنشورات" : "All Posts"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {language === "ar"
            ? "تصفح جميع الإعلانات المتاحة في السوق"
            : "Browse all available listings in the marketplace"}
        </p>
      </div>

      <main className="mx-auto w-full max-w-[94rem] px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-7 xl:grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdvancedSearchFilters
                language={language}
                filters={appliedSearchFilters}
                onFiltersChange={setAppliedSearchFilters}
                onApply={() => {}}
                onClear={() => {
                  const defaultSort = { sortBy: initialSortBy, sortOrder: "desc" as const };
                  setDraftSearchFilters(defaultSort);
                  setAppliedSearchFilters(defaultSort);
                }}
                showCategory
                showApplyButton={false}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                {language === "ar" ? "الإعلانات المتاحة" : "Available Listings"}
              </h2>
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100/80 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                {language === "ar" ? `${displayedPosts.length} نتيجة` : `${displayedPosts.length} results`}
              </span>
            </div>

            <MarketplaceDiscoveryControls
              language={language}
              className="mb-6"
              toolbarClassName="flex-none"
              mobileFilters={{
                isOpen: showFilters,
                toggleLabel: t.filters,
                onToggle: () => setShowFilters(!showFilters),
                content: (
                  <AdvancedSearchFilters
                    language={language}
                    filters={draftSearchFilters}
                    onFiltersChange={setDraftSearchFilters}
                    onApply={() => {
                      setAppliedSearchFilters(draftSearchFilters);
                      setShowFilters(false);
                    }}
                    onClear={() => {
                      const defaultSort = { sortBy: initialSortBy, sortOrder: "desc" as const };
                      setDraftSearchFilters(defaultSort);
                      setAppliedSearchFilters(defaultSort);
                      setShowFilters(false);
                    }}
                    showCategory
                  />
                ),
              }}
            />

            <PostResultsGrid
              posts={displayedPosts}
              viewMode={viewMode}
              onPostClick={onPostClick}
              favoriteIds={favoriteIds}
              onFavoriteToggle={onFavoriteToggle}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              language={language}
              emptyState={{
                title: language === "ar" ? "لم يتم العثور على منشورات" : "No Posts Found",
                description:
                  language === "ar"
                    ? "حاول تعديل الفلاتر أو مصطلحات البحث للعثور على ما تبحث عنه."
                    : "Try adjusting your filters or search terms to find what you're looking for.",
                actionLabel: t.clearFilters,
                onAction: () => {
                  const defaultSort = { sortBy: initialSortBy, sortOrder: "desc" as const };
                  setDraftSearchFilters(defaultSort);
                  setAppliedSearchFilters(defaultSort);
                },
              }}
              onRequireAuth={onRequireAuth}
            />

            {shouldShowPagination ? (
              <MarketplaceResultsPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                isLoading={pagination.isLoading}
                language={language}
                onPrevious={pagination.onPrevious}
                onNext={pagination.onNext}
                className="mt-12 mb-8"
                showLoadingIndicator
              />
            ) : null}
          </div>
        </div>
      </main>

    </PageShell>
  );
}
