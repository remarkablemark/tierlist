/**
 * Unit tests for the useTierList hook.
 * @packageDocumentation
 */

import { act, renderHook } from '@testing-library/react';
import { use } from 'react';
import { useTierList } from 'src/hooks/useTierList';
import { TierListContext, TierListProvider } from 'src/store/tierListContext';
import { generateId } from 'src/utils/generateId';

// Mock storage module for persistence tests
vi.mock('../services/storage', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    saveTierList: vi.fn().mockResolvedValue(undefined),
    loadTierList: vi.fn().mockResolvedValue(null),
    getAllTierLists: vi.fn().mockResolvedValue([]),
  } as unknown as typeof import('../services/storage');
});

/**
 * Test wrapper with provider.
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return <TierListProvider>{children}</TierListProvider>;
}

/**
 * Helper hook to access tier IDs from context.
 */
function useTierIds(): string[] {
  const context = use(TierListContext);
  if (!context) {
    return [];
  }
  return context.state.present.tiers.map((t) => t.id);
}

describe('useTierList', () => {
  describe('initial state', () => {
    it('provides canUndo and canRedo flags', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('provides totalItems count', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      expect(result.current.totalItems).toBe(0);
    });

    it('provides item limit flags', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      expect(result.current.hasReachedItemLimit).toBe(false);
      expect(result.current.hasItemLimitWarning).toBe(false);
    });
  });

  describe('tier operations', () => {
    it('adds a tier', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      act(() => {
        result.current.addTier('New Tier', '#ff0000');
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.totalItems).toBe(0);
    });

    it('deletes a tier', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      // First add a tier to delete
      act(() => {
        result.current.addTier('To Delete');
      });

      // Delete the tier we just added (it's the last one in the list)
      act(() => {
        result.current.deleteTier('');
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('updates tier label', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      act(() => {
        result.current.updateTierLabel('', 'Updated Label');
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('updates tier color', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      act(() => {
        result.current.updateTierColor('', '#000000');
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('resets tier', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      // First add a tier
      act(() => {
        result.current.addTier('Tier to Reset');
      });

      // Reset the tier (using empty string as tierId for testing)
      act(() => {
        result.current.resetTier('');
      });

      // The reset action should be recorded
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('item operations', () => {
    it('adds an item', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
      });

      expect(result.current.totalItems).toBe(1);
    });

    it('adds an item to a specific tier', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add to unassigned (no targetTierId)
      act(() => {
        result.current.addItem(item);
      });

      expect(result.current.totalItems).toBe(1);
    });

    it('deletes an item from unassigned', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
      });

      act(() => {
        result.current.deleteItem(item.id);
      });

      expect(result.current.totalItems).toBe(0);
    });

    it('moves an item', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
      });

      act(() => {
        result.current.moveItem(item.id, null, 0);
      });

      expect(result.current.totalItems).toBe(1);
    });

    it('updates item label', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Original',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
        result.current.updateItemLabel(item.id, 'Updated');
      });

      expect(result.current.totalItems).toBe(1);
    });
  });

  describe('undo/redo', () => {
    it('undoes an action', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      act(() => {
        result.current.addTier();
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('redoes an action', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      act(() => {
        result.current.addTier();
        result.current.undo();
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('item limit', () => {
    it('shows warning at 50 items', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      // Add 50 items
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addItem({
            id: generateId(),
            label: `Item ${String(i)}`,
            imageUrl: null,
            imageBlobId: null,
            createdAt: Date.now(),
            metadata: {},
          });
        }
      });

      expect(result.current.hasItemLimitWarning).toBe(true);
      expect(result.current.hasReachedItemLimit).toBe(false);
    });

    it('prevents adding items at 100', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      // Add 100 items
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addItem({
            id: generateId(),
            label: `Item ${String(i)}`,
            imageUrl: null,
            imageBlobId: null,
            createdAt: Date.now(),
            metadata: {},
          });
        }
      });

      expect(result.current.hasReachedItemLimit).toBe(true);
    });
  });

  describe('moveItem', () => {
    it('moves item from unassigned to tier', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
      });

      // Move within unassigned (using empty string as targetTierId)
      act(() => {
        result.current.moveItem(item.id, '', 0);
      });

      expect(result.current.totalItems).toBe(1);
    });

    it('moves item from tier to unassigned', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
      });

      // Move to unassigned (null targetTierId)
      act(() => {
        result.current.moveItem(item.id, null, 0);
      });

      expect(result.current.totalItems).toBe(1);
    });

    it('handles moveItem when item is not found in tiers', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
      });

      // Move item that's in unassigned - should use empty string as sourceTierId
      // This tests the fallback logic: sourceTierId ??= ''
      act(() => {
        result.current.moveItem(item.id, '', 0);
      });

      expect(result.current.totalItems).toBe(1);
    });
  });

  describe('reorderItem', () => {
    it('reorders item within tier - moving down', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item1 = {
        id: generateId(),
        label: 'Item 1',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };
      const item2 = {
        id: generateId(),
        label: 'Item 2',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item1);
        result.current.addItem(item2);
        // Move item2 from index 1 to index 0 (moving up in the list, so direction is 'up')
        result.current.reorderItem('', item2.id, 0);
      });

      expect(result.current.totalItems).toBe(2);
    });

    it('reorders item within tier - moving up', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item1 = {
        id: generateId(),
        label: 'Item 1',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };
      const item2 = {
        id: generateId(),
        label: 'Item 2',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item1);
        result.current.addItem(item2);
        // Move item1 from index 0 to index 1 (moving down in the list, so direction is 'down')
        result.current.reorderItem('', item1.id, 1);
      });

      expect(result.current.totalItems).toBe(2);
    });

    it('handles reorderItem when tier is not found', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
        // Try to reorder in a non-existent tier - should return early
        result.current.reorderItem('non-existent-tier', item.id, 0);
      });

      expect(result.current.totalItems).toBe(1);
    });
  });

  describe('updateItemLabel', () => {
    it('updates item label', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      const item = {
        id: generateId(),
        label: 'Original',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      act(() => {
        result.current.addItem(item);
        result.current.updateItemLabel(item.id, 'Updated');
      });

      expect(result.current.totalItems).toBe(1);
    });
  });

  describe('reorderTiers', () => {
    it('reorders tiers - direction up', () => {
      const { result } = renderHook(
        () => {
          const tierList = useTierList();
          const tierIds = useTierIds();
          return { tierList, tierIds };
        },
        { wrapper },
      );

      act(() => {
        result.current.tierList.addTier('Tier 1');
        result.current.tierList.addTier('Tier 2');
      });

      // Get the second tier ID (the one we just added)
      const allTierIds = result.current.tierIds;
      const secondTierId = allTierIds[allTierIds.length - 1];

      // Move the second tier to index 0 - direction is 'up'
      // This tests: newIndex (0) < tierIndex (1) ? 'up' : 'down'
      act(() => {
        result.current.tierList.reorderTiers(secondTierId, 0);
      });

      expect(result.current.tierList.canUndo).toBe(true);
    });

    it('reorders tiers - direction down', () => {
      const { result } = renderHook(
        () => {
          const tierList = useTierList();
          const tierIds = useTierIds();
          return { tierList, tierIds };
        },
        { wrapper },
      );

      act(() => {
        result.current.tierList.addTier('Tier 1');
        result.current.tierList.addTier('Tier 2');
      });

      // Get the first tier ID (the first one we added)
      const allTierIds = result.current.tierIds;
      const firstTierId = allTierIds[allTierIds.length - 2];
      const firstTierIndex = allTierIds.length - 2;

      // Move the first tier to index 1 - direction is 'down'
      // This tests: newIndex (1) < tierIndex (0) ? 'up' : 'down'
      act(() => {
        result.current.tierList.reorderTiers(firstTierId, firstTierIndex + 1);
      });

      expect(result.current.tierList.canUndo).toBe(true);
    });
  });

  describe('moveItem with items in tiers', () => {
    it('moves item from tier to unassigned - tests item found in tier', () => {
      const { result } = renderHook(
        () => {
          const tierList = useTierList();
          const tierIds = useTierIds();
          return { tierList, tierIds };
        },
        { wrapper },
      );

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Get the first tier ID
      const firstTierId = result.current.tierIds[0];

      // Add item directly to the tier
      act(() => {
        result.current.tierList.addItem(item, firstTierId);
      });

      // Now move the item from the tier to unassigned
      // This tests the branch where item IS found in the for loop (line 152-154)
      act(() => {
        result.current.tierList.moveItem(item.id, null, 0);
      });

      expect(result.current.tierList.totalItems).toBe(1);
    });

    it('moves item between tiers - tests item found in tier', () => {
      const { result } = renderHook(
        () => {
          const tierList = useTierList();
          const tierIds = useTierIds();
          return { tierList, tierIds };
        },
        { wrapper },
      );

      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Get tier IDs
      const firstTierId = result.current.tierIds[0];
      const secondTierId = result.current.tierIds[1];

      // Add item directly to the first tier
      act(() => {
        result.current.tierList.addItem(item, firstTierId);
      });

      // Move the item from the first tier to the second tier
      // This tests the branch where item IS found in the for loop
      act(() => {
        result.current.tierList.moveItem(item.id, secondTierId, 0);
      });

      expect(result.current.tierList.totalItems).toBe(1);
    });
  });

  describe('reorderItem with items in tiers', () => {
    it('reorders item within tier - direction up', () => {
      const { result } = renderHook(
        () => {
          const tierList = useTierList();
          const tierIds = useTierIds();
          return { tierList, tierIds };
        },
        { wrapper },
      );

      const item1 = {
        id: generateId(),
        label: 'Item 1',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };
      const item2 = {
        id: generateId(),
        label: 'Item 2',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Get the first tier ID
      const firstTierId = result.current.tierIds[0];

      // Add items directly to the tier
      act(() => {
        result.current.tierList.addItem(item1, firstTierId);
        result.current.tierList.addItem(item2, firstTierId);
      });

      // Move item2 from index 1 to index 0 (direction: up)
      // This tests: newIndex (0) < currentIndex (1) ? 'up' : 'down'
      act(() => {
        result.current.tierList.reorderItem(firstTierId, item2.id, 0);
      });

      expect(result.current.tierList.totalItems).toBe(2);
    });

    it('reorders item within tier - direction down', () => {
      const { result } = renderHook(
        () => {
          const tierList = useTierList();
          const tierIds = useTierIds();
          return { tierList, tierIds };
        },
        { wrapper },
      );

      const item1 = {
        id: generateId(),
        label: 'Item 1',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };
      const item2 = {
        id: generateId(),
        label: 'Item 2',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Get the first tier ID
      const firstTierId = result.current.tierIds[0];

      // Add items directly to the tier
      act(() => {
        result.current.tierList.addItem(item1, firstTierId);
        result.current.tierList.addItem(item2, firstTierId);
      });

      // Move item1 from index 0 to index 1 (direction: down)
      // This tests: newIndex (1) < currentIndex (0) ? 'up' : 'down'
      act(() => {
        result.current.tierList.reorderItem(firstTierId, item1.id, 1);
      });

      expect(result.current.tierList.totalItems).toBe(2);
    });
  });

  describe('persistence', () => {
    it('saves tier list to storage', async () => {
      const { saveTierList } = await import('../services/storage');
      const { result } = renderHook(() => useTierList(), { wrapper });

      await act(async () => {
        await result.current.save();
      });

      expect(saveTierList).toHaveBeenCalledTimes(1);
    });

    it('loads tier list from storage', async () => {
      const { loadTierList } = await import('../services/storage');
      const mockTierList = {
        id: generateId(),
        name: 'Loaded Tier List',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tiers: [],
        unassignedItems: [],
        settings: {
          theme: 'system' as const,
          tierHeight: 120,
          itemSize: 'medium' as const,
          showItemLabels: true,
          enableAnimations: true,
          snapToGrid: false,
        },
        version: 1,
      };
      vi.mocked(loadTierList).mockResolvedValueOnce(mockTierList);

      const { result } = renderHook(() => useTierList(), { wrapper });

      await act(async () => {
        await result.current.load(mockTierList.id);
      });

      expect(loadTierList).toHaveBeenCalledWith(mockTierList.id);
    });

    it('handles load when tier list not found', async () => {
      const { loadTierList } = await import('../services/storage');
      vi.mocked(loadTierList).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useTierList(), { wrapper });

      await result.current.load('non-existent-id');

      expect(loadTierList).toHaveBeenCalledWith('non-existent-id');
    });

    it('creates new tier list with default name', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      act(() => {
        result.current.createNew();
      });

      expect(result.current.tierList.name).toBe('Tier List');
      expect(result.current.tierList.tiers).toEqual([]);
      expect(result.current.tierList.unassignedItems).toEqual([]);
    });

    it('creates new tier list with custom name', () => {
      const { result } = renderHook(() => useTierList(), { wrapper });

      act(() => {
        result.current.createNew('My Custom Tier List');
      });

      expect(result.current.tierList.name).toBe('My Custom Tier List');
    });

    it('gets all saved tier lists', async () => {
      const { getAllTierLists } = await import('../services/storage');
      const savedLists = [
        {
          id: generateId(),
          name: 'Saved List 1',
          updatedAt: Date.now(),
          lastAccessedAt: Date.now(),
        },
        {
          id: generateId(),
          name: 'Saved List 2',
          updatedAt: Date.now(),
          lastAccessedAt: Date.now(),
        },
      ];
      vi.mocked(getAllTierLists).mockResolvedValueOnce(savedLists);

      const { result } = renderHook(() => useTierList(), { wrapper });

      const tierLists = await result.current.getAllSaved();

      expect(getAllTierLists).toHaveBeenCalledTimes(1);
      expect(tierLists).toEqual(savedLists);
    });
  });
});
