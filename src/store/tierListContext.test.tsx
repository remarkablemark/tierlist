/**
 * Unit tests for the tier list context provider.
 * @packageDocumentation
 */

import { act, renderHook } from '@testing-library/react';

import {
  DEFAULT_SETTINGS,
  DEFAULT_TIERS,
  type TierList,
} from '../types/tierList.types';
import { generateId } from '../utils/generateId';
import { TierListProvider, useTierListContext } from './tierListContext';

/**
 * Creates a mock tier list for testing.
 */
function createMockTierList(): TierList {
  const now = Date.now();
  return {
    id: generateId(),
    name: 'Test Tier List',
    createdAt: now,
    updatedAt: now,
    tiers: DEFAULT_TIERS.map((t) => ({ ...t, id: generateId() })),
    unassignedItems: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}

/**
 * Wraps the hook with the provider.
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return <TierListProvider>{children}</TierListProvider>;
}

describe('TierListContext', () => {
  describe('useTierListContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // noop
      });

      expect(() => renderHook(() => useTierListContext())).toThrow(
        'useTierListContext must be used within TierListProvider',
      );

      consoleSpy.mockRestore();
    });

    it('should provide initial state with default tier list', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });

      expect(result.current.state.present.tiers).toHaveLength(
        DEFAULT_TIERS.length,
      );
      expect(result.current.state.present.unassignedItems).toHaveLength(0);
    });

    it('should provide dispatch function', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });

      expect(result.current.dispatch).toBeDefined();
      expect(typeof result.current.dispatch).toBe('function');
    });
  });

  describe('TierListProvider', () => {
    it('should initialize with default tier list', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });

      const tierList = result.current.state.present;
      expect(tierList.name).toBe('Untitled Tier List');
      expect(tierList.tiers).toHaveLength(DEFAULT_TIERS.length);
      expect(tierList.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should allow dispatching actions', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'TIER_ADD',
          payload: { label: 'New Tier', color: '#ff0000' },
        });
      });

      expect(result.current.state.present.tiers).toHaveLength(
        DEFAULT_TIERS.length + 1,
      );
    });

    it('should support undo/redo', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });
      const initialTierCount = result.current.state.present.tiers.length;

      // Add a tier
      act(() => {
        result.current.dispatch({
          type: 'TIER_ADD',
          payload: {},
        });
      });

      expect(result.current.state.present.tiers).toHaveLength(
        initialTierCount + 1,
      );
      expect(result.current.state.past).toHaveLength(1);

      // Undo
      act(() => {
        result.current.dispatch({ type: 'UNDO' });
      });

      expect(result.current.state.present.tiers).toHaveLength(initialTierCount);
      expect(result.current.state.future).toHaveLength(1);

      // Redo
      act(() => {
        result.current.dispatch({ type: 'REDO' });
      });

      expect(result.current.state.present.tiers).toHaveLength(
        initialTierCount + 1,
      );
    });

    it('should update tier list on item operations', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });
      const tierId = result.current.state.present.tiers[0].id;

      // Add item to tier
      act(() => {
        result.current.dispatch({
          type: 'ITEM_ADD',
          payload: {
            item: {
              id: generateId(),
              label: 'Test Item',
              imageUrl: null,
              imageBlobId: null,
              createdAt: Date.now(),
              metadata: {},
            },
            targetTierId: tierId,
          },
        });
      });

      expect(result.current.state.present.tiers[0].items).toHaveLength(1);

      // Delete item
      const itemId = result.current.state.present.tiers[0].items[0].id;
      act(() => {
        result.current.dispatch({
          type: 'ITEM_DELETE',
          payload: { itemId },
        });
      });

      expect(result.current.state.present.tiers[0].items).toHaveLength(0);
    });

    it('should update settings', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'SETTINGS_UPDATE',
          payload: { theme: 'dark', itemSize: 'large' },
        });
      });

      expect(result.current.state.present.settings.theme).toBe('dark');
      expect(result.current.state.present.settings.itemSize).toBe('large');
    });

    it('should handle load action', () => {
      const { result } = renderHook(() => useTierListContext(), { wrapper });
      const newTierList = createMockTierList();
      newTierList.name = 'Loaded Tier List';

      act(() => {
        result.current.dispatch({
          type: 'LOAD',
          payload: newTierList,
        });
      });

      expect(result.current.state.present.name).toBe('Loaded Tier List');
      expect(result.current.state.past).toHaveLength(0);
      expect(result.current.state.future).toHaveLength(0);
    });
  });
});

describe('TierListProvider with custom initial state', () => {
  it('should accept custom initial tier list', () => {
    const customTierList = createMockTierList();
    customTierList.name = 'Custom Tier List';

    function CustomWrapper({ children }: { children: React.ReactNode }) {
      return (
        <TierListProvider initialTierList={customTierList}>
          {children}
        </TierListProvider>
      );
    }

    const { result } = renderHook(() => useTierListContext(), {
      wrapper: CustomWrapper,
    });

    expect(result.current.state.present.name).toBe('Custom Tier List');
  });
});
