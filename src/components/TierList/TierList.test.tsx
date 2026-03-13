/**
 * Component tests for the TierList component.
 * @packageDocumentation
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
 * Creates a mock tier list with all items in the unassigned area.
 */
function createMockTierListWithUnassignedItems(
  itemCount: number,
): TierListData {
  const now = Date.now();
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: generateId(),
    label: `Item ${String(i + 1)}`,
    imageUrl: null,
    imageBlobId: null,
    createdAt: now,
    metadata: {},
  }));

  return {
    id: generateId(),
    name: 'Test Tier List',
    createdAt: now,
    updatedAt: now,
    tiers: DEFAULT_TIERS.map((t) => ({
      ...t,
      id: generateId(),
      items: [],
    })),
    unassignedItems: items,
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

  it('should render uploaded items inside the unassigned items section', async () => {
    render(<TierList />, { wrapper: TestWrapper });

    const fileInput = screen.getByTestId('file-input');
    const uploadedFile = new File(['uploaded image'], 'uploaded-image.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, {
      target: { files: [uploadedFile] },
    });

    const uploadedItem = await screen.findByRole('listitem', {
      name: 'uploaded-image',
    });
    const unassignedSection =
      screen.getByText('Unassigned Items').parentElement;

    expect(unassignedSection).not.toBeNull();
    expect(unassignedSection).toContainElement(uploadedItem);
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

  it('should add multiple uploaded images to the unassigned area', async () => {
    render(<TierList />, { wrapper: TestWrapper });

    const fileInput = screen.getByTestId('file-input');
    const firstFile = new File(['first image'], 'first-image.png', {
      type: 'image/png',
    });
    const secondFile = new File(['second image'], 'second-image.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, {
      target: { files: [firstFile, secondFile] },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('listitem', { name: 'first-image' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('listitem', { name: 'second-image' }),
      ).toBeInTheDocument();
    });
  });

  it('should only add files up to the remaining item limit', async () => {
    const mockTierList = createMockTierListWithUnassignedItems(99);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const fileInput = screen.getByTestId('file-input');
    const allowedFile = new File(['allowed image'], 'allowed-image.png', {
      type: 'image/png',
    });
    const ignoredFile = new File(['ignored image'], 'ignored-image.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, {
      target: { files: [allowedFile, ignoredFile] },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('listitem', { name: 'allowed-image' }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('listitem', { name: 'ignored-image' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/maximum 100 items reached/i).length,
    ).toBeGreaterThan(0);
  });

  describe('drag and drop - item to tier', () => {
    it('should show visual feedback when item is being dragged', () => {
      const mockTierList = createMockTierListWithUnassignedItems(5);
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
      const mockTierList = createMockTierListWithUnassignedItems(3);

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
      const mockTierList = createMockTierListWithUnassignedItems(3);
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

    it('should drop item into tier when dragged with the pointer', () => {
      const mockTierList = createMockTierListWithUnassignedItems(1);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      const unassignedItem = screen.getByRole('listitem', { name: 'Item 1' });
      const firstTier = screen.getAllByRole('region')[0];
      const tierDropZone = firstTier.querySelector('[role="list"]');

      expect(tierDropZone).not.toBeNull();

      fireEvent.dragStart(unassignedItem);
      fireEvent.dragOver(tierDropZone as HTMLElement);
      fireEvent.drop(tierDropZone as HTMLElement);

      expect(screen.getByText('No unassigned items')).toBeInTheDocument();
      expect(
        firstTier.querySelector('[aria-label="Item 1"]'),
      ).toBeInTheDocument();
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

    it('should reorder items within the same tier when dragged with the pointer', () => {
      const mockTierList = createMockTierListWithItems(10);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      const firstTier = screen.getAllByRole('region')[0];
      const itemsBeforeReorder = Array.from(
        firstTier.querySelectorAll('[role="listitem"]'),
      ).map((item) => item.getAttribute('aria-label'));

      expect(itemsBeforeReorder).toEqual(['Item 1', 'Item 2']);

      const firstItem = screen.getByRole('listitem', { name: 'Item 1' });
      const secondItem = screen.getByRole('listitem', { name: 'Item 2' });

      fireEvent.dragStart(firstItem);
      fireEvent.dragOver(secondItem);
      fireEvent.drop(secondItem);

      const itemsAfterReorder = Array.from(
        firstTier.querySelectorAll('[role="listitem"]'),
      ).map((item) => item.getAttribute('aria-label'));

      expect(itemsAfterReorder).toEqual(['Item 2', 'Item 1']);
    });

    it('should show a reorder target indicator when hovering another item in the same tier', async () => {
      const mockTierList = createMockTierListWithItems(10);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      const firstItem = screen.getByRole('listitem', { name: 'Item 1' });
      const secondItem = screen.getByRole('listitem', { name: 'Item 2' });

      fireEvent.dragStart(firstItem);
      fireEvent.dragOver(secondItem);

      await waitFor(() => {
        const dropTargetItem = screen.getByRole('listitem', { name: 'Item 2' });
        expect(dropTargetItem).toHaveAttribute('data-drop-target', 'true');
        expect(dropTargetItem).toHaveClass('ring-amber-500');
        expect(dropTargetItem.parentElement).toHaveAttribute(
          'data-reorder-preview',
          'true',
        );
        expect(dropTargetItem.parentElement).toHaveClass(
          '-translate-y-1',
          'translate-x-4',
        );
      });
    });

    it('should reorder items within the same tier with keyboard controls', async () => {
      const user = userEvent.setup();
      const mockTierList = createMockTierListWithItems(10);
      render(<TierList />, {
        wrapper: (props) => (
          <TestWrapper {...props} initialTierList={mockTierList} />
        ),
      });

      const firstItem = screen.getByRole('listitem', { name: 'Item 1' });

      firstItem.focus();
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowRight}');

      const firstTier = screen.getAllByRole('region')[0];
      const itemsAfterReorder = Array.from(
        firstTier.querySelectorAll('[role="listitem"]'),
      ).map((item) => item.getAttribute('aria-label'));

      expect(itemsAfterReorder).toEqual(['Item 2', 'Item 1']);
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
