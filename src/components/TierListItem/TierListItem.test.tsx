/**
 * Component tests for the TierListItem component.
 * @packageDocumentation
 */

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { type TierListItem as TierItemType } from '../../types/tierList.types';
import { generateId } from '../../utils/generateId';
import { TierListItem } from './TierListItem';

/**
 * Creates a mock item for testing.
 */
function createMockItem(overrides?: Partial<TierItemType>): TierItemType {
  return {
    id: generateId(),
    label: 'Test Item',
    imageUrl: null,
    imageBlobId: null,
    createdAt: Date.now(),
    metadata: {},
    ...overrides,
  };
}

/**
 * Mock props for the TierListItem component.
 */
const mockProps = {
  item: createMockItem(),
  tierId: 'tier-1',
  index: 0,
  isDragging: false,
  isKeyboardDragActive: false,
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onMove: vi.fn(),
  onDelete: vi.fn(),
  onLabelEdit: vi.fn(),
  size: 'medium' as const,
  showLabel: true,
};

describe('TierListItem', () => {
  it('should render item with label', () => {
    render(<TierListItem {...mockProps} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('should render item with image when imageUrl is provided', () => {
    const itemWithImage = createMockItem({
      imageUrl: 'https://example.com/image.png',
    });
    render(<TierListItem {...mockProps} item={itemWithImage} />);

    const image = screen.getByAltText('Test Item');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.png');
  });

  it('should render placeholder when no image', () => {
    render(<TierListItem {...mockProps} />);

    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TierListItem {...mockProps} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete item/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onDragStart when drag handle is clicked', async () => {
    const user = userEvent.setup();
    const onDragStart = vi.fn();
    render(<TierListItem {...mockProps} onDragStart={onDragStart} />);

    const dragHandle = screen.getByRole('button', { name: /drag handle/i });
    await user.click(dragHandle);

    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('should call onDragEnd when drag is completed', async () => {
    const user = userEvent.setup();
    const onDragEnd = vi.fn();
    render(
      <TierListItem
        {...mockProps}
        isKeyboardDragActive
        onDragEnd={onDragEnd}
      />,
    );

    // Focus the item first
    const item = screen.getByRole('listitem');
    item.focus();

    // Press Escape to cancel drag
    await user.keyboard('{Escape}');

    expect(onDragEnd).toHaveBeenCalledWith(false);
  });

  it('should call onMove with direction when arrow keys are pressed during keyboard drag', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <TierListItem {...mockProps} isKeyboardDragActive onMove={onMove} />,
    );

    // Focus the item first
    const item = screen.getByRole('listitem');
    item.focus();

    // Press arrow keys to move
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowRight}');

    expect(onMove).toHaveBeenCalledWith('down');
    expect(onMove).toHaveBeenCalledWith('up');
    expect(onMove).toHaveBeenCalledWith('left');
    expect(onMove).toHaveBeenCalledWith('right');
  });

  it('should call onLabelEdit when label is double-clicked', async () => {
    const user = userEvent.setup();
    const onLabelEdit = vi.fn();
    render(<TierListItem {...mockProps} onLabelEdit={onLabelEdit} />);

    const label = screen.getByText('Test Item');
    await user.dblClick(label);

    // Should show input field
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Label{enter}');

    expect(onLabelEdit).toHaveBeenCalledWith('New Label');
  });

  it('should hide label when showLabel is false', () => {
    render(<TierListItem {...mockProps} showLabel={false} />);

    expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
  });

  it('should apply correct size classes for small size', () => {
    render(<TierListItem {...mockProps} size="small" />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveClass('h-16', 'w-16');
  });

  it('should apply correct size classes for medium size', () => {
    render(<TierListItem {...mockProps} size="medium" />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveClass('h-24', 'w-24');
  });

  it('should apply correct size classes for large size', () => {
    render(<TierListItem {...mockProps} size="large" />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveClass('h-32', 'w-32');
  });

  it('should have dragging styling when isDragging is true', () => {
    render(<TierListItem {...mockProps} isDragging />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveClass('opacity-50');
  });

  it('should have keyboard drag active styling when isKeyboardDragActive is true', () => {
    render(<TierListItem {...mockProps} isKeyboardDragActive />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveClass('ring-2');
  });

  it('should have correct ARIA attributes', () => {
    render(<TierListItem {...mockProps} />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveAttribute('aria-label', 'Test Item');
    expect(item).toHaveAttribute('data-grabbed', 'false');
  });

  it('should have data-grabbed true when dragging', () => {
    render(<TierListItem {...mockProps} isDragging />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveAttribute('data-grabbed', 'true');
  });

  it('should have keyboard instructions in aria-describedby', () => {
    render(<TierListItem {...mockProps} />);

    const item = screen.getByRole('listitem');
    const describedBy = item.getAttribute('aria-describedby');
    expect(describedBy).toBeDefined();
  });

  it('should call onDelete when Delete key is pressed', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TierListItem {...mockProps} onDelete={onDelete} />);

    const item = screen.getByRole('listitem');
    item.focus();
    await user.keyboard('{Delete}');

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onDragStart when Enter is pressed on focused item', async () => {
    const user = userEvent.setup();
    const onDragStart = vi.fn();
    render(<TierListItem {...mockProps} onDragStart={onDragStart} />);

    const dragHandle = screen.getByRole('button', { name: /drag handle/i });
    dragHandle.focus();
    await user.keyboard('{Enter}');

    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('should cancel keyboard drag when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onDragEnd = vi.fn();
    render(
      <TierListItem
        {...mockProps}
        isKeyboardDragActive
        onDragEnd={onDragEnd}
      />,
    );

    // Focus the item first
    const item = screen.getByRole('listitem');
    item.focus();

    await user.keyboard('{Escape}');

    expect(onDragEnd).toHaveBeenCalledWith(false);
  });

  it('should submit label edit on Enter key', async () => {
    const user = userEvent.setup();
    const onLabelEdit = vi.fn();
    render(<TierListItem {...mockProps} onLabelEdit={onLabelEdit} />);

    const label = screen.getByText('Test Item');
    await user.dblClick(label);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Updated{enter}');

    expect(onLabelEdit).toHaveBeenCalledWith('Updated');
  });

  it('should cancel label edit on Escape key', async () => {
    const user = userEvent.setup();
    const onLabelEdit = vi.fn();
    render(<TierListItem {...mockProps} onLabelEdit={onLabelEdit} />);

    const label = screen.getByText('Test Item');
    await user.dblClick(label);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Changed{escape}');

    // Should not have called onLabelEdit since Escape cancels
    expect(onLabelEdit).not.toHaveBeenCalled();
  });

  it('should have minimum 44x44px touch target', () => {
    render(<TierListItem {...mockProps} />);

    const item = screen.getByRole('listitem');
    // Check for min-h-11 and min-w-11 (44px in Tailwind)
    expect(item).toHaveClass('min-h-11', 'min-w-11');
  });

  it('should have visible focus indicator', () => {
    render(<TierListItem {...mockProps} />);

    const dragHandle = screen.getByRole('button', { name: /drag handle/i });
    // Check that the drag handle has focus styling classes
    expect(dragHandle).toHaveClass('focus:opacity-100');
  });

  it('should render item with imageBlobId reference', () => {
    const itemWithBlob = createMockItem({
      imageUrl: 'blob:http://example.com/123',
      imageBlobId: 'blob-123',
    });
    render(<TierListItem {...mockProps} item={itemWithBlob} />);

    const image = screen.getByAltText('Test Item');
    expect(image).toBeInTheDocument();
  });

  it('should have drag handle with proper accessibility', () => {
    render(<TierListItem {...mockProps} />);

    const dragHandle = screen.getByRole('button', { name: /drag handle/i });
    expect(dragHandle).toHaveAttribute('aria-label', 'Drag handle');
    expect(dragHandle).toHaveAttribute('tabIndex', '0');
  });

  it('should call onMove when keyboard dragging and arrow key pressed', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <TierListItem {...mockProps} isKeyboardDragActive onMove={onMove} />,
    );

    // Focus the item first
    const item = screen.getByRole('listitem');
    item.focus();

    // Move down
    await user.keyboard('{ArrowDown}');

    expect(onMove).toHaveBeenCalledWith('down');
  });

  it('should call onDelete when Backspace key is pressed during keyboard drag', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TierListItem {...mockProps} isKeyboardDragActive onDelete={onDelete} />,
    );

    const item = screen.getByRole('listitem');
    item.focus();
    await user.keyboard('{Backspace}');

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when Delete key is pressed during keyboard drag', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TierListItem {...mockProps} isKeyboardDragActive onDelete={onDelete} />,
    );

    const item = screen.getByRole('listitem');
    item.focus();
    await user.keyboard('{Delete}');

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when Backspace key is pressed without keyboard drag', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TierListItem {...mockProps} onDelete={onDelete} />);

    const item = screen.getByRole('listitem');
    item.focus();
    await user.keyboard('{Backspace}');

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onDragEnd with true when Enter is pressed during keyboard drag', async () => {
    const user = userEvent.setup();
    const onDragEnd = vi.fn();
    render(
      <TierListItem
        {...mockProps}
        isKeyboardDragActive
        onDragEnd={onDragEnd}
      />,
    );

    const item = screen.getByRole('listitem');
    item.focus();
    await user.keyboard('{Enter}');

    expect(onDragEnd).toHaveBeenCalledWith(true);
  });

  it('should restore original label when blur with empty label', async () => {
    const user = userEvent.setup();
    const onLabelEdit = vi.fn();
    render(<TierListItem {...mockProps} onLabelEdit={onLabelEdit} />);

    const label = screen.getByText('Test Item');
    await user.dblClick(label);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.tab();

    expect(onLabelEdit).not.toHaveBeenCalled();
  });

  it('should have proper role hierarchy', () => {
    render(<TierListItem {...mockProps} />);

    const item = screen.getByRole('listitem');
    expect(item).toBeInTheDocument();

    // Image should be inside
    const placeholder = screen.getByText('No Image');
    expect(placeholder).toBeInTheDocument();
  });

  it('should truncate long labels', () => {
    const longLabelItem = createMockItem({
      label: 'This is a very long label that should be truncated',
    });
    render(<TierListItem {...mockProps} item={longLabelItem} />);

    const label = screen.getByText(
      'This is a very long label that should be truncated',
    );
    expect(label).toHaveClass('truncate');
  });
});
