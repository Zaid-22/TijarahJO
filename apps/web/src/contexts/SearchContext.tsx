import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTE_PATHS } from "../app/routes/routeConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchContextValue {
  /** Current value of the search input (may not be submitted yet). */
  searchQuery: string;
  /** Update the search input value without triggering a search. */
  setSearchQuery: (query: string) => void;
  /** The last *submitted* search query, used by data-fetching hooks. */
  activeSearchQuery: string;
  /** Directly set the active search query (e.g. clearing from another page). */
  setActiveSearchQuery: (query: string) => void;
  /** Trim, commit, and navigate to `/search`. */
  submitSearch: (query?: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const queryFromUrl =
    location.pathname === APP_ROUTE_PATHS.search
      ? new URLSearchParams(location.search).get("q")?.trim() || ""
      : "";

  const [searchQuery, setSearchQueryRaw] = useState(queryFromUrl);
  const [activeSearchQuery, setActiveSearchQuery] = useState(queryFromUrl);

  useEffect(() => {
    // Remove legacy persisted search so a full refresh always starts clean.
    localStorage.removeItem("tijarahjo_search_query");
    localStorage.removeItem("tijarahjo_active_search_query");
  }, []);

  // Ref keeps the latest value available synchronously for submitSearch.
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    if (location.pathname === APP_ROUTE_PATHS.home) {
      searchQueryRef.current = "";
      setSearchQueryRaw("");
      setActiveSearchQuery("");
      return;
    }

    if (location.pathname !== APP_ROUTE_PATHS.search) {
      return;
    }

    searchQueryRef.current = queryFromUrl;
    setSearchQueryRaw(queryFromUrl);
    setActiveSearchQuery(queryFromUrl);
  }, [location.pathname, location.search, queryFromUrl]);

  const setSearchQuery = useCallback(
    (query: string) => {
      searchQueryRef.current = query;
      setSearchQueryRaw(query);
    },
    [setSearchQueryRaw],
  );

  const submitSearch = useCallback((query?: string) => {
    const normalizedQuery = (query ?? searchQueryRef.current).trim();
    searchQueryRef.current = normalizedQuery;
    setSearchQueryRaw(normalizedQuery);
    setActiveSearchQuery(normalizedQuery);
    if (!normalizedQuery) {
      return;
    }
    const params = new URLSearchParams();
    params.set("q", normalizedQuery);
    navigate({
      pathname: APP_ROUTE_PATHS.search,
      search: `?${params.toString()}`,
    });
  }, [navigate, setSearchQueryRaw, setActiveSearchQuery]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        activeSearchQuery,
        setActiveSearchQuery,
        submitSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error(
      "useSearch must be used inside <SearchProvider>. " +
        "Wrap your app with <SearchProvider> in App.tsx.",
    );
  }
  return context;
}
