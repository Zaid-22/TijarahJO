import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Users, ShoppingBag, Tags, X } from "lucide-react";
import { Input } from "../../../shared/ui/input";
import { apiRequest } from "../../../services/api/client";
import { logger } from "../../../shared/lib/logger";
import { buildCurrentPath } from "../../../shared/lib/backNavigation";

type SearchResultItem = {
  id: number;
  type: string;
  title: string;
  subtitle: string;
};

type AdminSearchResult = {
  users: SearchResultItem[];
  posts: SearchResultItem[];
  categories: SearchResultItem[];
};

const TYPE_ICONS: Record<string, typeof Users> = {
  USER: Users,
  LISTING: ShoppingBag,
  CATEGORY: Tags,
};

const TYPE_ROUTES: Record<string, (id: number) => string> = {
  USER: (id) => `/admin/users/${id}`,
  LISTING: () => "/admin/listings",
  CATEGORY: () => "/admin/categories",
};

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Keyboard shortcut: "/" to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest<AdminSearchResult>(
          `/admin/search?q=${encodeURIComponent(query)}`,
          { method: "GET" },
        );
        if (response.success && response.data) {
          setResults(response.data);
          setIsOpen(true);
        }
      } catch (error) {
        logger.warn("[AdminGlobalSearch] Search failed", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      const routeFn = TYPE_ROUTES[item.type];
      if (routeFn) {
        navigate(routeFn(item.id), {
          state: {
            fromPath: buildCurrentPath(location.pathname, location.search),
          },
        });
      }
      setQuery("");
      setIsOpen(false);
    },
    [location.pathname, location.search, navigate],
  );

  const allResults = results
    ? [...results.users, ...results.posts, ...results.categories]
    : [];

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder='Search users by name, email, or phone... (press "/")'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results && setIsOpen(true)}
          className="pl-9 pr-8 h-9 text-sm bg-muted/50 border-none focus:bg-background focus:ring-1 focus:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : allResults.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {["users", "posts", "categories"].map((group) => {
                const items = results?.[group as keyof AdminSearchResult] ?? [];
                if (items.length === 0) return null;
                const groupLabel =
                  group === "posts"
                    ? "Listings"
                    : group.charAt(0).toUpperCase() + group.slice(1);
                return (
                  <div key={group}>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                      {groupLabel}
                    </div>
                    {items.map((item) => {
                      const Icon = TYPE_ICONS[item.type] ?? Search;
                      return (
                        <button
                          type="button"
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
