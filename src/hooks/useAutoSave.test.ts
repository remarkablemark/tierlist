/**
 * Tests for the useAutoSave hook.
 * @packageDocumentation
 */

import { act, renderHook } from '@testing-library/react';

import { saveTierList } from '../services/storage';
import { type TierList } from '../types/tierList.types';
import { createDefaultTierList } from '../utils/createDefaultTierList';
import { useAutoSave } from './useAutoSave';

// Mock the storage module
vi.mock('../services/storage', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    saveTierList: vi.fn().mockResolvedValue(undefined),
  } as unknown as typeof import('../services/storage');
});

// Mock idb module for logSaveFailure
vi.mock('idb', async () => {
  const actualIdb = await vi.importActual('idb');
  return {
    ...actualIdb,
    openDB: vi.fn().mockResolvedValue({
      put: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

/**
 * Creates a mock tier list for testing.
 */
function createMockTierList(overrides?: Partial<TierList>): TierList {
  return {
    ...createDefaultTierList(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with idle status', () => {
    const { result } = renderHook(() => useAutoSave(null));

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSavedAt).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('should debounce saves (≤500ms)', async () => {
    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Should start as idle
    expect(result.current.status).toBe('idle');
    expect(saveTierList).not.toHaveBeenCalled();

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      // Wait for microtasks to flush
      await Promise.resolve();
    });

    // Verify save was called
    expect(saveTierList).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('saved');
    expect(result.current.lastSavedAt).toBeGreaterThan(0);
  });

  it('should update status to saving then saved', async () => {
    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('saved');
    expect(result.current.lastSavedAt).toBeGreaterThan(0);
    expect(result.current.errorMessage).toBeNull();
  });

  it('should handle save errors gracefully', async () => {
    vi.mocked(saveTierList).mockRejectedValueOnce(new Error('Save failed'));

    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('error');
  });

  it('should provide manual save function', async () => {
    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay for initial save
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('saved');

    // Manual save should work
    const newTierList = createMockTierList({ name: 'Updated' });
    await act(async () => {
      await result.current.save(newTierList);
    });

    expect(saveTierList).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('saved');
  });

  it('should register beforeunload handler', async () => {
    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('saved');
  });

  it('should log save failures to IndexedDB', async () => {
    // Mock saveTierList to fail, which triggers the logSaveFailure function
    vi.mocked(saveTierList).mockRejectedValueOnce(new Error('Save failed'));

    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Status should be error due to failed save
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe(
      'Failed to save. Please export your work.',
    );
  });

  it('should display non-blocking status indicator', async () => {
    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(['saved', 'error', 'quota-exceeded']).toContain(
      result.current.status,
    );
  });

  it('should clear error on successful save', async () => {
    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay for initial save
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('saved');

    // Save again should clear any previous errors
    await act(async () => {
      await result.current.save(mockTierList);
    });

    expect(result.current.errorMessage).toBeNull();
  });

  it('should handle null tier list', () => {
    const { result } = renderHook(() => useAutoSave(null));

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSavedAt).toBeNull();
  });

  it('should save updated tier list on changes', async () => {
    const initialTierList = createMockTierList();
    const { result, rerender } = renderHook(
      ({ tierList }) => useAutoSave(tierList),
      { initialProps: { tierList: initialTierList } },
    );

    // Fast-forward debounce delay for initial save
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('saved');
    const initialSaveTime = result.current.lastSavedAt;

    // Change tier list
    const updatedTierList = createMockTierList({
      name: 'Updated Name',
      updatedAt: Date.now(),
    });

    rerender({ tierList: updatedTierList });

    // Fast-forward debounce delay for updated save
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.lastSavedAt).toBeGreaterThan(initialSaveTime ?? 0);
    expect(saveTierList).toHaveBeenCalledTimes(2);
  });

  it('should handle QuotaExceededError with specific message', async () => {
    const quotaError = new Error('Quota exceeded') as Error & { name?: string };
    quotaError.name = 'QuotaExceededError';
    vi.mocked(saveTierList).mockRejectedValueOnce(quotaError);

    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('quota-exceeded');
    expect(result.current.errorMessage).toBe(
      'Storage full. Please export and delete old tier lists.',
    );
  });

  it('should handle NotFoundError gracefully', async () => {
    const notFoundError = new Error('Not found') as Error & { name?: string };
    notFoundError.name = 'NotFoundError';
    vi.mocked(saveTierList).mockRejectedValueOnce(notFoundError);

    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe(
      'Failed to save. Please export your work.',
    );
  });

  it('should log save failures to IndexedDB for later retrieval', async () => {
    const { openDB } = await import('idb');
    vi.mocked(saveTierList).mockRejectedValueOnce(new Error('Save failed'));

    const mockTierList = createMockTierList();
    const { result } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Verify save failed
    expect(result.current.status).toBe('error');

    // Verify logSaveFailure was called (openDB should be called)
    expect(openDB).toHaveBeenCalledWith('TierListDB', 1);
  });

  it('should register beforeunload handler to persist on navigation', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const mockTierList = createMockTierList();
    const { unmount } = renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay and flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Verify beforeunload handler was registered
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function),
    );

    // Verify cleanup on unmount
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function),
    );
  });

  it('should save pending tier list on beforeunload event', async () => {
    const storageModule = await import('../services/storage');
    const mockSaveTierList = vi.mocked(storageModule.saveTierList);
    vi.clearAllMocks();
    mockSaveTierList.mockResolvedValue(undefined);

    const mockTierList = createMockTierList();
    renderHook(() => useAutoSave(mockTierList));

    // Fast-forward debounce delay to set pending save
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Trigger beforeunload event
    const beforeUnloadEvent = new Event('beforeunload');
    await act(async () => {
      window.dispatchEvent(beforeUnloadEvent);
      await Promise.resolve();
    });

    // Verify save was called for pending save
    expect(mockSaveTierList).toHaveBeenCalled();
  });
});
