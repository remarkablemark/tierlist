/**
 * Context provider for tier list state management.
 * @packageDocumentation
 */

/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useReducer,
} from 'react';

import {
  DEFAULT_SETTINGS,
  DEFAULT_TIERS,
  type TierList,
  type TierListAction,
  type TierListState,
} from '../types/tierList.types';
import { generateId } from '../utils/generateId';
import { tierListReducer } from './tierListReducer';

/**
 * Context value interface.
 */
export interface TierListContextValue {
  state: TierListState;
  dispatch: React.Dispatch<TierListAction>;
}

/**
 * Context for tier list state management.
 */
export const TierListContext = createContext<TierListContextValue | null>(null);

/**
 * Props for the TierListProvider component.
 */
export interface TierListProviderProps {
  children: ReactNode;
  initialTierList?: TierList;
}

/**
 * Creates a default tier list.
 */
function createDefaultTierList(): TierList {
  const now = Date.now();
  return {
    id: generateId(),
    name: 'Untitled Tier List',
    createdAt: now,
    updatedAt: now,
    tiers: DEFAULT_TIERS.map((t) => ({ ...t, id: generateId() })),
    unassignedItems: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}

/**
 * Provider component for tier list context.
 */
export function TierListProvider({
  children,
  initialTierList,
}: TierListProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    tierListReducer,
    initialTierList ?? createDefaultTierList(),
    (initial) => ({
      past: [],
      present: initial,
      future: [],
    }),
  );

  const contextValue = useCallback(
    (): TierListContextValue => ({
      state,
      dispatch,
    }),
    [state],
  );

  return <TierListContext value={contextValue()}>{children}</TierListContext>;
}

/**
 * Hook to access tier list context.
 * @returns The tier list context value.
 * @throws Error if used outside TierListProvider.
 */
export function useTierListContext(): TierListContextValue {
  const context = use(TierListContext);
  if (!context) {
    throw new Error('useTierListContext must be used within TierListProvider');
  }
  return context;
}
