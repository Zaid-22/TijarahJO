import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../shared/hooks/useLocalStorage";

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
  submitSearch: () => void;
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

  const [searchQuery, setSearchQueryRaw] = useLocalStorage(
    "tijarahjo_search_query",
    "",
  );
  const [activeSearchQuery, setActiveSearchQuery] = useLocalStorage(
    "tijarahjo_active_search_query",
    "",
  );

  // Ref keeps the latest value available synchronously for submitSearch.
  const searchQueryRef = useRef(searchQuery);

  const setSearchQuery = useCallback(
    (query: string) => {
      searchQueryRef.current = query;
      setSearchQueryRaw(query);
    },
    [setSearchQueryRaw],
  );

  const submitSearch = useCallback(() => {
    const normalizedQuery = searchQueryRef.current.trim();
    searchQueryRef.current = normalizedQuery;
    setSearchQueryRaw(normalizedQuery);
    setActiveSearchQuery(normalizedQuery);
    if (!normalizedQuery) {
      return;
    }
    navigate("/search");
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
