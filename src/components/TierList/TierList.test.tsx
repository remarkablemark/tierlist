/**
 * Targeted coverage tests for TierList internal event handlers.
 * @packageDocumentation
 */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type React from 'react';
import { type ReactElement } from 'react';
import { type TierListItemComponentProps } from 'src/components/TierListItem/TierListItem.types';
import { type Tier } from 'src/types/tierList.types';

interface MockUseTierListResult {
  addItem: ReturnType<typeof vi.fn>;
  addTier: ReturnType<typeof vi.fn>;
  canRedo: boolean;
  canUndo: boolean;
  deleteItem: ReturnType<typeof vi.fn>;
  deleteTier: ReturnType<typeof vi.fn>;
  hasItemLimitWarning: boolean;
  hasReachedItemLimit: boolean;
  moveItem: ReturnType<typeof vi.fn>;
  redo: ReturnType<typeof vi.fn>;
  resetTier: ReturnType<typeof vi.fn>;
  tierList: {
    name: string;
    settings: {
      itemSize: 'small' | 'medium' | 'large';
      showItemLabels: boolean;
    };
    tiers: Tier[];
    unassignedItems: TierListItemComponentProps['item'][];
  };
  totalItems: number;
  undo: ReturnType<typeof vi.fn>;
  updateItemLabel: ReturnType<typeof vi.fn>;
  updateTierColor: ReturnType<typeof vi.fn>;
  updateTierLabel: ReturnType<typeof vi.fn>;
}

const { mockFileToDataUrl, mockGenerateId, mockState } = vi.hoisted(() => ({
  mockFileToDataUrl: vi.fn<(file: File) => Promise<string>>(),
  mockGenerateId: vi.fn(() => 'generated-id'),
  mockState: {
    selectedFiles: [] as File[],
    tierListState: null as MockUseTierListResult | null,
  },
}));

vi.mock('src/hooks/useTierList', () => ({
  useTierList: () => mockState.tierListState,
}));

vi.mock('src/utils/imageUpload', () => ({
  fileToDataUrl: mockFileToDataUrl,
}));

vi.mock('src/utils/generateId', () => ({
  generateId: () => mockGenerateId(),
}));

vi.mock('../AddItemButton', () => ({
  AddItemButton: ({
    onFileSelect,
  }: {
    onFileSelect: (files: File[]) => void;
  }): ReactElement => (
    <button
      type="button"
      onClick={() => {
        onFileSelect(mockState.selectedFiles);
      }}
    >
      Select files
    </button>
  ),
}));

vi.mock('../Tier', () => ({
  Tier: ({
    activeItemId,
    children,
    isOver,
    onColorChange,
    onDelete,
    onItemDragEnter,
    onItemDragLeave,
    onItemDragOver,
    onItemDrop,
    onItemReorder,
    onLabelChange,
    onReset,
    tier,
  }: {
    activeItemId?: string | null;
    children?: React.ReactNode;
    isOver?: boolean;
    onColorChange: (color: string) => void;
    onDelete: () => void;
    onItemDragEnter?: () => void;
    onItemDragLeave?: () => void;
    onItemDragOver?: React.DragEventHandler<HTMLDivElement>;
    onItemDrop: (itemId: string, index: number) => void;
    onItemReorder: (itemId: string, newIndex: number) => void;
    onLabelChange: (label: string) => void;
    onReset: () => void;
    tier: Tier;
  }): ReactElement => (
    <section
      data-is-over={String(isOver ?? false)}
      data-testid={`tier-${tier.id}`}
    >
      <button
        type="button"
        onClick={() => {
          onLabelChange(`label-${tier.id}`);
        }}
      >
        Change label {tier.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onColorChange(`#${tier.id}`);
        }}
      >
        Change color {tier.id}
      </button>
      <button type="button" onClick={onReset}>
        Reset {tier.id}
      </button>
      <button type="button" onClick={onDelete}>
        Delete {tier.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onItemDrop(activeItemId ?? 'missing', 0);
        }}
      >
        Drop on {tier.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onItemReorder(tier.id, 1);
        }}
      >
        Reorder {tier.id}
      </button>
      <button type="button" onClick={onItemDragEnter}>
        Enter {tier.id}
      </button>
      <button type="button" onClick={onItemDragLeave}>
        Leave {tier.id}
      </button>
      <div data-testid={`tier-over-${tier.id}`} onDragOver={onItemDragOver} />
      <div>{children}</div>
    </section>
  ),
}));

vi.mock('../TierListItem', () => ({
  TierListItem: ({
    isDragging = false,
    isKeyboardDragActive = false,
    item,
    onDelete,
    onDragEnd,
    onDragStart,
    onLabelEdit,
    onMove,
    onPointerDragEnd,
    onPointerDragStart,
  }: TierListItemComponentProps): ReactElement => (
    <div
      aria-label={item.label}
      data-dragging={String(isDragging)}
      data-keyboard-active={String(isKeyboardDragActive)}
      data-testid={`item-${item.id}`}
    >
      <span>{item.label}</span>
      <button
        type="button"
        onClick={() => {
          onDragStart('keyboard');
        }}
      >
        Pick up {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onDragStart('pointer');
        }}
      >
        Pointer source {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onDragEnd(true);
        }}
      >
        Drop {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onDragEnd(false);
        }}
      >
        Cancel {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onMove('left');
        }}
      >
        Move left {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onMove('right');
        }}
      >
        Move right {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onMove('up');
        }}
      >
        Move up {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onMove('down');
        }}
      >
        Move down {item.id}
      </button>
      <button type="button" onClick={onDelete}>
        Delete item {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onLabelEdit(`edited-${item.id}`);
        }}
      >
        Edit item {item.id}
      </button>
      <button
        type="button"
        onClick={() =>
          onPointerDragStart?.({
            dataTransfer: {
              effectAllowed: 'none',
              setData: vi.fn(),
            },
          } as unknown as React.DragEvent<HTMLDivElement>)
        }
      >
        Pointer start {item.id}
      </button>
      <button
        type="button"
        onClick={() =>
          onPointerDragEnd?.({} as unknown as React.DragEvent<HTMLDivElement>)
        }
      >
        Pointer end {item.id}
      </button>
    </div>
  ),
}));

import { TierList } from './TierList';

function createItem(
  id: string,
  label: string,
): TierListItemComponentProps['item'] {
  return {
    createdAt: 1,
    id,
    imageBlobId: null,
    imageUrl: null,
    label,
    metadata: {},
  };
}

function createTier(
  id: string,
  items: TierListItemComponentProps['item'][],
): Tier {
  return {
    color: '#ffffff',
    id,
    isCustomColor: false,
    isCustomLabel: false,
    items,
    label: id.toUpperCase(),
  };
}

function createMockHookResult(
  overrides: Partial<MockUseTierListResult> = {},
): MockUseTierListResult {
  const tierItemA = createItem('tier-item-a', 'Tier Item A');
  const tierItemB = createItem('tier-item-b', 'Tier Item B');
  const unassignedItem = createItem('unassigned-item', 'Unassigned Item');

  return {
    addItem: vi.fn(),
    addTier: vi.fn(),
    canRedo: true,
    canUndo: true,
    deleteItem: vi.fn(),
    deleteTier: vi.fn(),
    hasItemLimitWarning: false,
    hasReachedItemLimit: false,
    moveItem: vi.fn(),
    redo: vi.fn(),
    resetTier: vi.fn(),
    tierList: {
      name: 'Mock Tier List',
      settings: {
        itemSize: 'medium',
        showItemLabels: true,
      },
      tiers: [
        createTier('tier-a', [tierItemA, tierItemB]),
        createTier('tier-b', []),
      ],
      unassignedItems: [unassignedItem],
    },
    totalItems: 3,
    undo: vi.fn(),
    updateItemLabel: vi.fn(),
    updateTierColor: vi.fn(),
    updateTierLabel: vi.fn(),
    ...overrides,
  };
}

function renderSubject(overrides: Partial<MockUseTierListResult> = {}) {
  mockState.tierListState = createMockHookResult(overrides);
  return render(<TierList className="test-class" />);
}

function getHookState(): MockUseTierListResult {
  if (mockState.tierListState === null) {
    throw new Error('Expected mocked hook state to be initialized');
  }

  return mockState.tierListState;
}

function getParentElement(element: HTMLElement): HTMLElement {
  if (element.parentElement === null) {
    throw new Error('Expected parent element to exist');
  }

  return element.parentElement;
}

function getUnassignedDropZone(): HTMLElement {
  const section = screen.getByTestId('unassigned-items-section');
  const dropZone = section.lastElementChild;

  if (!(dropZone instanceof HTMLElement)) {
    throw new Error('Expected unassigned drop zone to exist');
  }

  return dropZone;
}

describe('TierList', () => {
  beforeEach(() => {
    mockState.selectedFiles = [];
    mockState.tierListState = null;
    mockFileToDataUrl.mockReset();
    mockGenerateId.mockClear();
    vi.spyOn(Date, 'now').mockReturnValue(1234);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('wires header and tier actions through the hook callbacks', () => {
    renderSubject();
    const hookState = getHookState();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add tier' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Change label tier-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Change color tier-a' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reorder tier-a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset tier-a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete tier-a' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete item tier-item-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit item tier-item-a' }),
    );

    expect(hookState.undo).toHaveBeenCalledTimes(1);
    expect(hookState.redo).toHaveBeenCalledTimes(1);
    expect(hookState.addTier).toHaveBeenCalledTimes(1);
    expect(hookState.updateTierLabel).toHaveBeenCalledWith(
      'tier-a',
      'label-tier-a',
    );
    expect(hookState.updateTierColor).toHaveBeenCalledWith('tier-a', '#tier-a');
    expect(hookState.resetTier).toHaveBeenCalledWith('tier-a');
    expect(hookState.deleteTier).toHaveBeenCalledWith('tier-a');
    expect(hookState.deleteItem).toHaveBeenCalledWith('tier-item-a');
    expect(hookState.updateItemLabel).toHaveBeenCalledWith(
      'tier-item-a',
      'edited-tier-item-a',
    );
  });

  it('moves an item between tiers and into unassigned via pointer and keyboard flows', () => {
    renderSubject();
    const hookState = getHookState();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer start tier-item-a' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enter tier-a' }));
    fireEvent.dragOver(screen.getByTestId('tier-over-tier-a'));
    fireEvent.click(screen.getByRole('button', { name: 'Leave tier-a' }));
    fireEvent.dragOver(
      getParentElement(screen.getByTestId('item-tier-item-b')),
    );
    fireEvent.drop(getParentElement(screen.getByTestId('item-tier-item-b')));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer end tier-item-a' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up tier-item-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move right tier-item-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up tier-item-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move down tier-item-a' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Drop tier-item-a' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer start tier-item-a' }),
    );
    const unassignedDropZone = getUnassignedDropZone();
    fireEvent.dragOver(unassignedDropZone);
    fireEvent.drop(unassignedDropZone);

    expect(hookState.moveItem).toHaveBeenCalledWith('tier-item-a', 'tier-a', 1);
    expect(hookState.moveItem).toHaveBeenCalledWith('tier-item-a', 'tier-b', 0);
    expect(hookState.moveItem).toHaveBeenCalledWith('tier-item-a', null, 1);
  });

  it('covers item drag-over branches and tier drop callbacks', () => {
    renderSubject();
    const hookState = getHookState();
    const tierItemA = screen.getByTestId('item-tier-item-a');
    const tierItemB = screen.getByTestId('item-tier-item-b');
    const unassignedItem = screen.getByTestId('item-unassigned-item');

    fireEvent.dragOver(getParentElement(tierItemB));
    expect(getParentElement(tierItemB)).toHaveAttribute(
      'data-reorder-preview',
      'false',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer start tier-item-a' }),
    );

    fireEvent.dragOver(getParentElement(tierItemA));
    expect(getParentElement(tierItemA)).toHaveAttribute(
      'data-reorder-preview',
      'false',
    );

    fireEvent.dragOver(getParentElement(unassignedItem));
    expect(getParentElement(unassignedItem)).toHaveAttribute(
      'data-reorder-preview',
      'false',
    );

    fireEvent.dragOver(getParentElement(tierItemB));
    expect(getParentElement(tierItemB)).toHaveAttribute(
      'data-reorder-preview',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Drop on tier-b' }));

    expect(hookState.moveItem).toHaveBeenCalledWith('tier-item-a', 'tier-b', 0);
  });

  it('ignores pointer-source drag starts and item drops without an active drag', () => {
    renderSubject();
    const hookState = getHookState();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer source tier-item-a' }),
    );
    fireEvent.drop(getParentElement(screen.getByTestId('item-tier-item-b')));

    expect(hookState.moveItem).not.toHaveBeenCalled();
    expect(screen.getByTestId('item-tier-item-a')).toHaveAttribute(
      'data-keyboard-active',
      'false',
    );
  });

  it('guards keyboard movement and cancel paths that should not dispatch moves', () => {
    renderSubject();
    const hookState = getHookState();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up tier-item-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move left tier-item-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move up tier-item-a' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel tier-item-a' }));

    expect(hookState.moveItem).not.toHaveBeenCalled();
  });

  it('clears drag state when dropping onto the current slot or an unknown item id', () => {
    renderSubject();
    const hookState = getHookState();

    fireEvent.click(screen.getByRole('button', { name: 'Drop on tier-b' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer start tier-item-a' }),
    );
    fireEvent.drop(getParentElement(screen.getByTestId('item-tier-item-a')));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer end tier-item-a' }),
    );

    expect(hookState.moveItem).not.toHaveBeenCalled();
    expect(screen.getByTestId('item-tier-item-a')).toHaveAttribute(
      'data-dragging',
      'false',
    );
  });

  it('preserves unrelated hover and reorder state when another tier receives drag leave', () => {
    renderSubject();
    const tierItemB = screen.getByTestId('item-tier-item-b');

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer start tier-item-a' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enter tier-a' }));
    fireEvent.dragOver(getParentElement(tierItemB));

    expect(screen.getByTestId('tier-tier-a')).toHaveAttribute(
      'data-is-over',
      'true',
    );
    expect(getParentElement(tierItemB)).toHaveAttribute(
      'data-reorder-preview',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Leave tier-b' }));

    expect(screen.getByTestId('tier-tier-a')).toHaveAttribute(
      'data-is-over',
      'true',
    );
    expect(getParentElement(tierItemB)).toHaveAttribute(
      'data-reorder-preview',
      'true',
    );
  });

  it('guards idle keyboard actions and vertical boundary moves', () => {
    renderSubject();
    const hookState = getHookState();

    fireEvent.click(
      screen.getByRole('button', { name: 'Move right tier-item-a' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Drop tier-item-a' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up unassigned-item' }),
    );

    expect(screen.getByTestId('item-unassigned-item')).toHaveAttribute(
      'data-keyboard-active',
      'true',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer end unassigned-item' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move up unassigned-item' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move right unassigned-item' }),
    );

    expect(screen.getByTestId('item-unassigned-item')).toHaveAttribute(
      'data-keyboard-active',
      'true',
    );
    expect(hookState.moveItem).not.toHaveBeenCalled();
  });

  it('handles active drops into the unassigned grid', () => {
    renderSubject();
    const hookState = getHookState();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer start unassigned-item' }),
    );
    fireEvent.drop(getUnassignedDropZone());
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer end unassigned-item' }),
    );

    expect(hookState.moveItem).toHaveBeenCalledWith('unassigned-item', null, 1);
    expect(screen.getByTestId('item-unassigned-item')).toHaveAttribute(
      'data-dragging',
      'false',
    );
  });

  it('uploads only the remaining available files and maps them into items', async () => {
    mockState.selectedFiles = [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.jpg', { type: 'image/jpeg' }),
    ];
    mockFileToDataUrl
      .mockResolvedValueOnce('data:first')
      .mockResolvedValueOnce('data:second');

    renderSubject({ totalItems: 99 });
    const hookState = getHookState();

    fireEvent.click(screen.getByRole('button', { name: 'Select files' }));

    await waitFor(() => {
      expect(hookState.addItem).toHaveBeenCalledTimes(1);
    });

    expect(mockFileToDataUrl).toHaveBeenCalledTimes(1);
    expect(hookState.addItem).toHaveBeenCalledWith({
      createdAt: 1234,
      id: 'generated-id',
      imageBlobId: null,
      imageUrl: 'data:first',
      label: 'first',
      metadata: {
        fileSize: 5,
        fileType: 'image/png',
        originalFileName: 'first.png',
        uploadedAt: 1234,
      },
    });
  });

  it('falls back to a default label when an uploaded file has no basename', async () => {
    mockState.selectedFiles = [new File(['x'], '.png', { type: 'image/png' })];
    mockFileToDataUrl.mockResolvedValueOnce('data:dotfile');

    renderSubject();
    const hookState = getHookState();

    fireEvent.click(screen.getByRole('button', { name: 'Select files' }));

    await waitFor(() => {
      expect(hookState.addItem).toHaveBeenCalledTimes(1);
    });

    expect(hookState.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Item',
      }),
    );
  });

  it('renders the configured warning states and empty unassigned message', () => {
    const { container } = renderSubject({
      hasItemLimitWarning: true,
      hasReachedItemLimit: false,
      totalItems: 50,
      tierList: {
        name: 'Mock Tier List',
        settings: {
          itemSize: 'medium',
          showItemLabels: true,
        },
        tiers: [createTier('tier-a', []), createTier('tier-b', [])],
        unassignedItems: [],
      },
    });

    expect(
      screen.getByText('Warning: 50 items may affect performance.'),
    ).toBeVisible();
    expect(screen.getByText('No unassigned items')).toBeVisible();
    expect(container.querySelector('.test-class')).not.toBeNull();
  });

  it('renders the maximum item warning when the limit is reached', () => {
    renderSubject({
      hasItemLimitWarning: true,
      hasReachedItemLimit: true,
    });

    expect(
      screen.getByText(
        'Maximum 100 items reached. Please remove items before adding more.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(/items may affect performance/i),
    ).not.toBeInTheDocument();
  });

  it('keeps tier-local controls scoped to the rendered tier containers', () => {
    renderSubject();

    const tierSection = screen.getByTestId('tier-tier-a');
    expect(
      within(tierSection).getByRole('button', { name: 'Change label tier-a' }),
    ).toBeVisible();
  });
});
