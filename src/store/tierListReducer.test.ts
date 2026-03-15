/**
 * Unit tests for the tier list reducer.
 * @packageDocumentation
 */

import { DEFAULT_SETTINGS, DEFAULT_TIERS } from '../constants/tierList';
import {
  type TierList,
  type TierListAction,
  type TierListState,
} from '../types/tierList';
import { generateId } from '../utils/generateId';
import { tierListReducer } from './tierListReducer';

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
 * Creates a mock undo/redo state for testing.
 */
function createMockState(): TierListState {
  return {
    past: [],
    present: createMockTierList(),
    future: [],
  };
}

describe('tierListReducer', () => {
  describe('TIER_ADD', () => {
    it('adds a new tier with default label and color', () => {
      const state = createMockState();
      const initialTierCount = state.present.tiers.length;

      const newState = tierListReducer(state, {
        type: 'TIER_ADD',
        payload: {},
      });

      expect(newState.present.tiers).toHaveLength(initialTierCount + 1);
      expect(newState.present.tiers[initialTierCount]).toEqual({
        id: expect.any(String) as string,
        label: 'New Tier',
        color: '#ffffff',
        items: [],
        isCustomColor: false,
        isCustomLabel: false,
      });
    });

    it('adds a new tier with custom label and color', () => {
      const state = createMockState();
      const initialTierCount = state.present.tiers.length;

      const newState = tierListReducer(state, {
        type: 'TIER_ADD',
        payload: { label: 'Custom', color: '#ff0000' },
      });

      expect(newState.present.tiers).toHaveLength(initialTierCount + 1);
      expect(newState.present.tiers[initialTierCount]).toEqual({
        id: expect.any(String) as string,
        label: 'Custom',
        color: '#ff0000',
        items: [],
        isCustomColor: true,
        isCustomLabel: true,
      });
    });

    it('adds to past for undo support', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'TIER_ADD',
        payload: {},
      });

      expect(newState.past).toHaveLength(1);
      expect(newState.future).toHaveLength(0);
    });
  });

  describe('TIER_DELETE', () => {
    it('deletes a tier and move items to unassigned', () => {
      const state = createMockState();
      const tierToDelete = state.present.tiers[0];

      // Add an item to the tier first
      const stateWithItem = tierListReducer(state, {
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
          targetTierId: tierToDelete.id,
        },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'TIER_DELETE',
        payload: { tierId: tierToDelete.id },
      });

      expect(newState.present.tiers).toHaveLength(
        state.present.tiers.length - 1,
      );
      expect(newState.present.unassignedItems).toHaveLength(1);
    });

    it('adds to past for undo support', () => {
      const state = createMockState();
      const tierToDelete = state.present.tiers[0];

      const newState = tierListReducer(state, {
        type: 'TIER_DELETE',
        payload: { tierId: tierToDelete.id },
      });

      expect(newState.past).toHaveLength(1);
      expect(newState.future).toHaveLength(0);
    });

    it('does not delete when tier is not found', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'TIER_DELETE',
        payload: { tierId: 'non-existent-id' },
      });

      expect(newState).toBe(state);
    });
  });

  describe('TIER_REORDER', () => {
    it('reorders a tier up', () => {
      const state = createMockState();
      const tierToMove = state.present.tiers[2];

      const newState = tierListReducer(state, {
        type: 'TIER_REORDER',
        payload: { tierId: tierToMove.id, direction: 'up' },
      });

      expect(newState.present.tiers[1].id).toBe(tierToMove.id);
    });

    it('does not reorder the first tier up', () => {
      const state = createMockState();
      const firstTier = state.present.tiers[0];

      const newState = tierListReducer(state, {
        type: 'TIER_REORDER',
        payload: { tierId: firstTier.id, direction: 'up' },
      });

      expect(newState.present.tiers[0].id).toBe(firstTier.id);
    });

    it('reorders a tier down', () => {
      const state = createMockState();
      const tierToMove = state.present.tiers[0];

      const newState = tierListReducer(state, {
        type: 'TIER_REORDER',
        payload: { tierId: tierToMove.id, direction: 'down' },
      });

      expect(newState.present.tiers[1].id).toBe(tierToMove.id);
    });

    it('does not reorder the last tier down', () => {
      const state = createMockState();
      const lastTier = state.present.tiers[state.present.tiers.length - 1];

      const newState = tierListReducer(state, {
        type: 'TIER_REORDER',
        payload: { tierId: lastTier.id, direction: 'down' },
      });

      expect(newState.present.tiers[state.present.tiers.length - 1].id).toBe(
        lastTier.id,
      );
    });

    it('returns state unchanged when tier ID not found', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'TIER_REORDER',
        payload: { tierId: 'non-existent-id', direction: 'up' },
      });

      expect(newState).toBe(state);
    });
  });

  describe('TIER_UPDATE_LABEL', () => {
    it('updates a tier label and set isCustomLabel to true', () => {
      const state = createMockState();
      const tierToUpdate = state.present.tiers[0];

      const newState = tierListReducer(state, {
        type: 'TIER_UPDATE_LABEL',
        payload: { tierId: tierToUpdate.id, label: 'Updated' },
      });

      expect(newState.present.tiers[0].label).toBe('Updated');
      expect(newState.present.tiers[0].isCustomLabel).toBe(true);
    });
  });

  describe('TIER_UPDATE_COLOR', () => {
    it('updates a tier color and set isCustomColor to true', () => {
      const state = createMockState();
      const tierToUpdate = state.present.tiers[0];

      const newState = tierListReducer(state, {
        type: 'TIER_UPDATE_COLOR',
        payload: { tierId: tierToUpdate.id, color: '#00ff00' },
      });

      expect(newState.present.tiers[0].color).toBe('#00ff00');
      expect(newState.present.tiers[0].isCustomColor).toBe(true);
    });
  });

  describe('TIER_RESET', () => {
    it('resets a tier to default label and color', () => {
      const state = createMockState();
      const tierToReset = state.present.tiers[0];

      // First customize it
      const customizedState = tierListReducer(state, {
        type: 'TIER_UPDATE_LABEL',
        payload: { tierId: tierToReset.id, label: 'Custom' },
      });

      const newState = tierListReducer(customizedState, {
        type: 'TIER_RESET',
        payload: { tierId: tierToReset.id },
      });

      expect(newState.present.tiers[0].label).toBe(DEFAULT_TIERS[0].label);
      expect(newState.present.tiers[0].color).toBe(DEFAULT_TIERS[0].color);
      expect(newState.present.tiers[0].isCustomLabel).toBe(false);
      expect(newState.present.tiers[0].isCustomColor).toBe(false);
    });

    it('does not reset when tier is not found', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'TIER_RESET',
        payload: { tierId: 'non-existent-id' },
      });

      expect(newState).toBe(state);
    });
  });

  describe('drag lifecycle actions', () => {
    it.each<TierListAction['type']>(['DRAG_START', 'DRAG_MOVE', 'DRAG_END'])(
      'returns state unchanged for %s',
      (actionType) => {
        const state = createMockState();

        const newState = tierListReducer(state, {
          type: actionType,
          payload: {},
        } as TierListAction);

        expect(newState).toBe(state);
      },
    );
  });

  describe('ITEM_ADD', () => {
    it('adds an item to unassigned when no target tier', () => {
      const state = createMockState();
      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      const newState = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item },
      });

      expect(newState.present.unassignedItems).toHaveLength(1);
      expect(newState.present.unassignedItems[0]).toEqual(item);
    });

    it('adds an item to a specific tier', () => {
      const state = createMockState();
      const targetTier = state.present.tiers[0];
      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      const newState = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item, targetTierId: targetTier.id },
      });

      expect(newState.present.tiers[0].items).toHaveLength(1);
      expect(newState.present.unassignedItems).toHaveLength(0);
    });
  });

  describe('ITEM_DELETE', () => {
    it('deletes an item from unassigned', () => {
      const state = createMockState();
      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add item to unassigned
      const stateWithItem = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'ITEM_DELETE',
        payload: { itemId: item.id },
      });

      expect(newState.present.unassignedItems).toHaveLength(0);
    });

    it('deletes an item from a tier', () => {
      const state = createMockState();
      const targetTier = state.present.tiers[0];
      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add item to tier
      const stateWithItem = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item, targetTierId: targetTier.id },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'ITEM_DELETE',
        payload: { itemId: item.id },
      });

      expect(newState.present.tiers[0].items).toHaveLength(0);
    });

    it('does not delete when item is not found', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'ITEM_DELETE',
        payload: { itemId: 'non-existent-id' },
      });

      expect(newState).toBe(state);
    });
  });

  describe('ITEM_MOVE', () => {
    it('moves an item from one tier to another', () => {
      const state = createMockState();
      const sourceTier = state.present.tiers[0];
      const targetTier = state.present.tiers[1];
      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add item to source tier
      const stateWithItem = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item, targetTierId: sourceTier.id },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'ITEM_MOVE',
        payload: {
          itemId: item.id,
          sourceTierId: sourceTier.id,
          targetTierId: targetTier.id,
          targetIndex: 0,
        },
      });

      expect(newState.present.tiers[0].items).toHaveLength(0);
      expect(newState.present.tiers[1].items).toHaveLength(1);
    });

    it('moves an item from tier to unassigned', () => {
      const state = createMockState();
      const sourceTier = state.present.tiers[0];
      const item = {
        id: generateId(),
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add item to tier
      const stateWithItem = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item, targetTierId: sourceTier.id },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'ITEM_MOVE',
        payload: {
          itemId: item.id,
          sourceTierId: sourceTier.id,
          targetTierId: null,
          targetIndex: 0,
        },
      });

      expect(newState.present.tiers[0].items).toHaveLength(0);
      expect(newState.present.unassignedItems).toHaveLength(1);
    });

    it('does not move when item is not found', () => {
      const state = createMockState();
      const sourceTier = state.present.tiers[0];
      const targetTier = state.present.tiers[1];

      const newState = tierListReducer(state, {
        type: 'ITEM_MOVE',
        payload: {
          itemId: 'non-existent-id',
          sourceTierId: sourceTier.id,
          targetTierId: targetTier.id,
          targetIndex: 0,
        },
      });

      expect(newState).toBe(state);
    });
  });

  describe('ITEM_REORDER', () => {
    it('reorders an item up within a tier', () => {
      const state = createMockState();
      const tier = state.present.tiers[0];
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

      // Add two items to tier
      const stateWithItems = tierListReducer(
        tierListReducer(state, {
          type: 'ITEM_ADD',
          payload: { item: item1, targetTierId: tier.id },
        }),
        {
          type: 'ITEM_ADD',
          payload: { item: item2, targetTierId: tier.id },
        },
      );

      const newState = tierListReducer(stateWithItems, {
        type: 'ITEM_REORDER',
        payload: { tierId: tier.id, itemId: item2.id, direction: 'up' },
      });

      expect(newState.present.tiers[0].items[0].id).toBe(item2.id);
      expect(newState.present.tiers[0].items[1].id).toBe(item1.id);
    });

    it('does not reorder the first item up', () => {
      const state = createMockState();
      const tier = state.present.tiers[0];
      const item = {
        id: generateId(),
        label: 'Item 1',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add item to tier
      const stateWithItem = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item, targetTierId: tier.id },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'ITEM_REORDER',
        payload: { tierId: tier.id, itemId: item.id, direction: 'up' },
      });

      expect(newState.present.tiers[0].items[0].id).toBe(item.id);
    });

    it('does not reorder when tier is not found', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'ITEM_REORDER',
        payload: {
          tierId: 'non-existent-id',
          itemId: 'item-id',
          direction: 'up',
        },
      });

      expect(newState).toBe(state);
    });

    it('does not reorder when item is not found in tier', () => {
      const state = createMockState();
      const tier = state.present.tiers[0];

      const newState = tierListReducer(state, {
        type: 'ITEM_REORDER',
        payload: {
          tierId: tier.id,
          itemId: 'non-existent-id',
          direction: 'up',
        },
      });

      expect(newState).toBe(state);
    });
  });

  describe('ITEM_UPDATE_LABEL', () => {
    it('updates an item label in unassigned', () => {
      const state = createMockState();
      const item = {
        id: generateId(),
        label: 'Original',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add item to unassigned
      const stateWithItem = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'ITEM_UPDATE_LABEL',
        payload: { itemId: item.id, label: 'Updated' },
      });

      expect(newState.present.unassignedItems[0].label).toBe('Updated');
    });

    it('updates an item label in a tier', () => {
      const state = createMockState();
      const tierId = state.present.tiers[0].id;
      const item = {
        id: generateId(),
        label: 'Original',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      };

      // Add item to tier
      const stateWithItem = tierListReducer(state, {
        type: 'ITEM_ADD',
        payload: { item, targetTierId: tierId },
      });

      const newState = tierListReducer(stateWithItem, {
        type: 'ITEM_UPDATE_LABEL',
        payload: { itemId: item.id, label: 'Updated' },
      });

      expect(newState.present.tiers[0].items[0].label).toBe('Updated');
    });

    it('does not update when item is not found', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'ITEM_UPDATE_LABEL',
        payload: { itemId: 'non-existent-id', label: 'Updated' },
      });

      expect(newState).toBe(state);
    });
  });

  describe('UNDO', () => {
    it('restores previous state from past', () => {
      const state = createMockState();
      const initialTierCount = state.present.tiers.length;

      // Add a tier
      const stateWithAdd = tierListReducer(state, {
        type: 'TIER_ADD',
        payload: {},
      });

      // Undo
      const newState = tierListReducer(stateWithAdd, { type: 'UNDO' });

      expect(newState.present.tiers).toHaveLength(initialTierCount);
      expect(newState.past).toHaveLength(0);
      expect(newState.future).toHaveLength(1);
    });

    it('does nothing when past is empty', () => {
      const state = createMockState();

      const newState = tierListReducer(state, { type: 'UNDO' });

      expect(newState).toBe(state);
    });
  });

  describe('REDO', () => {
    it('restores future state', () => {
      const state = createMockState();
      const initialTierCount = state.present.tiers.length;

      // Add a tier
      const stateWithAdd = tierListReducer(state, {
        type: 'TIER_ADD',
        payload: {},
      });

      // Undo
      const stateAfterUndo = tierListReducer(stateWithAdd, { type: 'UNDO' });

      // Redo
      const newState = tierListReducer(stateAfterUndo, { type: 'REDO' });

      expect(newState.present.tiers).toHaveLength(initialTierCount + 1);
      expect(newState.past).toHaveLength(1);
      expect(newState.future).toHaveLength(0);
    });

    it('does nothing when future is empty', () => {
      const state = createMockState();

      const newState = tierListReducer(state, { type: 'REDO' });

      expect(newState).toBe(state);
    });
  });

  describe('SETTINGS_UPDATE', () => {
    it('updates settings', () => {
      const state = createMockState();

      const newState = tierListReducer(state, {
        type: 'SETTINGS_UPDATE',
        payload: { theme: 'dark', itemSize: 'large' },
      });

      expect(newState.present.settings.theme).toBe('dark');
      expect(newState.present.settings.itemSize).toBe('large');
    });
  });

  describe('50-action limit', () => {
    it('enforces 50-action limit with circular buffer', () => {
      let state = createMockState();

      // Perform 51 actions
      for (let i = 0; i < 51; i++) {
        state = tierListReducer(state, {
          type: 'TIER_ADD',
          payload: { label: `Tier ${String(i)}` },
        });
      }

      expect(state.past).toHaveLength(50);
    });

    it('clears future on new action', () => {
      const state = createMockState();

      // Add a tier
      const stateWithAdd = tierListReducer(state, {
        type: 'TIER_ADD',
        payload: {},
      });

      // Undo to create future
      const stateAfterUndo = tierListReducer(stateWithAdd, { type: 'UNDO' });
      expect(stateAfterUndo.future).toHaveLength(1);

      // New action should clear future
      const newState = tierListReducer(stateAfterUndo, {
        type: 'TIER_ADD',
        payload: {},
      });

      expect(newState.future).toHaveLength(0);
    });
  });

  describe('default case', () => {
    it('handles exhaustive check pattern', () => {
      const state = createMockState();
      const unknownAction = {
        type: 'UNKNOWN_ACTION',
      } as unknown as TierListAction;

      // The exhaustive check pattern returns the action itself (typed as never)
      // This code path ensures TypeScript catches unhandled action types at compile time
      const result = tierListReducer(state, unknownAction);

      expect(result).toEqual(unknownAction);
    });
  });
});
