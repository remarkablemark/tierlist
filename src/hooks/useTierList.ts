/**
 * Custom hook for tier list operations.
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { useTierListContext } from '../store/tierListContext';
import { type TierList, type TierListItem } from '../types/tierList';

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

  // Item operations
  addItem: (item: TierListItem, targetTierId?: string) => void;
  deleteItem: (itemId: string) => void;
  moveItem: (
    itemId: string,
    targetTierId: string | null,
    targetIndex: number,
  ) => void;
  updateItemLabel: (itemId: string, label: string) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;
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
    addItem,
    deleteItem,
    moveItem,
    updateItemLabel,
    undo,
    redo,
  };
}
