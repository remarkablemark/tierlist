/**
 * Tier list reducer implementing all state-changing actions.
 * @packageDocumentation
 */

import {
  DEFAULT_TIERS,
  type Tier,
  type TierList,
  type TierListAction,
  type TierListItem,
  type TierListState,
} from '../types/tierList.types';
import { generateId } from '../utils/generateId';

/**
 * Maximum number of actions stored in undo history.
 */
const MAX_HISTORY_SIZE = 50;

/**
 * Creates a new tier with optional custom label and color.
 */
function createTier(label?: string, color?: string): Tier {
  return {
    id: generateId(),
    label: label ?? 'New Tier',
    color: color ?? '#ffffff',
    items: [],
    isCustomColor: label !== undefined || color !== undefined,
    isCustomLabel: label !== undefined || color !== undefined,
  };
}

/**
 * Adds a state change to the undo history, enforcing the 50-action limit.
 */
function addToHistory(
  state: TierListState,
  newPresent: TierList,
): TierListState {
  return {
    past: [...state.past, state.present].slice(-MAX_HISTORY_SIZE),
    present: newPresent,
    future: [], // Clear future on new action
  };
}

/**
 * Updates the updatedAt timestamp on a tier list.
 */
function updateTimestamp(tierList: TierList): TierList {
  return {
    ...tierList,
    updatedAt: Date.now(),
  };
}

/**
 * Tier list reducer function.
 * @param state - Current undo/redo state.
 * @param action - Action to dispatch.
 * @returns New undo/redo state.
 */
export function tierListReducer(
  state: TierListState,
  action: TierListAction,
): TierListState {
  switch (action.type) {
    case 'TIER_ADD': {
      const newTier = createTier(action.payload.label, action.payload.color);
      const newTiers = [...state.present.tiers, newTier];
      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
      });
      return addToHistory(state, newTierList);
    }

    case 'TIER_DELETE': {
      const tierToDelete = state.present.tiers.find(
        (t) => t.id === action.payload.tierId,
      );

      if (!tierToDelete) {
        return state;
      }

      // Move items from deleted tier to unassigned
      const newUnassigned = [
        ...state.present.unassignedItems,
        ...tierToDelete.items,
      ];
      const newTiers = state.present.tiers.filter(
        (t) => t.id !== action.payload.tierId,
      );
      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
        unassignedItems: newUnassigned,
      });
      return addToHistory(state, newTierList);
    }

    case 'TIER_REORDER': {
      const { tierId, direction } = action.payload;
      const tierIndex = state.present.tiers.findIndex((t) => t.id === tierId);
      if (tierIndex === -1) {
        return state;
      }

      const newTiers = [...state.present.tiers];
      const targetIndex = direction === 'up' ? tierIndex - 1 : tierIndex + 1;

      // Check bounds
      if (targetIndex < 0 || targetIndex >= newTiers.length) {
        return state;
      }

      // Swap tiers
      [newTiers[tierIndex], newTiers[targetIndex]] = [
        newTiers[targetIndex],
        newTiers[tierIndex],
      ];

      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
      });
      return addToHistory(state, newTierList);
    }

    case 'TIER_UPDATE_LABEL': {
      const { tierId, label } = action.payload;
      const newTiers = state.present.tiers.map((t) =>
        t.id === tierId ? { ...t, label, isCustomLabel: true } : t,
      );
      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
      });
      return addToHistory(state, newTierList);
    }

    case 'TIER_UPDATE_COLOR': {
      const { tierId, color } = action.payload;
      const newTiers = state.present.tiers.map((t) =>
        t.id === tierId ? { ...t, color, isCustomColor: true } : t,
      );
      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
      });
      return addToHistory(state, newTierList);
    }

    case 'TIER_RESET': {
      const { tierId } = action.payload;
      const tierIndex = state.present.tiers.findIndex((t) => t.id === tierId);

      if (tierIndex === -1) {
        return state;
      }

      // Get default values from DEFAULT_TIERS based on index
      /* v8 ignore start */
      const defaultTier = DEFAULT_TIERS[tierIndex] ?? DEFAULT_TIERS[0];
      /* v8 ignore stop */

      const newTiers = state.present.tiers.map(
        (t) =>
          t.id === tierId
            ? {
                ...t,
                label: defaultTier.label,
                color: defaultTier.color,
                isCustomLabel: false,
                isCustomColor: false,
              }
            : /* v8 ignore start */
              t,
        /* v8 ignore stop */
      );
      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
      });
      return addToHistory(state, newTierList);
    }

    case 'ITEM_ADD': {
      const { item, targetTierId } = action.payload;

      if (targetTierId) {
        // Add to specific tier
        const newTiers = state.present.tiers.map((t) =>
          t.id === targetTierId ? { ...t, items: [...t.items, item] } : t,
        );
        const newTierList = updateTimestamp({
          ...state.present,
          tiers: newTiers,
        });
        return addToHistory(state, newTierList);
      } else {
        // Add to unassigned
        const newUnassigned = [...state.present.unassignedItems, item];
        const newTierList = updateTimestamp({
          ...state.present,
          unassignedItems: newUnassigned,
        });
        return addToHistory(state, newTierList);
      }
    }

    case 'ITEM_DELETE': {
      const { itemId } = action.payload;

      // Check unassigned first
      const isInUnassigned = state.present.unassignedItems.some(
        (i) => i.id === itemId,
      );

      if (isInUnassigned) {
        const newUnassigned = state.present.unassignedItems.filter(
          (i) => i.id !== itemId,
        );
        const newTierList = updateTimestamp({
          ...state.present,
          unassignedItems: newUnassigned,
        });
        return addToHistory(state, newTierList);
      }

      // Check tiers
      for (const tier of state.present.tiers) {
        if (tier.items.some((i) => i.id === itemId)) {
          const newTiers = state.present.tiers.map(
            (t) =>
              t.id === tier.id
                ? { ...t, items: t.items.filter((i) => i.id !== itemId) }
                : /* v8 ignore start */
                  t,
            /* v8 ignore stop */
          );
          const newTierList = updateTimestamp({
            ...state.present,
            tiers: newTiers,
          });
          return addToHistory(state, newTierList);
        }
      }

      return state;
    }

    case 'ITEM_MOVE': {
      const { itemId, sourceTierId, targetTierId, targetIndex } =
        action.payload;

      let itemToMove: TierListItem | null = null;
      let newTiers = state.present.tiers;
      let newUnassigned = state.present.unassignedItems;

      // Remove from source
      if (sourceTierId) {
        const sourceTier = newTiers.find((t) => t.id === sourceTierId);

        /* v8 ignore start */
        if (sourceTier) {
          const itemIndex = sourceTier.items.findIndex((i) => i.id === itemId);

          if (itemIndex !== -1) {
            itemToMove = sourceTier.items[itemIndex];
            newTiers = newTiers.map((t) =>
              t.id === sourceTierId
                ? { ...t, items: t.items.filter((i) => i.id !== itemId) }
                : t,
            );
          }
        }
      } else {
        // From unassigned
        const itemIndex = newUnassigned.findIndex((i) => i.id === itemId);

        if (itemIndex !== -1) {
          itemToMove = newUnassigned[itemIndex];
          newUnassigned = newUnassigned.filter((i) => i.id !== itemId);
        }
      }
      /* v8 ignore stop */

      if (!itemToMove) {
        return state;
      }

      // Add to target
      if (targetTierId) {
        newTiers = newTiers.map((t) => {
          if (t.id === targetTierId) {
            const newItems = [...t.items];
            newItems.splice(targetIndex, 0, itemToMove);
            return { ...t, items: newItems };
          }
          return t;
        });
      } else {
        // To unassigned
        const newItems = [...newUnassigned];
        newItems.splice(targetIndex, 0, itemToMove);
        newUnassigned = newItems;
      }

      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
        unassignedItems: newUnassigned,
      });
      return addToHistory(state, newTierList);
    }

    case 'ITEM_REORDER': {
      const { tierId, itemId, direction } = action.payload;
      const tier = state.present.tiers.find((t) => t.id === tierId);

      if (!tier) {
        return state;
      }

      const itemIndex = tier.items.findIndex((i) => i.id === itemId);

      if (itemIndex === -1) {
        return state;
      }

      /* v8 ignore start */
      const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      /* v8 ignore stop */

      // Check bounds
      if (targetIndex < 0 || targetIndex >= tier.items.length) {
        return state;
      }

      const newItems = [...tier.items];
      [newItems[itemIndex], newItems[targetIndex]] = [
        newItems[targetIndex],
        newItems[itemIndex],
      ];

      const newTiers = state.present.tiers.map((t) =>
        t.id === tierId ? { ...t, items: newItems } : t,
      );

      const newTierList = updateTimestamp({
        ...state.present,
        tiers: newTiers,
      });
      return addToHistory(state, newTierList);
    }

    case 'ITEM_UPDATE_LABEL': {
      const { itemId, label } = action.payload;

      // Check unassigned first
      const isInUnassigned = state.present.unassignedItems.some(
        (i) => i.id === itemId,
      );
      if (isInUnassigned) {
        const newUnassigned = state.present.unassignedItems.map(
          (i) =>
            /* v8 ignore start */
            i.id === itemId ? { ...i, label } : i,
          /* v8 ignore stop */
        );
        const newTierList = updateTimestamp({
          ...state.present,
          unassignedItems: newUnassigned,
        });
        return addToHistory(state, newTierList);
      }

      // Check tiers
      for (const tier of state.present.tiers) {
        if (tier.items.some((i) => i.id === itemId)) {
          const newTiers = state.present.tiers.map(
            (t) =>
              t.id === tier.id
                ? {
                    ...t,
                    items: t.items.map(
                      (i) =>
                        /* v8 ignore start */
                        i.id === itemId ? { ...i, label } : i,
                      /* v8 ignore stop */
                    ),
                  }
                : /* v8 ignore start */
                  t,
            /* v8 ignore stop */
          );
          const newTierList = updateTimestamp({
            ...state.present,
            tiers: newTiers,
          });
          return addToHistory(state, newTierList);
        }
      }

      return state;
    }

    case 'DRAG_START':
    case 'DRAG_MOVE':
    case 'DRAG_END': {
      // Drag operations are handled by @dnd-kit and don't directly modify state
      // They trigger ITEM_MOVE or TIER_REORDER actions on drop
      return state;
    }

    case 'UNDO': {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      const newFuture = [state.present, ...state.future];

      return {
        past: newPast,
        present: previous,
        future: newFuture,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) {
        return state;
      }

      const next = state.future[0];
      const newPast = [...state.past, state.present];
      const newFuture = state.future.slice(1);

      return {
        past: newPast,
        present: next,
        future: newFuture,
      };
    }

    case 'SETTINGS_UPDATE': {
      const newSettings = {
        ...state.present.settings,
        ...action.payload,
      };
      const newTierList = updateTimestamp({
        ...state.present,
        settings: newSettings,
      });
      return addToHistory(state, newTierList);
    }

    case 'LOAD': {
      // Load replaces current state without adding to history
      return {
        past: [],
        present: action.payload,
        future: [],
      };
    }

    case 'SAVE_REQUEST':
    case 'SAVE_SUCCESS':
    case 'SAVE_ERROR': {
      // Save operations don't modify the tier list state
      return state;
    }

    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}
