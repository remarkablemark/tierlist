/**
 * Tests for the TierListItem component.
 * @packageDocumentation
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type TierListItem as TierItemType } from '../../types/tierList.types';
import { TierListItem } from './TierListItem';

const createMockItem = (overrides?: Partial<TierItemType>): TierItemType => ({
  id: 'test-item-1',
  label: 'Test Item',
  imageUrl: null,
  imageBlobId: null,
  createdAt: Date.now(),
  metadata: {},
  ...overrides,
});

describe('TierListItem', () => {
  const defaultProps = {
    item: createMockItem(),
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

  describe('rendering', () => {
    it('renders with image and label', () => {
      const item = createMockItem({ label: 'My Test Item' });
      render(<TierListItem {...defaultProps} item={item} />);

      expect(screen.getByText('My Test Item')).toBeInTheDocument();
    });

    it('renders without label when showLabel is false', () => {
      const item = createMockItem({ label: 'My Test Item' });
      render(<TierListItem {...defaultProps} item={item} showLabel={false} />);

      expect(screen.queryByText('My Test Item')).not.toBeInTheDocument();
    });

    it('renders with image when imageUrl is provided', () => {
      const item = createMockItem({
        imageUrl: 'data:image/png;base64,test',
        label: 'Image Item',
      });
      render(<TierListItem {...defaultProps} item={item} />);

      const image = screen.getByAltText('Image Item');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'data:image/png;base64,test');
    });

    it('renders with placeholder when no image', () => {
      const item = createMockItem({ imageUrl: null });
      render(<TierListItem {...defaultProps} item={item} />);

      expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const { rerender } = render(
        <TierListItem {...defaultProps} size="small" />,
      );
      expect(screen.getByRole('listitem')).toHaveClass('h-16', 'w-16');

      rerender(<TierListItem {...defaultProps} size="medium" />);
      expect(screen.getByRole('listitem')).toHaveClass('h-24', 'w-24');

      rerender(<TierListItem {...defaultProps} size="large" />);
      expect(screen.getByRole('listitem')).toHaveClass('h-32', 'w-32');
    });

    it('applies dragging opacity class when isDragging is true', () => {
      const { rerender } = render(
        <TierListItem {...defaultProps} isDragging={false} />,
      );
      expect(screen.getByRole('listitem')).not.toHaveClass('opacity-50');

      rerender(<TierListItem {...defaultProps} isDragging={true} />);
      expect(screen.getByRole('listitem')).toHaveClass('opacity-50');
    });

    it('applies keyboard drag ring class when isKeyboardDragActive is true', () => {
      const { rerender } = render(
        <TierListItem {...defaultProps} isKeyboardDragActive={false} />,
      );
      expect(screen.getByRole('listitem')).not.toHaveClass(
        'ring-2',
        'ring-blue-500',
      );

      rerender(<TierListItem {...defaultProps} isKeyboardDragActive={true} />);
      expect(screen.getByRole('listitem')).toHaveClass(
        'ring-2',
        'ring-blue-500',
        'ring-inset',
      );
    });

    it('applies reorder target styling when isDropTarget is true', () => {
      const { rerender } = render(
        <TierListItem {...defaultProps} isDropTarget={false} />,
      );
      expect(screen.getByRole('listitem')).toHaveAttribute(
        'data-drop-target',
        'false',
      );

      rerender(<TierListItem {...defaultProps} isDropTarget={true} />);
      expect(screen.getByRole('listitem')).toHaveClass(
        'ring-2',
        'ring-amber-500',
      );
      expect(screen.getByRole('listitem')).toHaveAttribute(
        'data-drop-target',
        'true',
      );
    });

    it('adds group styling so controls can appear on hover and focus', () => {
      render(<TierListItem {...defaultProps} />);

      expect(screen.getByRole('listitem')).toHaveClass('group');
    });

    it('configures corner controls to appear when the item is hovered or focused', () => {
      render(<TierListItem {...defaultProps} />);

      expect(screen.getByLabelText('Drag handle')).toHaveClass(
        'opacity-0',
        'group-hover:opacity-100',
        'group-focus-within:opacity-100',
      );
      expect(screen.getByLabelText('Delete item')).toHaveClass(
        'opacity-0',
        'group-hover:opacity-100',
        'group-focus-within:opacity-100',
      );
    });
  });

  describe('accessibility', () => {
    it('has role="listitem"', () => {
      render(<TierListItem {...defaultProps} />);
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('has aria-label with item label', () => {
      const item = createMockItem({ label: 'Accessible Item' });
      render(<TierListItem {...defaultProps} item={item} />);

      expect(screen.getByRole('listitem')).toHaveAttribute(
        'aria-label',
        'Accessible Item',
      );
    });

    it('has aria-describedby pointing to instructions', () => {
      const item = createMockItem({ id: 'item-123' });
      render(<TierListItem {...defaultProps} item={item} />);

      const element = screen.getByRole('listitem');
      expect(element).toHaveAttribute(
        'aria-describedby',
        'item-instructions-item-123',
      );
    });

    it('has hidden instructions for screen readers', () => {
      const item = createMockItem({ id: 'item-456' });
      render(<TierListItem {...defaultProps} item={item} />);

      expect(
        screen.getByText(
          'Press Enter to pick up, arrow keys to move, Enter to drop, Escape to cancel',
        ),
      ).toHaveClass('sr-only');
    });

    it('is focusable with tabIndex={0}', () => {
      render(<TierListItem {...defaultProps} />);
      expect(screen.getByRole('listitem')).toHaveAttribute('tabIndex', '0');
    });

    it('has drag handle button with aria-label', () => {
      render(<TierListItem {...defaultProps} />);
      expect(screen.getByLabelText('Drag handle')).toBeInTheDocument();
    });

    it('has delete button with aria-label', () => {
      render(<TierListItem {...defaultProps} />);
      expect(screen.getByLabelText('Delete item')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onDragStart when drag handle is clicked', async () => {
      const user = userEvent.setup();
      const onDragStart = vi.fn();
      render(<TierListItem {...defaultProps} onDragStart={onDragStart} />);

      const dragHandle = screen.getByLabelText('Drag handle');
      await user.click(dragHandle);

      expect(onDragStart).toHaveBeenCalledWith('keyboard');
    });

    it('calls onDragStart when Enter is pressed before keyboard drag is active', async () => {
      const user = userEvent.setup();
      const onDragStart = vi.fn();
      render(<TierListItem {...defaultProps} onDragStart={onDragStart} />);

      const element = screen.getByRole('listitem');
      element.focus();
      await user.keyboard('{Enter}');

      expect(onDragStart).toHaveBeenCalledWith('keyboard');
    });

    it('calls onDragEnd with dropped=true when Enter is pressed during keyboard drag', async () => {
      const user = userEvent.setup();
      const onDragEnd = vi.fn();
      render(
        <TierListItem
          {...defaultProps}
          isKeyboardDragActive={true}
          onDragEnd={onDragEnd}
        />,
      );

      const element = screen.getByRole('listitem');
      element.focus();
      await user.keyboard('{Enter}');

      expect(onDragEnd).toHaveBeenCalledWith(true);
    });

    it('calls onDragEnd with dropped=false when Escape is pressed during keyboard drag', async () => {
      const user = userEvent.setup();
      const onDragEnd = vi.fn();
      render(
        <TierListItem
          {...defaultProps}
          isKeyboardDragActive={true}
          onDragEnd={onDragEnd}
        />,
      );

      const element = screen.getByRole('listitem');
      element.focus();
      await user.keyboard('{Escape}');

      expect(onDragEnd).toHaveBeenCalledWith(false);
    });

    it('calls onMove with direction when arrow keys are pressed during keyboard drag', async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();
      render(
        <TierListItem
          {...defaultProps}
          isKeyboardDragActive={true}
          onMove={onMove}
        />,
      );

      const element = screen.getByRole('listitem');
      element.focus();

      await user.keyboard('{ArrowUp}');
      expect(onMove).toHaveBeenCalledWith('up');

      await user.keyboard('{ArrowDown}');
      expect(onMove).toHaveBeenCalledWith('down');

      await user.keyboard('{ArrowLeft}');
      expect(onMove).toHaveBeenCalledWith('left');

      await user.keyboard('{ArrowRight}');
      expect(onMove).toHaveBeenCalledWith('right');
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<TierListItem {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByLabelText('Delete item');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when Delete key is pressed (not during keyboard drag)', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <TierListItem
          {...defaultProps}
          isKeyboardDragActive={false}
          onDelete={onDelete}
        />,
      );

      const element = screen.getByRole('listitem');
      element.focus();
      await user.keyboard('{Delete}');

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when Backspace is pressed (not during keyboard drag)', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <TierListItem
          {...defaultProps}
          isKeyboardDragActive={false}
          onDelete={onDelete}
        />,
      );

      const element = screen.getByRole('listitem');
      element.focus();
      await user.keyboard('{Backspace}');

      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('label editing', () => {
    it('enters edit mode on double-click of label', async () => {
      const user = userEvent.setup();
      render(<TierListItem {...defaultProps} />);

      const label = screen.getByText('Test Item');
      await user.dblClick(label);

      const input = screen.getByLabelText('Edit item label');
      expect(input).toBeInTheDocument();
    });

    it('calls onLabelEdit when input loses focus with changed label', async () => {
      const user = userEvent.setup();
      const onLabelEdit = vi.fn();
      render(<TierListItem {...defaultProps} onLabelEdit={onLabelEdit} />);

      const label = screen.getByText('Test Item');
      await user.dblClick(label);

      const input = screen.getByLabelText('Edit item label');
      await user.clear(input);
      await user.type(input, 'New Label');
      await user.tab();

      expect(onLabelEdit).toHaveBeenCalledWith('New Label');
    });

    it('does not call onLabelEdit when label is unchanged', async () => {
      const user = userEvent.setup();
      const onLabelEdit = vi.fn();
      render(<TierListItem {...defaultProps} onLabelEdit={onLabelEdit} />);

      const label = screen.getByText('Test Item');
      await user.dblClick(label);

      await user.tab();

      expect(onLabelEdit).not.toHaveBeenCalled();
    });

    it('does not call onLabelEdit when label is empty after trim', async () => {
      const user = userEvent.setup();
      const onLabelEdit = vi.fn();
      render(<TierListItem {...defaultProps} onLabelEdit={onLabelEdit} />);

      const label = screen.getByText('Test Item');
      await user.dblClick(label);

      const input = screen.getByLabelText('Edit item label');
      await user.clear(input);
      await user.type(input, '   ');
      await user.tab();

      expect(onLabelEdit).not.toHaveBeenCalled();
    });

    it('saves label on Enter key', async () => {
      const user = userEvent.setup();
      const onLabelEdit = vi.fn();
      render(<TierListItem {...defaultProps} onLabelEdit={onLabelEdit} />);

      const label = screen.getByText('Test Item');
      await user.dblClick(label);

      const input = screen.getByLabelText('Edit item label');
      await user.clear(input);
      await user.type(input, 'New Label{Enter}');

      expect(onLabelEdit).toHaveBeenCalledWith('New Label');
    });

    it('cancels edit on Escape key', async () => {
      const user = userEvent.setup();
      render(<TierListItem {...defaultProps} />);

      const label = screen.getByText('Test Item');
      await user.dblClick(label);

      const input = screen.getByLabelText('Edit item label');
      await user.clear(input);
      await user.type(input, 'New Label{Escape}');

      expect(
        screen.queryByLabelText('Edit item label'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });
});
