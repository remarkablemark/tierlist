/**
 * Component tests for the TierList component.
 * @packageDocumentation
 */

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TierListProvider } from 'src/store/tierListContext';
import {
  DEFAULT_SETTINGS,
  DEFAULT_TIERS,
  type TierList as TierListData,
} from 'src/types/tierList.types';
import { generateId } from 'src/utils/generateId';

import { TierList } from './TierList';

/**
 * Creates a mock tier list with specified number of items.
 */
function createMockTierListWithItems(itemCount: number): TierListData {
  const now = Date.now();
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: generateId(),
    label: `Item ${String(i + 1)}`,
    imageUrl: null,
    imageBlobId: null,
    createdAt: now,
    metadata: {},
  }));

  const tiers: TierListData['tiers'] = DEFAULT_TIERS.map((t) => ({
    ...t,
    id: generateId(),
    items: [],
  }));

  // Distribute items across tiers
  const itemsPerTier = Math.floor(itemCount / tiers.length);
  const remainingItems = itemCount % tiers.length;
  let itemIndex = 0;

  tiers.forEach((tier, tierIndex) => {
    const tierItemCount =
      tierIndex < remainingItems ? itemsPerTier + 1 : itemsPerTier;
    tier.items = items.slice(itemIndex, itemIndex + tierItemCount);
    itemIndex += tierItemCount;
  });

  return {
    id: generateId(),
    name: 'Test Tier List',
    createdAt: now,
    updatedAt: now,
    tiers,
    unassignedItems: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}

/**
 * Test wrapper with provider.
 */
function TestWrapper({
  children,
  initialTierList,
}: {
  children: React.ReactNode;
  initialTierList?: TierListData;
}) {
  return (
    <TierListProvider initialTierList={initialTierList}>
      {children}
    </TierListProvider>
  );
}

describe('TierList', () => {
  it('should render with header', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(screen.getByText('Tier List')).toBeInTheDocument();
  });

  it('should render unassigned items area', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('should have undo/redo buttons', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('should have add tier button', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(
      screen.getByRole('button', { name: /add tier/i }),
    ).toBeInTheDocument();
  });

  it('should allow adding a new tier', async () => {
    const user = userEvent.setup();
    render(<TierList />, { wrapper: TestWrapper });

    const addTierButton = screen.getByRole('button', { name: /add tier/i });
    await user.click(addTierButton);

    // Verify undo is now enabled (indicating state change)
    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeEnabled();
  });

  it('should support undo/redo', async () => {
    const user = userEvent.setup();
    render(<TierList />, { wrapper: TestWrapper });

    // Add a tier
    const addTierButton = screen.getByRole('button', { name: /add tier/i });
    await user.click(addTierButton);

    // Undo button should be enabled
    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeEnabled();

    // Click undo
    await user.click(undoButton);

    // Redo button should be enabled
    const redoButton = screen.getByRole('button', { name: /redo/i });
    expect(redoButton).toBeEnabled();
  });

  it('should show item limit warning when 50+ items', () => {
    const mockTierList = createMockTierListWithItems(50);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    expect(
      screen.getByText(/warning: 50 items may affect performance/i),
    ).toBeInTheDocument();
  });

  it('should show maximum items reached warning when 100+ items', () => {
    const mockTierList = createMockTierListWithItems(100);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    expect(
      screen.getByText(
        /maximum 100 items reached\. please remove items before adding more/i,
      ),
    ).toBeInTheDocument();
  });

  it('should not show warnings when under 50 items', () => {
    const mockTierList = createMockTierListWithItems(25);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    expect(
      screen.queryByText(/warning: \d+ items may affect performance/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /maximum 100 items reached\. please remove items before adding more/i,
      ),
    ).not.toBeInTheDocument();
  });
});

// Import React for JSX
import React from 'react';
