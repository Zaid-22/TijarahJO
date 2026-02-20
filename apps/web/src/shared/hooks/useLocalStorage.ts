import { useState, useEffect, useCallback } from "react";
import { storage } from "../../utils";
import { logger } from "../lib/logger";

/**
 * Custom hook to sync state with localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storage.get(key, initialValue);
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prevValue) => {
          // Allow value to be a function so we have same API as useState
          const valueToStore =
            value instanceof Function ? value(prevValue) : value;
          storage.set(key, valueToStore);
          return valueToStore;
        });
      } catch (error) {
        logger.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      storage.remove(key);
      setStoredValue(initialValue);
    } catch (error) {
      logger.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) {
        return;
      }

      if (e.newValue === null) {
        setStoredValue(initialValue);
        return;
      }

      try {
        setStoredValue(JSON.parse(e.newValue));
      } catch (error) {
        logger.error(`Error parsing localStorage value for key "${key}":`, error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [initialValue, key]);

  return [storedValue, setValue, removeValue];
}
