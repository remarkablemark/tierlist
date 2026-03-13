/**
 * Component tests for the AddItemButton component.
 * @packageDocumentation
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { AddItemButton } from './AddItemButton';

describe('AddItemButton', () => {
  it('renders add item button', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    expect(
      screen.getByRole('button', { name: /add item/i }),
    ).toBeInTheDocument();
  });

  it('opens file picker when button is clicked', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    await user.click(button);

    // The hidden file input should be triggered
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toBeInTheDocument();
  });

  it('calls onFileSelect when files are selected', async () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const file = new File(['test content'], 'test-image.png', {
      type: 'image/png',
    });

    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith([file]);
    });
  });

  it('shows item count when items are present', () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={5}
        maxItems={100}
      />,
    );

    // Item count container should contain "5", "100", and "items"
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('100');
    expect(container.textContent).toContain('items');
  });

  it('shows warning message when item count >= 50', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={50}
        maxItems={100}
      />,
    );

    expect(
      screen.getByText(/warning: adding more items may affect performance/i),
    ).toBeInTheDocument();
  });

  it('does not show warning when item count < 50', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={25}
        maxItems={100}
      />,
    );

    expect(
      screen.queryByText(/warning: adding more items may affect performance/i),
    ).not.toBeInTheDocument();
  });

  it('is disabled when item count >= 100', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={100}
        maxItems={100}
      />,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toBeDisabled();
  });

  it('is enabled when item count < 100', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={99}
        maxItems={100}
      />,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toBeEnabled();
  });

  it('accepts only image files', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const fileInput = screen.getByTestId('file-input');
    expect((fileInput as HTMLInputElement).accept).toBe('image/*');
  });

  it('allows selecting multiple image files', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const fileInput = screen.getByTestId('file-input');
    expect((fileInput as HTMLInputElement).multiple).toBe(true);
  });

  it('shows maximum items reached message when disabled', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={100}
        maxItems={100}
      />,
    );

    expect(screen.getByText(/maximum 100 items reached/i)).toBeInTheDocument();
  });

  it('does not show maximum items message when under limit', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={50}
        maxItems={100}
      />,
    );

    expect(
      screen.queryByText(/maximum 100 items reached/i),
    ).not.toBeInTheDocument();
  });

  it('has proper ARIA labels', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toHaveAttribute('aria-label', 'Add item');
  });

  it('has proper aria-describedby when warning is shown', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={50}
        maxItems={100}
      />,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    const describedBy = button.getAttribute('aria-describedby');
    expect(describedBy).toBeDefined();
  });

  it('clears file input after selection', async () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const file = new File(['test content'], 'test-image.png', {
      type: 'image/png',
    });

    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith([file]);
    });

    // File input should be cleared after selection
    expect((fileInput as HTMLInputElement).value).toBe('');
  });

  it('handles multiple file selections sequentially', async () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const file1 = new File(['content1'], 'image1.png', { type: 'image/png' });
    const file2 = new File(['content2'], 'image2.png', { type: 'image/png' });

    const fileInput = screen.getByTestId('file-input');

    // First file
    fireEvent.change(fileInput, { target: { files: [file1] } });
    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith([file1]);
    });

    // Second file
    fireEvent.change(fileInput, { target: { files: [file2] } });
    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith([file2]);
    });
  });

  it('passes all selected files in a single callback', async () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const file1 = new File(['content1'], 'image1.png', { type: 'image/png' });
    const file2 = new File(['content2'], 'image2.png', { type: 'image/png' });

    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith([file1, file2]);
    });
  });

  it('shows correct item count format', () => {
    const onFileSelect = vi.fn();
    const { container, rerender } = render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    expect(container.textContent).toContain('0');
    expect(container.textContent).toContain('100');

    rerender(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={25}
        maxItems={100}
      />,
    );

    expect(container.textContent).toContain('25');
    expect(container.textContent).toContain('100');
  });

  it('has plus icon', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    // Check for plus icon (svg with path containing the plus shape)
    const icon = screen.getByTestId('plus-icon');
    expect(icon).toBeInTheDocument();
  });

  it('applies disabled styling when max items reached', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={100}
        maxItems={100}
      />,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    // Check for disabled attribute and styling classes
    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    );
  });

  it('applies warning styling when item count >= 50', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={50}
        maxItems={100}
      />,
    );

    const container = screen.getByTestId('add-item-container');
    expect(container).toHaveClass('border-yellow-500');
  });

  it('does not have warning styling when item count < 50', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={25}
        maxItems={100}
      />,
    );

    const container = screen.getByTestId('add-item-container');
    expect(container).not.toHaveClass('border-yellow-500');
  });

  it('has hidden file input', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveClass('hidden');
  });

  it('triggers file input click when button is clicked', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const button = screen.getByRole('button', { name: /add item/i });
    const fileInput = screen.getByTestId('file-input');

    const clickSpy = vi.spyOn(fileInput, 'click');
    await user.click(button);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('shows item count with custom maxItems', () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={10}
        maxItems={50}
      />,
    );

    expect(container.textContent).toContain('10');
    expect(container.textContent).toContain('50');
  });

  it('does not call onFileSelect when no file is selected', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('does not call onFileSelect when the file list is missing', () => {
    const onFileSelect = vi.fn();
    render(
      <AddItemButton
        onFileSelect={onFileSelect}
        itemCount={0}
        maxItems={100}
      />,
    );

    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: undefined } });

    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
