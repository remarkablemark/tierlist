/**
 * Component tests for the TierList component.
 * @packageDocumentation
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type TierListItemComponentProps } from 'src/components/TierListItem/TierListItem.types';
import { type Tier, type TierListItem } from 'src/types/tierList';

import { TierList } from './TierList';

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
  reorderTiers: ReturnType<typeof vi.fn>;
  tierList: {
    name: string;
    settings: {
      itemSize: 'small' | 'medium' | 'large';
      showItemLabels: boolean;
    };
    tiers: Tier[];
    unassignedItems: TierListItem[];
  };
  totalItems: number;
  undo: ReturnType<typeof vi.fn>;
  updateItemLabel: ReturnType<typeof vi.fn>;
  updateTierColor: ReturnType<typeof vi.fn>;
  updateTierLabel: ReturnType<typeof vi.fn>;
}

const { mockFileToDataUrl, mockGenerateId, mockState, mockUseTierList } =
  vi.hoisted(() => ({
    mockFileToDataUrl: vi.fn<(file: File) => Promise<string>>(),
    mockGenerateId: vi.fn(() => 'generated-id'),
    mockState: {
      selectedFiles: [] as File[],
      tierListState: null as MockUseTierListResult | null,
    },
    mockUseTierList: vi.fn(() => null as MockUseTierListResult | null),
  }));

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('src/hooks/useTierList', () => ({
  useTierList: () => mockUseTierList(),
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
  }) => (
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
    onLabelChange,
    onMoveDown,
    onMoveUp,
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
    onLabelChange: (label: string) => void;
    onMoveDown?: () => void;
    onMoveUp?: () => void;
    tier: Tier;
  }) => (
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
      <button type="button" onClick={onDelete}>
        Delete {tier.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onItemDrop(activeItemId ?? 'missing', tier.items.length);
        }}
      >
        Drop on {tier.id}
      </button>
      {onMoveUp ? (
        <button type="button" onClick={onMoveUp}>
          Move up {tier.id}
        </button>
      ) : null}
      {onMoveDown ? (
        <button type="button" onClick={onMoveDown}>
          Move down {tier.id}
        </button>
      ) : null}
      <button type="button" onClick={onItemDragEnter}>
        Enter {tier.id}
      </button>
      <button type="button" onClick={onItemDragLeave}>
        Leave {tier.id}
      </button>
      <button
        type="button"
        data-testid={`tier-over-${tier.id}`}
        onClick={() => {
          onItemDragOver?.({
            preventDefault: vi.fn(),
          } as unknown as React.DragEvent<HTMLDivElement>);
        }}
      >
        Drag over {tier.id}
      </button>
      <div>{children}</div>
    </section>
  ),
}));

vi.mock('../TierListItem', () => ({
  TierListItem: ({
    isDragging = false,
    isKeyboardDragActive = false,
    isDropTarget = false,
    item,
    onDelete,
    onDragEnd,
    onDragStart,
    onLabelEdit,
    onMove,
    onPointerDragEnd,
    onPointerDragStart,
  }: TierListItemComponentProps) => (
    <div
      aria-label={item.label}
      data-dragging={String(isDragging)}
      data-drop-target={String(isDropTarget)}
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
        Pointer start {item.id}
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
        Edit {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onPointerDragStart?.({
            dataTransfer: {
              effectAllowed: '',
              setData: vi.fn(),
            },
          } as unknown as React.DragEvent<HTMLDivElement>);
        }}
      >
        Pointer drag {item.id}
      </button>
      <button
        type="button"
        onClick={() => {
          onPointerDragEnd?.({
            preventDefault: vi.fn(),
          } as unknown as React.DragEvent<HTMLDivElement>);
        }}
      >
        Pointer end {item.id}
      </button>
    </div>
  ),
}));

function createTierListState(): MockUseTierListResult {
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
    reorderTiers: vi.fn(),
    tierList: {
      name: 'Tier List',
      settings: {
        itemSize: 'medium',
        showItemLabels: true,
      },
      tiers: [
        {
          id: 'tier-a',
          label: 'A',
          color: '#aaaaaa',
          items: [
            {
              id: 'tier-item-1',
              label: 'Tier Item 1',
              imageUrl: null,
              imageBlobId: null,
              createdAt: 1,
              metadata: {},
            },
            {
              id: 'tier-item-2',
              label: 'Tier Item 2',
              imageUrl: null,
              imageBlobId: null,
              createdAt: 2,
              metadata: {},
            },
          ],
          isCustomColor: false,
          isCustomLabel: false,
        },
        {
          id: 'tier-b',
          label: 'B',
          color: '#bbbbbb',
          items: [],
          isCustomColor: false,
          isCustomLabel: false,
        },
      ],
      unassignedItems: [
        {
          id: 'free-item',
          label: 'Free Item',
          imageUrl: null,
          imageBlobId: null,
          createdAt: 3,
          metadata: {},
        },
      ],
    },
    totalItems: 3,
    undo: vi.fn(),
    updateItemLabel: vi.fn(),
    updateTierColor: vi.fn(),
    updateTierLabel: vi.fn(),
  };
}

function renderTierList(overrides?: Partial<MockUseTierListResult>) {
  const tierListState = {
    ...createTierListState(),
    ...overrides,
  };

  mockState.tierListState = tierListState;
  mockUseTierList.mockImplementation(() => mockState.tierListState);

  return render(<TierList />);
}

function getState(): MockUseTierListResult {
  const state = mockState.tierListState;
  if (!state) {
    throw new Error('Expected tier list state to be initialized');
  }
  return state;
}

function getParentElement(element: HTMLElement): HTMLElement {
  const parentElement = element.parentElement;
  if (!parentElement) {
    throw new Error('Expected element to have a parent element');
  }
  return parentElement;
}

function getUnassignedGrid(): Element {
  const grid = screen.getByTestId('unassigned-items-section').lastElementChild;
  if (!grid) {
    throw new Error('Expected unassigned items grid to exist');
  }
  return grid;
}

describe('TierList integration', () => {
  beforeEach(() => {
    mockFileToDataUrl.mockReset();
    mockGenerateId.mockClear();
    mockUseTierList.mockReset();
    mockState.selectedFiles = [];
    mockState.tierListState = null;
  });

  it('wires header and tier controls to hook actions', () => {
    renderTierList();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Change label tier-a' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Change color tier-a' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete tier-a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move down tier-a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move up tier-b' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete item free-item' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit free-item' }));

    const state = getState();
    expect(state.undo).toHaveBeenCalledTimes(1);
    expect(state.redo).toHaveBeenCalledTimes(1);
    expect(state.addTier).toHaveBeenCalledTimes(1);
    expect(state.updateTierLabel).toHaveBeenCalledWith(
      'tier-a',
      'label-tier-a',
    );
    expect(state.updateTierColor).toHaveBeenCalledWith('tier-a', '#tier-a');
    expect(state.deleteTier).toHaveBeenCalledWith('tier-a');
    expect(state.reorderTiers).toHaveBeenNthCalledWith(1, 'tier-a', 1);
    expect(state.reorderTiers).toHaveBeenNthCalledWith(2, 'tier-b', 0);
    expect(state.deleteItem).toHaveBeenCalledWith('free-item');
    expect(state.updateItemLabel).toHaveBeenCalledWith(
      'free-item',
      'edited-free-item',
    );
  });

  it('adds uploaded items up to the remaining slot count', async () => {
    const fileOne = new File(['one'], 'Alpha.png', { type: 'image/png' });
    const fileTwo = new File(['two'], 'Beta.jpg', { type: 'image/jpeg' });

    mockState.selectedFiles = [fileOne, fileTwo];
    mockFileToDataUrl
      .mockResolvedValueOnce('data:alpha')
      .mockResolvedValueOnce('data:beta');

    renderTierList({ totalItems: 99 });
    fireEvent.click(screen.getByRole('button', { name: 'Select files' }));

    await waitFor(() => {
      const state = getState();
      expect(state.addItem).toHaveBeenCalledTimes(1);
    });

    const state = getState();
    expect(mockFileToDataUrl).toHaveBeenCalledTimes(1);
    expect(state.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-id',
        label: 'Alpha',
        imageUrl: 'data:alpha',
      }),
    );
    const addedItem = state.addItem.mock.calls[0][0] as TierListItem;
    expect(addedItem.metadata).toEqual(
      expect.objectContaining({
        originalFileName: 'Alpha.png',
        fileType: 'image/png',
        fileSize: fileOne.size,
      }),
    );
  });

  it('falls back to a generic label when an uploaded filename has no basename', async () => {
    const hiddenNameFile = new File(['one'], '.png', { type: 'image/png' });

    mockState.selectedFiles = [hiddenNameFile];
    mockFileToDataUrl.mockResolvedValueOnce('data:hidden');

    renderTierList();
    fireEvent.click(screen.getByRole('button', { name: 'Select files' }));

    await waitFor(() => {
      const state = getState();
      expect(state.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Item',
          imageUrl: 'data:hidden',
        }),
      );
    });
  });

  it('supports pointer drag into tiers and the unassigned area', () => {
    renderTierList();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer start free-item' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer drag free-item' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Drop on tier-b' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer drag tier-item-1' }),
    );
    fireEvent.dragOver(getUnassignedGrid());
    fireEvent.drop(getUnassignedGrid());
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer end tier-item-1' }),
    );

    const state = getState();
    expect(state.moveItem).toHaveBeenNthCalledWith(1, 'free-item', 'tier-b', 0);
    expect(state.moveItem).toHaveBeenNthCalledWith(2, 'tier-item-1', null, 1);
  });

  it('shows and clears reorder preview during drag-over within the same container', () => {
    renderTierList();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer drag tier-item-1' }),
    );

    const secondItem = screen.getByTestId('item-tier-item-2');
    const secondWrapper = getParentElement(secondItem);
    fireEvent.dragOver(secondWrapper);

    expect(secondItem).toHaveAttribute('data-drop-target', 'true');
    expect(secondWrapper).toHaveAttribute('data-reorder-preview', 'true');

    fireEvent.drop(secondWrapper);

    const state = getState();
    expect(state.moveItem).toHaveBeenCalledWith('tier-item-1', 'tier-a', 1);
  });

  it('clears reorder preview when dragging the same item or an item from another container', () => {
    renderTierList();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer drag tier-item-1' }),
    );
    const firstItem = screen.getByTestId('item-tier-item-1');
    fireEvent.dragOver(getParentElement(firstItem));

    expect(firstItem).toHaveAttribute('data-drop-target', 'false');

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer drag free-item' }),
    );
    const secondTierItem = screen.getByTestId('item-tier-item-2');
    fireEvent.dragOver(getParentElement(secondTierItem));

    expect(secondTierItem).toHaveAttribute('data-drop-target', 'false');
  });

  it('handles keyboard drag movement, drop, and cancel flows', () => {
    renderTierList();

    fireEvent.click(
      screen.getByRole('button', { name: 'Move down free-item' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick up free-item' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move up free-item' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Move down free-item' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Drop free-item' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up tier-item-1' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move right tier-item-1' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up tier-item-1' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move left tier-item-1' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up tier-item-1' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move up tier-item-1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Drop tier-item-1' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pick up tier-item-1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel tier-item-1' }));

    const state = getState();
    expect(state.moveItem).toHaveBeenCalledWith('free-item', 'tier-a', 2);
    expect(state.moveItem).toHaveBeenCalledWith('tier-item-1', 'tier-a', 1);
    expect(state.moveItem).toHaveBeenCalledWith('tier-item-1', null, 1);
  });

  it('no-ops when drops occur without a valid dragged item', () => {
    renderTierList();

    fireEvent.click(screen.getByRole('button', { name: 'Drop free-item' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel free-item' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop on tier-a' }));

    const secondItem = screen.getByTestId('item-tier-item-2');
    fireEvent.drop(getParentElement(secondItem));

    const state = getState();
    expect(state.moveItem).not.toHaveBeenCalled();
  });

  it('does not dispatch a move when dropping back to the same position', () => {
    renderTierList();

    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer drag tier-item-2' }),
    );
    const secondItem = screen.getByTestId('item-tier-item-2');
    fireEvent.drop(getParentElement(secondItem));

    const state = getState();
    expect(state.moveItem).not.toHaveBeenCalled();
  });

  it('keeps keyboard drag state when pointer drag ends', () => {
    renderTierList();

    fireEvent.click(screen.getByRole('button', { name: 'Pick up free-item' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pointer end free-item' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move down free-item' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Drop free-item' }));

    const state = getState();
    expect(state.moveItem).toHaveBeenCalledWith('free-item', 'tier-a', 2);
  });

  it('updates tier hover state when entering, leaving, and dragging over tiers', () => {
    renderTierList();

    const tierA = screen.getByTestId('tier-tier-a');
    const tierB = screen.getByTestId('tier-tier-b');

    expect(tierA).toHaveAttribute('data-is-over', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Enter tier-a' }));
    expect(screen.getByTestId('tier-tier-a')).toHaveAttribute(
      'data-is-over',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Leave tier-a' }));
    expect(screen.getByTestId('tier-tier-a')).toHaveAttribute(
      'data-is-over',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter tier-b' }));
    fireEvent.click(screen.getByRole('button', { name: 'Leave tier-a' }));
    expect(screen.getByTestId('tier-tier-b')).toHaveAttribute(
      'data-is-over',
      'true',
    );

    fireEvent.click(screen.getByTestId('tier-over-tier-b'));
    expect(tierB).toHaveAttribute('data-is-over', 'true');
  });

  it('renders warning states from hook flags', () => {
    const { rerender } = renderTierList({
      hasItemLimitWarning: true,
      totalItems: 55,
    });

    expect(
      screen.getByText(/warning: 55 items may affect performance/i),
    ).toBeInTheDocument();

    mockState.tierListState = {
      ...getState(),
      hasItemLimitWarning: false,
      hasReachedItemLimit: true,
    };

    rerender(<TierList />);

    expect(
      screen.getByText(/maximum 100 items reached\. please remove items/i),
    ).toBeInTheDocument();
  });
});
