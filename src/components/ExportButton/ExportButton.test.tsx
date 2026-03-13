/**
 * Tests for the ExportButton component.
 * @packageDocumentation
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExportButton } from './ExportButton';

describe('ExportButton', () => {
  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default state', () => {
    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export as png/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Export PNG');
    expect(button).not.toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ExportButton onExport={mockOnExport} isLoading />);

    const button = screen.getByRole('button', { name: /export as png/i });
    expect(button).toHaveTextContent('Exporting...');
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<ExportButton onExport={mockOnExport} disabled />);

    const button = screen.getByRole('button', { name: /export as png/i });
    expect(button).toBeDisabled();
  });

  it('calls onExport when clicked', async () => {
    const user = userEvent.setup();
    mockOnExport.mockResolvedValue(undefined);

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export as png/i });
    await user.click(button);

    expect(mockOnExport).toHaveBeenCalledTimes(1);
  });

  it('shows error message when export fails', async () => {
    const user = userEvent.setup();
    mockOnExport.mockRejectedValue(new Error('Export failed'));

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export as png/i });
    await user.click(button);

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Export failed');
    });
  });

  it('shows standardized error message when error has no message', async () => {
    const user = userEvent.setup();
    mockOnExport.mockRejectedValue(new Error());

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export as png/i });
    await user.click(button);

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent(
        'Export failed. Tier list may be too large.',
      );
    });
  });

  it('clears error when export succeeds after previous failure', async () => {
    const user = userEvent.setup();

    // First click fails
    mockOnExport.mockRejectedValueOnce(new Error('Export failed'));

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export as png/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Second click succeeds
    mockOnExport.mockResolvedValueOnce(undefined);
    await user.click(button);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export as png/i });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-label', 'Export as PNG');
  });

  it('applies Tailwind CSS classes for styling', () => {
    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: /export as png/i });
    expect(button).toHaveClass('bg-green-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('rounded-md');
  });
});
