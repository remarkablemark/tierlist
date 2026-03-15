/**
 * Focused tests for the tier list context provider.
 * @packageDocumentation
 */

import { renderHook } from '@testing-library/react';

import { DEFAULT_SETTINGS, DEFAULT_TIERS } from '../constants/tierList';
import { type TierList } from '../types/tierList';
import { generateId } from '../utils/generateId';
import { TierListProvider, useTierListContext } from './tierListContext';

/**
 * Creates a mock tier list for testing custom initialization.
 */
function createMockTierList(): TierList {
  const now = Date.now();
  return {
    id: generateId(),
    name: 'Custom Tier List',
    createdAt: now,
    updatedAt: now,
    tiers: DEFAULT_TIERS.map((tier) => ({ ...tier, id: generateId() })),
    unassignedItems: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}

describe('TierListContext', () => {
  it('throws when used outside the provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // noop
    });

    expect(() => renderHook(() => useTierListContext())).toThrow(
      'useTierListContext must be used within TierListProvider',
    );

    consoleSpy.mockRestore();
  });

  it('uses the provided initial tier list', () => {
    const customTierList = createMockTierList();

    function wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TierListProvider initialTierList={customTierList}>
          {children}
        </TierListProvider>
      );
    }

    const { result } = renderHook(() => useTierListContext(), { wrapper });

    expect(result.current.state.present).toBe(customTierList);
    expect(result.current.state.past).toEqual([]);
    expect(result.current.state.future).toEqual([]);
  });
});
