import { QueryClient } from "@tanstack/react-query";

const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_GC_TIME_MS = 5 * 60_000;

export const serverQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: DEFAULT_RETRY_COUNT,
      staleTime: 0,
      gcTime: DEFAULT_GC_TIME_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
