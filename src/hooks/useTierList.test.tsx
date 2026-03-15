/**
 * Adapter tests for the useTierList hook.
 * @packageDocumentation
 */

import { renderHook } from '@testing-library/react';
import { type TierListState } from 'src/types/tierList';

import { useTierList } from './useTierList';

interface MockTierListContextValue {
  dispatch: ReturnType<typeof vi.fn>;
  state: TierListState;
}

const mockUseTierListContext = vi.fn<() => MockTierListContextValue>();

vi.mock('../store/tierListContext', () => ({
  useTierListContext: () => mockUseTierListContext(),
}));

function createState(overrides?: Partial<TierListState>): TierListState {
  return {
    past: [],
    present: {
      id: 'list-1',
      name: 'Tier List',
      createdAt: 1,
      updatedAt: 1,
      tiers: [
        {
          id: 'tier-a',
          label: 'A',
          color: '#111111',
          items: [
            {
              id: 'tier-item',
              label: 'Tier Item',
              imageUrl: null,
              imageBlobId: null,
              createdAt: 1,
              metadata: {},
            },
          ],
          isCustomColor: false,
          isCustomLabel: false,
        },
        {
          id: 'tier-b',
          label: 'B',
          color: '#222222',
          items: [],
          isCustomColor: false,
          isCustomLabel: false,
        },
      ],
      unassignedItems: [
        {
          id: 'free-item',
          label: 'Free Item',
          imageUrl: null,
          imageBlobId: null,
          createdAt: 1,
          metadata: {},
        },
      ],
      settings: {
        showItemLabels: true,
        itemSize: 'medium',
      },
      version: 1,
    },
    future: [],
    ...overrides,
  };
}

describe('useTierList', () => {
  beforeEach(() => {
    mockUseTierListContext.mockReset();
  });

  it('computes derived flags from state', () => {
    const dispatch = vi.fn();
    mockUseTierListContext.mockReturnValue({
      state: createState({
        past: [createState().present],
        future: [createState().present],
      }),
      dispatch,
    });

    const { result } = renderHook(() => useTierList());

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.hasItemLimitWarning).toBe(false);
    expect(result.current.hasReachedItemLimit).toBe(false);
    expect(result.current.tierList.id).toBe('list-1');
  });

  it('computes warning and max item flags at the thresholds', () => {
    const dispatch = vi.fn();
    const thresholdItems = Array.from({ length: 100 }, (_, index) => ({
      id: `item-${String(index)}`,
      label: `Item ${String(index)}`,
      imageUrl: null,
      imageBlobId: null,
      createdAt: 1,
      metadata: {},
    }));

    mockUseTierListContext.mockReturnValue({
      state: createState({
        present: {
          ...createState().present,
          tiers: [],
          unassignedItems: thresholdItems,
        },
      }),
      dispatch,
    });

    const { result } = renderHook(() => useTierList());

    expect(result.current.totalItems).toBe(100);
    expect(result.current.hasItemLimitWarning).toBe(true);
    expect(result.current.hasReachedItemLimit).toBe(true);
  });

  it('dispatches direct tier and item actions', () => {
    const dispatch = vi.fn();
    const newItem = {
      id: 'new-item',
      label: 'New Item',
      imageUrl: null,
      imageBlobId: null,
      createdAt: 1,
      metadata: {},
    };

    mockUseTierListContext.mockReturnValue({
      state: createState(),
      dispatch,
    });

    const { result } = renderHook(() => useTierList());

    result.current.addTier('New Tier', '#abcdef');
    result.current.deleteTier('tier-a');
    result.current.updateTierLabel('tier-a', 'Updated');
    result.current.updateTierColor('tier-a', '#fedcba');
    result.current.addItem(newItem, 'tier-a');
    result.current.deleteItem('tier-item');
    result.current.updateItemLabel('tier-item', 'Edited');
    result.current.undo();
    result.current.redo();

    expect(dispatch.mock.calls).toEqual([
      [{ type: 'TIER_ADD', payload: { label: 'New Tier', color: '#abcdef' } }],
      [{ type: 'TIER_DELETE', payload: { tierId: 'tier-a' } }],
      [
        {
          type: 'TIER_UPDATE_LABEL',
          payload: { tierId: 'tier-a', label: 'Updated' },
        },
      ],
      [
        {
          type: 'TIER_UPDATE_COLOR',
          payload: { tierId: 'tier-a', color: '#fedcba' },
        },
      ],
      [
        {
          type: 'ITEM_ADD',
          payload: { item: newItem, targetTierId: 'tier-a' },
        },
      ],
      [{ type: 'ITEM_DELETE', payload: { itemId: 'tier-item' } }],
      [
        {
          type: 'ITEM_UPDATE_LABEL',
          payload: { itemId: 'tier-item', label: 'Edited' },
        },
      ],
      [{ type: 'UNDO' }],
      [{ type: 'REDO' }],
    ]);
  });

  it('derives source tier when moving an item out of a tier', () => {
    const dispatch = vi.fn();
    mockUseTierListContext.mockReturnValue({
      state: createState(),
      dispatch,
    });

    const { result } = renderHook(() => useTierList());

    result.current.moveItem('tier-item', 'tier-b', 0);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ITEM_MOVE',
      payload: {
        itemId: 'tier-item',
        sourceTierId: 'tier-a',
        targetTierId: 'tier-b',
        targetIndex: 0,
      },
    });
  });

  it('falls back to the unassigned source marker when moving an unassigned item', () => {
    const dispatch = vi.fn();
    mockUseTierListContext.mockReturnValue({
      state: createState(),
      dispatch,
    });

    const { result } = renderHook(() => useTierList());

    result.current.moveItem('free-item', null, 1);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ITEM_MOVE',
      payload: {
        itemId: 'free-item',
        sourceTierId: '',
        targetTierId: null,
        targetIndex: 1,
      },
    });
  });

  it('dispatches reorderTiers with up and down directions', () => {
    const dispatch = vi.fn();
    mockUseTierListContext.mockReturnValue({
      state: createState(),
      dispatch,
    });

    const { result } = renderHook(() => useTierList());

    result.current.reorderTiers('tier-b', 0);
    result.current.reorderTiers('tier-a', 1);

    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'TIER_REORDER',
          payload: { tierId: 'tier-b', direction: 'up' },
        },
      ],
      [
        {
          type: 'TIER_REORDER',
          payload: { tierId: 'tier-a', direction: 'down' },
        },
      ],
    ]);
  });
});
