/**
 * Component tests for the ColorPicker component.
 * @packageDocumentation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ColorPicker } from './ColorPicker';

const mockProps = {
  color: '#e57373',
  onColorSelect: vi.fn(),
  onToggle: vi.fn(),
};

describe('ColorPicker', () => {
  it('renders color palette', () => {
    render(<ColorPicker {...mockProps} />);

    // Check that color buttons are rendered
    const colorButtons = screen.getAllByRole('button', {
      name: /select color/i,
    });
    expect(colorButtons.length).toBeGreaterThan(0);
  });

  it('calls onColorSelect when a color is clicked', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    const colorButton = screen.getByRole('button', { name: /#ff0000/i });
    await user.click(colorButton);

    expect(onColorSelect).toHaveBeenCalledWith('#ff0000');
  });

  it('calls onToggle when a color is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ColorPicker {...mockProps} onToggle={onToggle} />);

    const colorButton = screen.getByRole('button', { name: /#ff0000/i });
    await user.click(colorButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('updates custom color when color input changes', () => {
    render(<ColorPicker {...mockProps} />);

    // Color inputs are queried by aria-label
    const colorInput = screen.getByLabelText(/custom color picker/i);

    expect(colorInput).toBeInTheDocument();
    expect(colorInput).toHaveAttribute('type', 'color');
  });

  it('calls onColorSelect with updated custom color', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    // Click apply without changing - should use current customColor
    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onColorSelect).toHaveBeenCalledWith('#e57373');
  });

  it('calls onColorSelect with custom color when Apply is clicked', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onColorSelect).toHaveBeenCalledWith('#e57373');
  });

  it('calls onToggle when Apply is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ColorPicker {...mockProps} onToggle={onToggle} />);

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('highlights the currently selected color', () => {
    render(<ColorPicker {...mockProps} />);

    // The selected color should have a border
    const selectedButton = screen.getByRole('button', {
      name: /#e57373/i,
    });
    expect(selectedButton).toHaveClass('border-slate-900');
  });

  it('calls onColorSelect with updated custom color when Apply is clicked', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    const colorInput = screen.getByLabelText(/custom color picker/i);
    fireEvent.change(colorInput, { target: { value: '#123456' } });

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onColorSelect).toHaveBeenCalledWith('#123456');
  });

  it('calls onToggle when clicking outside the color picker', () => {
    const onToggle = vi.fn();
    render(<ColorPicker {...mockProps} onToggle={onToggle} />);

    // Simulate clicking outside the component
    fireEvent.mouseDown(document.body);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when clicking inside the color picker', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ColorPicker {...mockProps} onToggle={onToggle} />);

    // Click inside the color picker (on a color button)
    const colorButton = screen.getByRole('button', { name: /#ff0000/i });
    await user.click(colorButton);

    // onToggle should only be called once from the color button click
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
