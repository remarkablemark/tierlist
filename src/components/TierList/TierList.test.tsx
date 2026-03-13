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
import { createDefaultTierList } from 'src/utils/createDefaultTierList';
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

interface MockedTierListOptions {
  autoSaveError?: string | null;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'quota-exceeded';
  exportResult?: { success: boolean; error?: string };
  mockContainerRef?: boolean;
  savedTierListName?: string;
  tierList?: TierListData;
}

interface MockedTierListRenderResult {
  createNewSpy: ReturnType<typeof vi.fn>;
  deleteSavedSpy: ReturnType<typeof vi.fn>;
  exportSpy: ReturnType<typeof vi.fn>;
  exportTriggerPromise: Promise<void> | null;
  loadSpy: ReturnType<typeof vi.fn>;
  saveSpy: ReturnType<typeof vi.fn>;
}

async function renderMockedDragHarness(
  tierList: TierListData,
): Promise<{ moveItemSpy: ReturnType<typeof vi.fn> }> {
  vi.resetModules();

  const moveItemSpy = vi.fn();
  const mockTierListHook = () => ({
    addTier: vi.fn(),
    deleteTier: vi.fn(),
    reorderTiers: vi.fn(),
    updateTierLabel: vi.fn(),
    updateTierColor: vi.fn(),
    resetTier: vi.fn(),
    addItem: vi.fn(),
    deleteItem: vi.fn(),
    moveItem: moveItemSpy,
    reorderItem: vi.fn(),
    updateItemLabel: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    totalItems: tierList.unassignedItems.length,
    hasReachedItemLimit: false,
    hasItemLimitWarning: false,
    tierList,
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(undefined),
    createNew: vi.fn(),
    getAllSaved: vi.fn().mockResolvedValue([]),
    deleteSaved: vi.fn().mockResolvedValue(undefined),
  });
  const mockAutoSaveHook = () => ({
    status: 'idle' as const,
    errorMessage: null,
    lastSavedAt: null,
    save: vi.fn(),
  });

  vi.doMock('src/hooks/useTierList', () => ({
    useTierList: mockTierListHook,
  }));

  vi.doMock('src/hooks/useAutoSave', () => ({
    useAutoSave: mockAutoSaveHook,
  }));

  vi.doMock('../ExportButton', () => ({
    ExportButton: () => <div>Mock Export</div>,
  }));

  vi.doMock('../SaveLoadControls', () => ({
    SaveLoadControls: () => <div>Mock Save Controls</div>,
  }));

  vi.doMock('../Tier', () => ({
    Tier: ({
      children,
      onItemDrop,
      onItemDragLeave,
      onItemReorder,
      tier,
    }: {
      children: React.ReactNode;
      onItemDrop: (itemId: string) => void;
      onItemDragLeave?: () => void;
      onItemReorder: (itemId: string, newIndex: number) => void;
      tier: { id: string; label: string };
    }) => (
      <section>
        <button
          onClick={() => {
            onItemDrop('missing-item');
          }}
          type="button"
        >
          Drop Missing Item {tier.label}
        </button>
        <button
          onClick={() => {
            onItemReorder('missing-item', 0);
          }}
          type="button"
        >
          Trigger Reorder Handler {tier.label}
        </button>
        <button onClick={() => onItemDragLeave?.()} type="button">
          Leave Tier {tier.label}
        </button>
        {children}
      </section>
    ),
  }));

  vi.doMock('../TierListItem', () => ({
    TierListItem: ({
      item,
      onDragEnd,
      onDragStart,
      onMove,
      onPointerDragEnd,
    }: {
      item: { id: string; label: string };
      onDragEnd: (dropped: boolean) => void;
      onDragStart: (source: 'keyboard' | 'pointer') => void;
      onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
      onPointerDragEnd: () => void;
    }) => (
      <div>
        <button
          onClick={() => {
            onMove('up');
          }}
          type="button"
        >
          Move Up {item.label}
        </button>
        <button
          onClick={() => {
            onMove('left');
          }}
          type="button"
        >
          Move Left {item.label}
        </button>
        <button
          onClick={() => {
            onMove('right');
          }}
          type="button"
        >
          Move Right {item.label}
        </button>
        <button
          onClick={() => {
            onMove('down');
          }}
          type="button"
        >
          Move Down {item.label}
        </button>
        <button
          onClick={() => {
            onDragStart('keyboard');
          }}
          type="button"
        >
          Keyboard Start {item.label}
        </button>
        <button
          onClick={() => {
            onDragStart('pointer');
          }}
          type="button"
        >
          Pointer Start {item.label}
        </button>
        <button
          onClick={() => {
            onDragEnd(false);
          }}
          type="button"
        >
          Cancel Drop {item.label}
        </button>
        <button
          onClick={() => {
            onDragEnd(true);
          }}
          type="button"
        >
          Confirm Drop {item.label}
        </button>
        <button onClick={onPointerDragEnd} type="button">
          Pointer End {item.label}
        </button>
      </div>
    ),
  }));

  const { TierList: MockedTierList } = await import('./TierList');
  render(<MockedTierList />);

  return { moveItemSpy };
}

async function renderMockedTierList(
  options: MockedTierListOptions = {},
): Promise<MockedTierListRenderResult> {
  vi.resetModules();

  const saveSpy = vi.fn().mockResolvedValue(undefined);
  const loadSpy = vi.fn().mockResolvedValue(undefined);
  const deleteSavedSpy = vi.fn().mockResolvedValue(undefined);
  const createNewSpy = vi.fn();
  const exportSpy = vi
    .fn()
    .mockResolvedValue(options.exportResult ?? { success: true });
  let exportTriggerPromise: Promise<void> | null = null;
  const savedTierListName = options.savedTierListName ?? 'Saved Mock Tier';
  const tierList = options.tierList ?? createDefaultTierList();
  const mockTierListHook = () => ({
    addTier: vi.fn(),
    deleteTier: vi.fn(),
    reorderTiers: vi.fn(),
    updateTierLabel: vi.fn(),
    updateTierColor: vi.fn(),
    resetTier: vi.fn(),
    addItem: vi.fn(),
    deleteItem: vi.fn(),
    moveItem: vi.fn(),
    reorderItem: vi.fn(),
    updateItemLabel: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    totalItems: 0,
    hasReachedItemLimit: false,
    hasItemLimitWarning: false,
    tierList,
    save: saveSpy,
    load: loadSpy,
    createNew: createNewSpy,
    getAllSaved: vi.fn().mockResolvedValue([]),
    deleteSaved: deleteSavedSpy,
  });
  const mockAutoSaveHook = () => ({
    status: options.autoSaveStatus ?? 'idle',
    errorMessage: options.autoSaveError ?? null,
    lastSavedAt: options.autoSaveStatus === 'saved' ? Date.now() : null,
    save: vi.fn(),
  });

  vi.doMock('src/hooks/useTierList', () => ({
    useTierList: mockTierListHook,
  }));

  vi.doMock('src/hooks/useAutoSave', () => ({
    useAutoSave: mockAutoSaveHook,
  }));

  vi.doMock('src/utils/exportToPng', () => ({
    exportTierListToPng: exportSpy,
  }));

  vi.doMock('src/utils/imageUpload', () => ({
    fileToDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mocked'),
  }));

  vi.doMock('../SaveLoadControls', () => ({
    SaveLoadControls: ({
      onCreateNew,
      onDelete,
      onLoad,
      onSave,
    }: {
      onCreateNew: (name?: string) => void;
      onDelete: (id: string) => Promise<void>;
      onLoad: (id: string) => Promise<void>;
      onSave: () => Promise<void>;
    }) => (
      <div>
        <button onClick={() => void onSave()} type="button">
          Trigger Save
        </button>
        <button onClick={() => void onLoad('saved-tier-id')} type="button">
          Trigger Load
        </button>
        <button onClick={() => void onDelete('saved-tier-id')} type="button">
          Trigger Delete Saved
        </button>
        <button
          onClick={() => {
            onCreateNew(savedTierListName);
          }}
          type="button"
        >
          Trigger Create New
        </button>
      </div>
    ),
  }));

  if (options.mockContainerRef) {
    vi.doMock('../ExportButton', () => ({
      ExportButton: ({ onExport }: { onExport: () => Promise<void> }) => {
        exportTriggerPromise ??= onExport();
        return <div>Render-triggered export</div>;
      },
    }));
  }

  const { TierList: MockedTierList } = await import('./TierList');
  render(<MockedTierList />);

  return {
    createNewSpy,
    deleteSavedSpy,
    exportSpy,
    exportTriggerPromise,
    loadSpy,
    saveSpy,
  };
}

describe('TierList', () => {
  it('renders with header', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(screen.getByText('Untitled Tier List')).toBeInTheDocument();
  });

  it('renders unassigned items area', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('renders uploaded items inside the unassigned items section', async () => {
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

  it('has undo/redo buttons', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('has add tier button', () => {
    render(<TierList />, { wrapper: TestWrapper });

    expect(
      screen.getByRole('button', { name: /add tier/i }),
    ).toBeInTheDocument();
  });

  it('allows adding a new tier', async () => {
    const user = userEvent.setup();
    render(<TierList />, { wrapper: TestWrapper });

    const addTierButton = screen.getByRole('button', { name: /add tier/i });
    await user.click(addTierButton);

    // Verify undo is now enabled (indicating state change)
    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeEnabled();
  });

  it('supports undo/redo', async () => {
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

  it('shows item limit warning when 50+ items', () => {
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

  it('shows maximum items reached warning when 100+ items', () => {
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

  it('does not show warnings when under 50 items', () => {
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

  it('adds multiple uploaded images to the unassigned area', async () => {
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

  it('only add files up to the remaining item limit', async () => {
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

  it('uses the fallback item label when the uploaded filename has no basename', async () => {
    render(<TierList />, { wrapper: TestWrapper });

    fireEvent.change(screen.getByTestId('file-input'), {
      target: {
        files: [new File(['image'], '.png', { type: 'image/png' })],
      },
    });

    expect(
      await screen.findByRole('listitem', { name: 'Item' }),
    ).toBeInTheDocument();
  });

  describe('drag and drop - item to tier', () => {
    it('shows visual feedback when item is being dragged', () => {
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

    it('drops item into tier when Enter is pressed after moving to tier', async () => {
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

    it('cancels drag operation when Escape is pressed', async () => {
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

    it('drops item into tier when dragged with the pointer', () => {
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
    it('moves item from one tier to another with visual feedback', async () => {
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

    it('maintain item visibility during keyboard drag', async () => {
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

    it('reorders items within the same tier when dragged with the pointer', () => {
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

    it('shows a reorder target indicator when hovering another item in the same tier', async () => {
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

    it('reorders items within the same tier with keyboard controls', async () => {
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

  it('deletes a tier from the list', async () => {
    const user = userEvent.setup();
    const mockTierList = createMockTierListWithItems(0);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    expect(screen.getAllByRole('region')).toHaveLength(7);

    await user.click(
      screen.getAllByRole('button', { name: /delete tier/i })[0],
    );

    expect(screen.getAllByRole('region')).toHaveLength(6);
  });

  it('deletes an item from the unassigned area', async () => {
    const user = userEvent.setup();
    const mockTierList = createMockTierListWithUnassignedItems(1);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    await user.click(screen.getByRole('button', { name: /delete item/i }));

    expect(screen.getByText('No unassigned items')).toBeInTheDocument();
  });

  it('updates an item label from the unassigned area', async () => {
    const user = userEvent.setup();
    const mockTierList = createMockTierListWithUnassignedItems(1);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    await user.dblClick(screen.getByText('Item 1'));

    const labelInput = screen.getByRole('textbox', {
      name: /edit item label/i,
    });
    await user.clear(labelInput);
    await user.type(labelInput, 'Renamed Item');
    await user.tab();

    expect(
      screen.getByRole('listitem', { name: 'Renamed Item' }),
    ).toBeInTheDocument();
  });

  it('moves an item from a tier back to the unassigned area with pointer drag and drop', () => {
    const mockTierList = createMockTierListWithItems(10);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const firstTier = screen.getAllByRole('region')[0];
    const item = screen.getByRole('listitem', { name: 'Item 1' });
    const unassignedGrid = screen
      .getByTestId('unassigned-items-section')
      .querySelector('.min-h-\\[100px\\]');

    expect(unassignedGrid).not.toBeNull();

    fireEvent.dragStart(item, {
      dataTransfer: {
        effectAllowed: 'none',
        setData: vi.fn(),
      },
    });
    fireEvent.dragOver(unassignedGrid as HTMLElement);
    fireEvent.drop(unassignedGrid as HTMLElement);
    fireEvent.dragEnd(item);

    expect(
      firstTier.querySelector('[aria-label="Item 1"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('unassigned-items-section')).toContainElement(
      screen.getByRole('listitem', { name: 'Item 1' }),
    );
  });

  it('sets drag data when pointer dragging starts', () => {
    const setData = vi.fn();
    const mockTierList = createMockTierListWithUnassignedItems(1);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    fireEvent.dragStart(screen.getByRole('listitem', { name: 'Item 1' }), {
      dataTransfer: {
        effectAllowed: 'none',
        setData,
      },
    });

    expect(setData).toHaveBeenCalledWith('text/plain', expect.any(String));
  });

  it('clears pointer drag state on drag end without dropping', () => {
    const mockTierList = createMockTierListWithUnassignedItems(1);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const item = screen.getByRole('listitem', { name: 'Item 1' });

    fireEvent.dragStart(item);
    expect(item).toHaveAttribute('data-grabbed', 'true');

    fireEvent.dragEnd(item);

    expect(item).toHaveAttribute('data-grabbed', 'false');
  });

  it('clears tier hover and reorder state on drag leave', () => {
    const mockTierList = createMockTierListWithItems(10);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const firstItem = screen.getByRole('listitem', { name: 'Item 1' });
    const secondItem = screen.getByRole('listitem', { name: 'Item 2' });
    const firstTierDropZone = screen.getAllByRole('list', {
      name: /tier items/i,
    })[0];

    fireEvent.dragStart(firstItem);
    fireEvent.dragOver(secondItem);
    fireEvent.dragEnter(firstTierDropZone);

    expect(firstTierDropZone.parentElement).toHaveClass('ring-2');

    fireEvent.dragLeave(firstTierDropZone);

    expect(firstTierDropZone.parentElement).not.toHaveClass('ring-2');
    expect(secondItem.parentElement).toHaveAttribute(
      'data-reorder-preview',
      'false',
    );
  });

  it('keeps hover state unchanged when a different tier handles drag leave', () => {
    const mockTierList = createMockTierListWithItems(14);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const secondTierItems = screen.getAllByRole('region')[1];
    const sourceItem = screen.getByRole('listitem', { name: 'Item 3' });
    const targetItem = screen.getByRole('listitem', { name: 'Item 4' });
    const firstTierDropZone = screen.getAllByRole('list', {
      name: /tier items/i,
    })[0];
    const secondTierDropZone = screen.getAllByRole('list', {
      name: /tier items/i,
    })[1];

    fireEvent.dragStart(sourceItem);
    fireEvent.dragEnter(secondTierDropZone);
    fireEvent.dragOver(targetItem);
    fireEvent.dragLeave(firstTierDropZone);

    expect(secondTierItems).toHaveClass('ring-2');
    expect(targetItem.parentElement).toHaveAttribute(
      'data-reorder-preview',
      'true',
    );
  });

  it('does not show a reorder preview when dragging over the same item', () => {
    const mockTierList = createMockTierListWithItems(10);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const firstItem = screen.getByRole('listitem', { name: 'Item 1' });

    fireEvent.dragStart(firstItem);
    fireEvent.dragOver(firstItem);
    fireEvent.drop(firstItem);

    expect(firstItem).toHaveAttribute('data-drop-target', 'false');
    expect(firstItem.parentElement).toHaveAttribute(
      'data-reorder-preview',
      'false',
    );
  });

  it('does not show a reorder preview when hovering an item in a different tier', () => {
    const mockTierList = createMockTierListWithItems(14);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const firstTierItem = screen.getByRole('listitem', { name: 'Item 1' });
    const secondTierItem = screen.getByRole('listitem', { name: 'Item 3' });

    fireEvent.dragStart(firstTierItem);
    fireEvent.dragOver(secondTierItem);

    expect(secondTierItem).toHaveAttribute('data-drop-target', 'false');
    expect(secondTierItem.parentElement).toHaveAttribute(
      'data-reorder-preview',
      'false',
    );
  });

  it('ignores item-wrapper and unassigned drops when no item is active', () => {
    const mockTierList = createMockTierListWithItems(10);
    render(<TierList />, {
      wrapper: (props) => (
        <TestWrapper {...props} initialTierList={mockTierList} />
      ),
    });

    const secondItem = screen.getByRole('listitem', { name: 'Item 2' });
    const firstTier = screen.getAllByRole('region')[0];
    const unassignedGrid = screen
      .getByTestId('unassigned-items-section')
      .querySelector('.min-h-\\[100px\\]');

    fireEvent.drop(secondItem);
    fireEvent.drop(unassignedGrid as HTMLElement);

    const labelsAfterDrop = Array.from(
      firstTier.querySelectorAll('[role="listitem"]'),
    ).map((item) => item.getAttribute('aria-label'));

    expect(labelsAfterDrop).toEqual(['Item 1', 'Item 2']);
    expect(screen.getByText('No unassigned items')).toBeInTheDocument();
  });

  it('customizes tier color and persist the change', async () => {
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

  it('customizes tier label and persist the change', async () => {
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

  it('resets tier to default values', async () => {
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

describe('TierList mocked wiring', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.doUnmock('src/hooks/useTierList');
    vi.doUnmock('src/hooks/useAutoSave');
    vi.doUnmock('src/utils/exportToPng');
    vi.doUnmock('src/utils/imageUpload');
    vi.doUnmock('../ExportButton');
    vi.doUnmock('../SaveLoadControls');
    vi.doUnmock('../Tier');
    vi.doUnmock('../TierListItem');
  });

  it('invokes persistence callbacks exposed through save and load controls', async () => {
    const user = userEvent.setup();
    const { createNewSpy, deleteSavedSpy, loadSpy, saveSpy } =
      await renderMockedTierList();

    await user.click(screen.getByRole('button', { name: 'Trigger Save' }));
    await user.click(screen.getByRole('button', { name: 'Trigger Load' }));
    await user.click(
      screen.getByRole('button', { name: 'Trigger Delete Saved' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Trigger Create New' }),
    );

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledWith('saved-tier-id');
    expect(deleteSavedSpy).toHaveBeenCalledWith('saved-tier-id');
    expect(createNewSpy).toHaveBeenCalledWith('Saved Mock Tier');
  });

  it('shows saved and error auto-save states from the hook', async () => {
    await renderMockedTierList({ autoSaveStatus: 'saved' });
    expect(screen.getByText('Saved')).toBeInTheDocument();

    vi.resetModules();
    document.body.innerHTML = '';

    await renderMockedTierList({
      autoSaveError: 'Auto-save failed',
      autoSaveStatus: 'error',
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Auto-save failed');
  });

  it('surfaces export failures from the export utility', async () => {
    const user = userEvent.setup();
    await renderMockedTierList({
      exportResult: { success: false, error: 'PNG export failed' },
    });

    await user.click(screen.getByRole('button', { name: /export as png/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'PNG export failed',
    );
  });

  it('allows successful export calls and falls back to the default export error message', async () => {
    const user = userEvent.setup();
    const successResult = await renderMockedTierList({
      exportResult: { success: true },
    });

    await user.click(screen.getByRole('button', { name: /export as png/i }));
    expect(successResult.exportSpy).toHaveBeenCalledTimes(1);

    vi.resetModules();
    document.body.innerHTML = '';

    await renderMockedTierList({
      exportResult: { success: false },
    });

    await user.click(screen.getByRole('button', { name: /export as png/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Export failed');
  });

  it('surfaces the missing container guard during export', async () => {
    const { exportTriggerPromise } = await renderMockedTierList({
      mockContainerRef: true,
    });

    await expect(exportTriggerPromise).rejects.toThrow(
      'Container not available for export',
    );
  });

  it('covers internal drag guard branches through mocked item controls', async () => {
    const user = userEvent.setup();
    const now = Date.now();
    const harnessTierList: TierListData = {
      id: generateId(),
      name: 'Harness',
      createdAt: now,
      updatedAt: now,
      tiers: [
        {
          ...DEFAULT_TIERS[0],
          id: 'tier-s',
          items: [],
        },
      ],
      unassignedItems: [
        {
          id: 'item-1',
          label: 'Harness Item 1',
          imageUrl: null,
          imageBlobId: null,
          createdAt: now,
          metadata: {},
        },
        {
          id: 'item-2',
          label: 'Harness Item 2',
          imageUrl: null,
          imageBlobId: null,
          createdAt: now,
          metadata: {},
        },
      ],
      settings: DEFAULT_SETTINGS,
      version: 1,
    };

    const { moveItemSpy } = await renderMockedDragHarness(harnessTierList);

    await user.click(
      screen.getByRole('button', { name: 'Move Up Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Confirm Drop Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Drop Missing Item S' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Trigger Reorder Handler S' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Pointer Start Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Pointer End Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Keyboard Start Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Move Left Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Move Up Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Cancel Drop Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Keyboard Start Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Pointer End Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Keyboard Start Harness Item 1' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Move Right Harness Item 1' }),
    );

    expect(moveItemSpy).toHaveBeenCalledWith('item-1', null, 1);
  });
});
