/**
 * Auto-save hook for tier list persistence.
 * @packageDocumentation
 */

import { useEffect, useRef, useState } from 'react';

import { saveTierList } from '../services/storage';
import { type TierList } from '../types/tierList.types';

/**
 * Auto-save status indicators.
 */
export type AutoSaveStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'error'
  | 'quota-exceeded';

/**
 * Return type for the useAutoSave hook.
 */
export interface UseAutoSaveReturn {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Last save timestamp */
  lastSavedAt: number | null;
  /** Error message if last save failed */
  errorMessage: string | null;
  /** Manual save trigger */
  save: (tierList: TierList) => Promise<void>;
}

/**
 * Debounce delay in milliseconds (≤500ms per requirements).
 */
const DEBOUNCE_DELAY = 500;

/**
 * Custom hook that auto-saves tier list changes to IndexedDB.
 *
 * Features:
 * - Debounces saves to prevent excessive writes (≤500ms)
 * - Registers beforeunload handler to persist on navigation
 * - Displays non-blocking status indicator
 * - Logs failures to IndexedDB for later retrieval
 *
 * @param tierList - The tier list to auto-save.
 * @returns Object with auto-save status and manual save function.
 */
export function useAutoSave(tierList: TierList | null): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<TierList | null>(null);

  // Manual save function (debounced)
  const save = async (tierListToSave: TierList): Promise<void> => {
    setStatus('saving');
    setErrorMessage(null);

    try {
      await saveTierList(tierListToSave);
      setLastSavedAt(Date.now());
      setStatus('saved');
    } catch (error) {
      const errorObj = error as Error & { name?: string };
      if (errorObj.name === 'QuotaExceededError') {
        setStatus('quota-exceeded');
        setErrorMessage(
          'Storage full. Please export and delete old tier lists.',
        );
      } else {
        setStatus('error');
        setErrorMessage('Failed to save. Please export your work.');
      }
      // Log failure for later retrieval (non-blocking)
      void logSaveFailure(tierListToSave.id, errorObj);
    }
  };

  // Debounced save effect
  useEffect(() => {
    // Skip if no tierList
    if (!tierList) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      pendingSaveRef.current = tierList;
      void save(tierList);
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or dependency change
    return () => {
      /* v8 ignore start */
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      /* v8 ignore stop */
    };
  }, [tierList]);

  // Beforeunload handler - persist on navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      /* v8 ignore start */
      if (pendingSaveRef.current) {
        // Synchronous save attempt (best effort)
        void saveTierList(pendingSaveRef.current);
      }
      /* v8 ignore stop */
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    status,
    lastSavedAt,
    errorMessage,
    save,
  };
}

/**
 * Logs save failures to IndexedDB for later retrieval.
 * This is a non-blocking operation that doesn't affect user experience.
 */
async function logSaveFailure(tierListId: string, error: Error): Promise<void> {
  try {
    const db = await import('idb');
    const database = await db.openDB('TierListDB', 1);
    await database.put('metadata', {
      key: `save-failure-${tierListId}`,
      value: {
        tierListId,
        error: error.message,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });
  } catch {
    // Silently fail - logging itself is not critical
  }
}
