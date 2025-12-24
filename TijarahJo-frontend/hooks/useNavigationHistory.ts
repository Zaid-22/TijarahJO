import { useState, useCallback } from 'react';

type PageState = {
  page: string;
  data?: any;
};

export function useNavigationHistory() {
  const [history, setHistory] = useState<PageState[]>([{ page: 'home' }]);

  const pushHistory = useCallback((page: string, data?: any) => {
    setHistory(prev => [...prev, { page, data }]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current page
      setHistory(newHistory);
      return newHistory[newHistory.length - 1]; // Return previous page
    }
    return { page: 'home' }; // Default to home if no history
  }, [history]);

  const getCurrentPage = useCallback(() => {
    return history[history.length - 1];
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([{ page: 'home' }]);
  }, []);

  return {
    pushHistory,
    goBack,
    getCurrentPage,
    clearHistory,
    historyLength: history.length,
  };
}
