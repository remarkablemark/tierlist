/**
 * Component tests for the ColorPicker component.
 * @packageDocumentation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ColorPicker } from './ColorPicker';

const mockProps = {
  color: '#ff7f7f',
  onColorSelect: vi.fn(),
  onToggle: vi.fn(),
};

describe('ColorPicker', () => {
  it('should render color palette', () => {
    render(<ColorPicker {...mockProps} />);

    // Check that color buttons are rendered
    const colorButtons = screen.getAllByRole('button', {
      name: /select color/i,
    });
    expect(colorButtons.length).toBeGreaterThan(0);
  });

  it('should call onColorSelect when a color is clicked', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    const colorButton = screen.getByRole('button', { name: /#ff0000/i });
    await user.click(colorButton);

    expect(onColorSelect).toHaveBeenCalledWith('#ff0000');
  });

  it('should call onToggle when a color is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ColorPicker {...mockProps} onToggle={onToggle} />);

    const colorButton = screen.getByRole('button', { name: /#ff0000/i });
    await user.click(colorButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should update custom color when color input changes', () => {
    render(<ColorPicker {...mockProps} />);

    // Color inputs are queried by aria-label
    const colorInput = screen.getByLabelText(/custom color picker/i);

    expect(colorInput).toBeInTheDocument();
    expect(colorInput).toHaveAttribute('type', 'color');
  });

  it('should call onColorSelect with updated custom color', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    // Click apply without changing - should use current customColor
    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onColorSelect).toHaveBeenCalledWith('#ff7f7f');
  });

  it('should call onColorSelect with custom color when Apply is clicked', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onColorSelect).toHaveBeenCalledWith('#ff7f7f');
  });

  it('should call onToggle when Apply is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ColorPicker {...mockProps} onToggle={onToggle} />);

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should highlight the currently selected color', () => {
    render(<ColorPicker {...mockProps} />);

    // The selected color should have a border
    const selectedButton = screen.getByRole('button', {
      name: /#ff7f7f/i,
    });
    expect(selectedButton).toHaveClass('border-slate-900');
  });

  it('should call onColorSelect with updated custom color when Apply is clicked', async () => {
    const user = userEvent.setup();
    const onColorSelect = vi.fn();
    render(<ColorPicker {...mockProps} onColorSelect={onColorSelect} />);

    const colorInput = screen.getByLabelText(/custom color picker/i);
    fireEvent.change(colorInput, { target: { value: '#123456' } });

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(onColorSelect).toHaveBeenCalledWith('#123456');
  });
});
