/**
 * Custom hook for tier list operations.
 * @packageDocumentation
 */

import { useCallback } from 'react';

import {
  deleteTierList as deleteTierListFromStorage,
  getAllTierLists,
  loadTierList as loadTierListFromStorage,
  saveTierList as saveTierListToStorage,
} from '../services/storage';
import { useTierListContext } from '../store/tierListContext';
import { type TierList, type TierListItem } from '../types/tierList.types';
import { generateId } from '../utils/generateId';

/**
 * Summary information about a saved tier list.
 */
export interface SavedTierListSummary {
  id: string;
  name: string;
  updatedAt: number;
  lastAccessedAt: number;
}

/**
 * Return type for the useTierList hook.
 */
export interface UseTierListReturn {
  // State
  tierList: TierList;
  canUndo: boolean;
  canRedo: boolean;
  totalItems: number;
  hasReachedItemLimit: boolean;
  hasItemLimitWarning: boolean;

  // Tier operations
  addTier: (label?: string, color?: string) => void;
  deleteTier: (tierId: string) => void;
  reorderTiers: (tierId: string, newIndex: number) => void;
  updateTierLabel: (tierId: string, label: string) => void;
  updateTierColor: (tierId: string, color: string) => void;
  resetTier: (tierId: string) => void;

  // Item operations
  addItem: (item: TierListItem, targetTierId?: string) => void;
  deleteItem: (itemId: string) => void;
  moveItem: (
    itemId: string,
    targetTierId: string | null,
    targetIndex: number,
  ) => void;
  reorderItem: (tierId: string, itemId: string, newIndex: number) => void;
  updateItemLabel: (itemId: string, label: string) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Persistence
  save: () => Promise<void>;
  load: (id: string) => Promise<void>;
  createNew: (name?: string) => void;
  getAllSaved: () => Promise<SavedTierListSummary[]>;
  deleteSaved: (id: string) => Promise<void>;
}

/**
 * Custom hook that provides tier list operations.
 * @returns Object with tier list state and operations.
 */
export function useTierList(): UseTierListReturn {
  const { state, dispatch } = useTierListContext();

  // Current tier list
  const tierList = state.present;

  // Computed values
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;
  const totalItems =
    state.present.unassignedItems.length +
    state.present.tiers.reduce((sum, tier) => sum + tier.items.length, 0);
  const hasReachedItemLimit = totalItems >= 100;
  const hasItemLimitWarning = totalItems >= 50;

  // Tier operations
  const addTier = useCallback(
    (label?: string, color?: string) => {
      dispatch({
        type: 'TIER_ADD',
        payload: { label, color },
      });
    },
    [dispatch],
  );

  const deleteTier = useCallback(
    (tierId: string) => {
      dispatch({
        type: 'TIER_DELETE',
        payload: { tierId },
      });
    },
    [dispatch],
  );

  const reorderTiers = useCallback(
    (tierId: string, newIndex: number) => {
      const tierIndex = state.present.tiers.findIndex((t) => t.id === tierId);
      const direction = newIndex < tierIndex ? 'up' : 'down';

      dispatch({
        type: 'TIER_REORDER',
        payload: { tierId, direction },
      });
    },
    [dispatch, state.present.tiers],
  );

  const updateTierLabel = useCallback(
    (tierId: string, label: string) => {
      dispatch({
        type: 'TIER_UPDATE_LABEL',
        payload: { tierId, label },
      });
    },
    [dispatch],
  );

  const updateTierColor = useCallback(
    (tierId: string, color: string) => {
      dispatch({
        type: 'TIER_UPDATE_COLOR',
        payload: { tierId, color },
      });
    },
    [dispatch],
  );

  const resetTier = useCallback(
    (tierId: string) => {
      dispatch({
        type: 'TIER_RESET',
        payload: { tierId },
      });
    },
    [dispatch],
  );

  // Item operations
  const addItem = useCallback(
    (item: TierListItem, targetTierId?: string) => {
      dispatch({
        type: 'ITEM_ADD',
        payload: { item, targetTierId },
      });
    },
    [dispatch],
  );

  const deleteItem = useCallback(
    (itemId: string) => {
      dispatch({
        type: 'ITEM_DELETE',
        payload: { itemId },
      });
    },
    [dispatch],
  );

  const moveItem = useCallback(
    (itemId: string, targetTierId: string | null, targetIndex: number) => {
      // Find source tier
      let sourceTierId: string | null = null;
      for (const tier of state.present.tiers) {
        if (tier.items.some((i) => i.id === itemId)) {
          sourceTierId = tier.id;
          break;
        }
      }

      // If not in tier, it's in unassigned (empty string represents unassigned)
      sourceTierId ??= '';

      dispatch({
        type: 'ITEM_MOVE',
        payload: {
          itemId,
          sourceTierId,
          targetTierId,
          targetIndex,
        },
      });
    },
    [dispatch, state.present.tiers],
  );

  const reorderItem = useCallback(
    (tierId: string, itemId: string, newIndex: number) => {
      const tier = state.present.tiers.find((t) => t.id === tierId);
      if (!tier) return;

      const currentIndex = tier.items.findIndex((i) => i.id === itemId);
      const direction = newIndex < currentIndex ? 'up' : 'down';

      dispatch({
        type: 'ITEM_REORDER',
        payload: { tierId, itemId, direction },
      });
    },
    [dispatch, state.present.tiers],
  );

  const updateItemLabel = useCallback(
    (itemId: string, label: string) => {
      dispatch({
        type: 'ITEM_UPDATE_LABEL',
        payload: { itemId, label },
      });
    },
    [dispatch],
  );

  // Undo/redo
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  // Persistence
  const save = useCallback(async () => {
    await saveTierListToStorage(state.present);
  }, [state.present]);

  const load = useCallback(
    async (id: string) => {
      const tierList = await loadTierListFromStorage(id);
      if (tierList) {
        dispatch({ type: 'LOAD', payload: tierList });
      }
    },
    [dispatch],
  );

  const createNew = useCallback(
    (name?: string) => {
      const now = Date.now();
      const newTierList: TierList = {
        id: generateId(),
        name: name ?? 'Untitled Tier List',
        createdAt: now,
        updatedAt: now,
        tiers: [],
        unassignedItems: [],
        settings: {
          theme: 'system',
          tierHeight: 120,
          itemSize: 'medium',
          showItemLabels: true,
          enableAnimations: true,
          snapToGrid: false,
        },
        version: 1,
      };
      dispatch({ type: 'LOAD', payload: newTierList });
    },
    [dispatch],
  );

  const getAllSaved = useCallback(async (): Promise<SavedTierListSummary[]> => {
    return getAllTierLists();
  }, []);

  /* v8 ignore start */
  const deleteSaved = useCallback(async (id: string): Promise<void> => {
    await deleteTierListFromStorage(id);
  }, []);
  /* v8 ignore stop */

  return {
    tierList,
    canUndo,
    canRedo,
    totalItems,
    hasReachedItemLimit,
    hasItemLimitWarning,
    addTier,
    deleteTier,
    reorderTiers,
    updateTierLabel,
    updateTierColor,
    resetTier,
    addItem,
    deleteItem,
    moveItem,
    reorderItem,
    updateItemLabel,
    undo,
    redo,
    save,
    load,
    createNew,
    getAllSaved,
    deleteSaved,
  };
}
