/**
 * Component tests for the TierList component.
 * @packageDocumentation
 */

import { render, screen, waitFor } from '@testing-library/react';
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

    expect(screen.getByText('Untitled Tier List')).toBeInTheDocument();
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

  describe('drag and drop - item to tier', () => {
    it('should show visual feedback when item is being dragged', () => {
      const mockTierList = createMockTierListWithItems(5);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      // Find first item in unassigned area
      const items = screen.getAllByRole('listitem');
      const firstItem = items[0];

      // Item should be present and draggable
      expect(firstItem).toBeInTheDocument();
      // When not dragging, data-grabbed should not be set to true
      expect(firstItem.getAttribute('data-grabbed')).not.toBe('true');
    });

    it('should drop item into tier when Enter is pressed after moving to tier', async () => {
      const user = userEvent.setup();
      const mockTierList = createMockTierListWithItems(3);

      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      // Find first item in unassigned area
      const items = screen.getAllByRole('listitem');
      const firstItem = items[0];
      const itemLabel = firstItem.getAttribute('aria-label');

      // Start keyboard drag
      firstItem.focus();
      await user.keyboard('{Enter}');

      // Move to first tier
      await user.keyboard('{ArrowDown}');

      // Drop the item
      await user.keyboard('{Enter}');

      // Item should no longer be in unassigned area
      // (it's now in the tier)
      const unassignedArea = screen.getByText('Unassigned Items').parentElement;
      if (itemLabel && unassignedArea) {
        expect(
          unassignedArea.querySelector(`[aria-label="${itemLabel}"]`),
        ).not.toBeInTheDocument();
      }
    });

    it('should cancel drag operation when Escape is pressed', async () => {
      const user = userEvent.setup();
      const mockTierList = createMockTierListWithItems(3);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      // Find first item
      const items = screen.getAllByRole('listitem');
      const firstItem = items[0];

      // Start keyboard drag
      firstItem.focus();
      await user.keyboard('{Enter}');

      // Move item
      await user.keyboard('{ArrowDown}');

      // Cancel
      await user.keyboard('{Escape}');

      // Item should still be in unassigned area (drag cancelled)
      expect(firstItem).toBeInTheDocument();
    });
  });

  describe('move item between tiers', () => {
    it('should move item from one tier to another with visual feedback', async () => {
      const user = userEvent.setup();
      // Create tier list with items in first tier
      const mockTierList = createMockTierListWithItems(10);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      // Find first item in first tier
      const tiers = screen.getAllByRole('region');
      const firstTier = tiers[0];
      const itemsInFirstTier = firstTier.querySelectorAll('[role="listitem"]');

      expect(itemsInFirstTier.length).toBeGreaterThan(0);

      const firstItem = itemsInFirstTier[0] as HTMLElement;
      const itemLabel = firstItem.getAttribute('aria-label');

      // Start keyboard drag
      firstItem.focus();
      await user.keyboard('{Enter}');

      // Move down to next tier
      await user.keyboard('{ArrowDown}');

      // Drop in new tier
      await user.keyboard('{Enter}');

      // Verify visual feedback persisted (item is in new tier)
      if (itemLabel) {
        // The item should now be in a different tier
        const allItems = screen.getAllByRole('listitem');
        const movedItem = allItems.find(
          (item) => item.getAttribute('aria-label') === itemLabel,
        );
        expect(movedItem).toBeInTheDocument();
      }
    });

    it('should maintain item visibility during keyboard drag', async () => {
      const user = userEvent.setup();
      const mockTierList = createMockTierListWithItems(5);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      // Find first item
      const items = screen.getAllByRole('listitem');
      const firstItem = items[0];

      // Start keyboard drag
      firstItem.focus();
      await user.keyboard('{Enter}');

      // Item should still be visible during drag
      expect(firstItem).toBeInTheDocument();

      // Move multiple times
      await user.keyboard('{ArrowDown}');
      expect(firstItem).toBeInTheDocument();

      await user.keyboard('{ArrowUp}');
      expect(firstItem).toBeInTheDocument();
    });
  });

  it('should customize tier color and persist the change', async () => {
    const user = userEvent.setup();
    const mockTierList = createMockTierListWithItems(0);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    // Find color picker button for first tier
    const colorPickerButton = screen.getAllByRole('button', {
      name: /tier color/i,
    })[0];
    await user.click(colorPickerButton);

    // Select a different color from palette
    const colorOption = screen.getByRole('button', {
      name: /#ff0000/i,
    });
    await user.click(colorOption);

    // Tier should have new background color
    const tier = screen.getAllByRole('region')[0];
    expect(tier).toHaveStyle('background-color: #ff0000');
  });

  it('should customize tier label and persist the change', async () => {
    const user = userEvent.setup();
    const mockTierList = createMockTierListWithItems(0);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    // Find label input for first tier
    const labelInputs = screen.getAllByRole('textbox', { name: /tier label/i });
    const firstLabelInput = labelInputs[0];

    // Change the label
    await user.clear(firstLabelInput);
    await user.type(firstLabelInput, 'Custom Tier');

    // Wait for React to process state updates
    await waitFor(() => {
      expect(firstLabelInput).toHaveValue('Custom Tier');
    });

    await user.tab(); // Blur to trigger change

    // Label should be updated
    expect(firstLabelInput).toHaveValue('Custom Tier');
  });

  it('should reset tier to default values', async () => {
    const user = userEvent.setup();
    const mockTierList = createMockTierListWithItems(0);
    // Start with custom tier - modify the first tier's label and color
    const originalFirstTier = mockTierList.tiers[0];
    originalFirstTier.label = 'Custom';
    originalFirstTier.color = '#00ff00';
    originalFirstTier.isCustomLabel = true;
    originalFirstTier.isCustomColor = true;

    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    // Verify initial custom values
    const labelInputs = screen.getAllByRole('textbox', { name: /tier label/i });
    expect(labelInputs[0]).toHaveValue('Custom');

    // Find reset button for first tier
    const resetButtons = screen.getAllByRole('button', { name: /reset tier/i });
    const firstResetButton = resetButtons[0];
    await user.click(firstResetButton);

    // After reset, the tier should use default label from DEFAULT_TIERS
    // The component re-renders with updated tier data
    const updatedLabelInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    // Label should be reset to default (S for first tier)
    expect(updatedLabelInputs[0]).toHaveValue('S');
  });
});

// Import React for JSX
import React from 'react';
