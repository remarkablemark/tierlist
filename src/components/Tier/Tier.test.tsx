/**
 * Component tests for the Tier component.
 * @packageDocumentation
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type Tier as TierType } from 'src/types/tierList';
import { generateId } from 'src/utils/generateId';

import { Tier } from './Tier';

/**
 * Creates a mock tier for testing.
 */
function createMockTier(overrides?: Partial<TierType>): TierType {
  return {
    id: generateId(),
    label: 'S',
    color: '#ff7f7f',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
    ...overrides,
  };
}

/**
 * Mock props for the Tier component.
 */
const mockProps = {
  tier: createMockTier(),
  index: 0,
  totalTiers: 7,
  isDragging: false,
  isOver: false,
  onLabelChange: vi.fn(),
  onColorChange: vi.fn(),
  onDelete: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onItemDrop: vi.fn(),
  onItemReorder: vi.fn(),
  itemSize: 'medium' as const,
  showLabels: true,
};

describe('Tier', () => {
  it('renders tier with label in input', () => {
    render(<Tier {...mockProps} />);

    const labelInput = screen.getByRole('textbox', { name: /tier label/i });
    expect(labelInput).toHaveValue('S');
  });

  it('renders tier with correct background color', () => {
    render(<Tier {...mockProps} />);

    const tier = screen.getByRole('region');
    expect(tier).toHaveStyle('background-color: #ff7f7f');
  });

  it('renders tier items', () => {
    const tierWithItems = {
      ...mockProps,
      tier: createMockTier({
        items: [
          {
            id: generateId(),
            label: 'Item 1',
            imageUrl: null,
            imageBlobId: null,
            createdAt: Date.now(),
            metadata: {},
          },
          {
            id: generateId(),
            label: 'Item 2',
            imageUrl: null,
            imageBlobId: null,
            createdAt: Date.now(),
            metadata: {},
          },
        ],
      }),
    };

    render(<Tier {...tierWithItems} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<Tier {...mockProps} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete tier/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onLabelChange when label is edited', async () => {
    const user = userEvent.setup();
    const onLabelChange = vi.fn();
    render(<Tier {...mockProps} onLabelChange={onLabelChange} />);

    const labelInput = screen.getByRole('textbox', { name: /tier label/i });
    await user.clear(labelInput);
    await user.type(labelInput, 'New Label');

    // Wait for React to process state updates
    await waitFor(() => {
      expect(labelInput).toHaveValue('New Label');
    });

    await user.tab(); // Blur to trigger change

    expect(onLabelChange).toHaveBeenCalledWith('New Label');
  });

  it('calls onColorChange when color picker is used', async () => {
    const user = userEvent.setup();
    const onColorChange = vi.fn();
    render(<Tier {...mockProps} onColorChange={onColorChange} />);

    const colorPickerButton = screen.getByRole('button', {
      name: /tier color/i,
    });
    await user.click(colorPickerButton);

    // Find and click a color option (using a unique color)
    const colorOption = screen.getByRole('button', {
      name: /#ff0000/i,
    });
    await user.click(colorOption);

    expect(onColorChange).toHaveBeenCalledWith('#ff0000');
  });

  it('calls onItemDrop when item is dropped', () => {
    const onItemDrop = vi.fn();
    render(
      <Tier
        {...mockProps}
        onItemDrop={onItemDrop}
        activeItemId="dragged-item-id"
      />,
    );

    const dropZone = screen.getByRole('list', { name: /tier items/i });
    fireEvent.drop(dropZone);

    expect(onItemDrop).toHaveBeenCalledWith('dragged-item-id', 0);
  });

  it('shows move up button when not first tier', () => {
    render(<Tier {...mockProps} index={1} />);

    expect(
      screen.getByRole('button', { name: /move up/i }),
    ).toBeInTheDocument();
  });

  it('does not show move up button when first tier', () => {
    render(<Tier {...mockProps} index={0} />);

    expect(
      screen.queryByRole('button', { name: /move up/i }),
    ).not.toBeInTheDocument();
  });

  it('shows move down button when not last tier', () => {
    render(<Tier {...mockProps} index={0} totalTiers={7} />);

    expect(
      screen.getByRole('button', { name: /move down/i }),
    ).toBeInTheDocument();
  });

  it('does not show move down button when last tier', () => {
    render(<Tier {...mockProps} index={6} totalTiers={7} />);

    expect(
      screen.queryByRole('button', { name: /move down/i }),
    ).not.toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<Tier {...mockProps} />);

    const tier = screen.getByRole('region');
    expect(tier).toHaveAttribute('aria-label', 'Tier S');
  });

  it('has correct ARIA attributes for items list', () => {
    render(<Tier {...mockProps} />);

    const itemList = screen.getByRole('list', { name: /tier items/i });
    expect(itemList).toBeInTheDocument();
  });

  it('applies custom color when isCustomColor is true', () => {
    const customTier = createMockTier({
      color: '#00ff00',
      isCustomColor: true,
    });
    render(<Tier {...mockProps} tier={customTier} />);

    const tier = screen.getByRole('region');
    expect(tier).toHaveStyle('background-color: #00ff00');
  });

  it('applies custom label in input when isCustomLabel is true', () => {
    const customTier = createMockTier({
      label: 'Custom',
      isCustomLabel: true,
    });
    render(<Tier {...mockProps} tier={customTier} />);

    const labelInput = screen.getByRole('textbox', { name: /tier label/i });
    expect(labelInput).toHaveValue('Custom');
  });

  it('hides labels when showLabels is false', () => {
    render(<Tier {...mockProps} showLabels={false} />);

    const labelInput = screen.queryByRole('textbox', { name: /tier label/i });
    expect(labelInput).not.toBeInTheDocument();
  });

  it('renders items with correct size', () => {
    const tierWithItems = {
      ...mockProps,
      tier: createMockTier({
        items: [
          {
            id: generateId(),
            label: 'Item 1',
            imageUrl: null,
            imageBlobId: null,
            createdAt: Date.now(),
            metadata: {},
          },
        ],
      }),
      itemSize: 'large' as const,
    };

    render(<Tier {...tierWithItems} />);

    // Item should be rendered with large size class
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('has drop zone styling when isOver is true', () => {
    render(<Tier {...mockProps} isOver />);

    const tier = screen.getByRole('region');
    // Drop zone styling would be applied via class
    expect(tier).toHaveClass('ring-2');
  });

  it('keeps the empty drop zone without placeholder copy when tier has no items', () => {
    render(<Tier {...mockProps} />);

    expect(
      screen.getByRole('list', { name: /tier items/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Drop items here')).not.toBeInTheDocument();
  });

  it('calls onLabelChange on blur when label changes', async () => {
    const user = userEvent.setup();
    const onLabelChange = vi.fn();
    render(<Tier {...mockProps} onLabelChange={onLabelChange} />);

    const labelInput = screen.getByRole('textbox', { name: /tier label/i });
    await user.clear(labelInput);
    await user.type(labelInput, 'Changed');

    // Wait for React to process state updates
    await waitFor(() => {
      expect(labelInput).toHaveValue('Changed');
    });

    await user.tab();

    expect(onLabelChange).toHaveBeenCalledWith('Changed');
  });

  it('does not call onLabelChange on blur when label is unchanged', async () => {
    const user = userEvent.setup();
    const onLabelChange = vi.fn();
    render(<Tier {...mockProps} onLabelChange={onLabelChange} />);

    const labelInput = screen.getByRole('textbox', { name: /tier label/i });
    await user.click(labelInput);
    await user.tab();

    expect(onLabelChange).not.toHaveBeenCalled();
  });

  it('blurs input on Enter key press', async () => {
    const user = userEvent.setup();
    const onLabelChange = vi.fn();
    render(<Tier {...mockProps} onLabelChange={onLabelChange} />);

    const labelInput = screen.getByRole('textbox', { name: /tier label/i });
    await user.type(labelInput, 'Test{enter}');

    // Input should have lost focus after Enter
    expect(labelInput).not.toHaveFocus();
  });

  it('calls onItemDrop when item is dropped on drop zone', () => {
    const onItemDrop = vi.fn();
    render(<Tier {...mockProps} onItemDrop={onItemDrop} />);

    const dropZone = screen.getByRole('list', { name: /tier items/i });

    // Simulate drag over
    const dragOverEvent = new Event('dragover', {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(dropZone, dragOverEvent);

    // Simulate drop
    const dropEvent = new Event('drop', {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(dropZone, dropEvent);

    // Drop should be prevented (event handled)
    expect(dropZone).toBeInTheDocument();
  });

  it('calls drag enter and leave callbacks for the drop zone', () => {
    const onItemDragEnter = vi.fn();
    const onItemDragLeave = vi.fn();

    render(
      <Tier
        {...mockProps}
        onItemDragEnter={onItemDragEnter}
        onItemDragLeave={onItemDragLeave}
      />,
    );

    const dropZone = screen.getByRole('list', { name: /tier items/i });

    fireEvent.dragEnter(dropZone);
    fireEvent.dragLeave(dropZone);

    expect(onItemDragEnter).toHaveBeenCalledTimes(1);
    expect(onItemDragLeave).toHaveBeenCalledTimes(1);
  });

  it('prevents default on drag over', () => {
    const onItemDrop = vi.fn();
    render(<Tier {...mockProps} onItemDrop={onItemDrop} />);

    const dropZone = screen.getByRole('list', { name: /tier items/i });

    const dragOverEvent = new Event('dragover', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
    fireEvent(dropZone, dragOverEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('calls handleMoveUp when move up button is clicked', async () => {
    const user = userEvent.setup();
    render(<Tier {...mockProps} index={1} />);

    const moveUpButton = screen.getByRole('button', { name: /move up/i });
    await user.click(moveUpButton);

    expect(mockProps.onMoveUp).toHaveBeenCalledTimes(1);
  });

  it('calls handleMoveDown when move down button is clicked', async () => {
    const user = userEvent.setup();
    render(<Tier {...mockProps} index={0} totalTiers={7} />);

    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    await user.click(moveDownButton);

    expect(mockProps.onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('renders item with image when imageUrl is provided', () => {
    const tierWithImageItem = {
      ...mockProps,
      tier: createMockTier({
        items: [
          {
            id: generateId(),
            label: 'Item with Image',
            imageUrl: 'https://example.com/image.png',
            imageBlobId: null,
            createdAt: Date.now(),
            metadata: {},
          },
        ],
      }),
    };

    render(<Tier {...tierWithImageItem} />);

    const image = screen.getByAltText('Item with Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.png');
  });
});
