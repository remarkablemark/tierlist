/**
 * Tests for the SaveLoadControls component.
 * @packageDocumentation
 */

import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { type TierList } from '../../types/tierList.types';
import { createDefaultTierList } from '../../utils/createDefaultTierList';
import { generateId } from '../../utils/generateId';
import { SaveLoadControls } from './SaveLoadControls';
import { getStatusClassName } from './SaveLoadControls.utils';

/**
 * Creates a mock tier list for testing.
 */
function createMockTierList(overrides?: Partial<TierList>): TierList {
  return {
    ...createDefaultTierList(),
    ...overrides,
  };
}

/**
 * Mock props for the SaveLoadControls component.
 */
const mockProps = {
  autoSaveStatus: 'idle' as const,
  lastSavedAt: null,
  errorMessage: null,
  onCreateNew: vi.fn(),
  onLoad: vi.fn(),
  onDelete: vi.fn(),
  onSave: vi.fn(),
  savedTierLists: [],
  currentTierList: createMockTierList(),
};

describe('SaveLoadControls', () => {
  it('renders save status indicator', () => {
    render(<SaveLoadControls {...mockProps} />);

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SaveLoadControls {...mockProps} onSave={onSave} />);

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables save button when saving', () => {
    render(<SaveLoadControls {...mockProps} autoSaveStatus="saving" />);

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('shows saving status', () => {
    render(<SaveLoadControls {...mockProps} autoSaveStatus="saving" />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows saved status with timestamp', () => {
    const now = Date.now();
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus="saved"
        lastSavedAt={now}
      />,
    );

    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });

  it('shows error status', () => {
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus="error"
        errorMessage="Test error"
      />,
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });

  it('shows quota exceeded status', () => {
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus="quota-exceeded"
        errorMessage="Storage full"
      />,
    );

    expect(screen.getByText('Storage full: Storage full')).toBeInTheDocument();
  });

  it('opens load dropdown when load button is clicked', async () => {
    const user = userEvent.setup();
    render(<SaveLoadControls {...mockProps} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    expect(screen.getByText('Saved Tier Lists')).toBeInTheDocument();
  });

  it('shows new button in load dropdown', async () => {
    const user = userEvent.setup();
    render(<SaveLoadControls {...mockProps} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('calls onCreateNew when new button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateNew = vi.fn();
    render(<SaveLoadControls {...mockProps} onCreateNew={onCreateNew} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const newButton = screen.getByText('New');
    await user.click(newButton);

    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it('displays saved tier lists', async () => {
    const user = userEvent.setup();
    const savedTierLists = [
      {
        id: generateId(),
        name: 'Tier List 1',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
      {
        id: generateId(),
        name: 'Tier List 2',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
    ];

    render(<SaveLoadControls {...mockProps} savedTierLists={savedTierLists} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    expect(screen.getByText('Tier List 1')).toBeInTheDocument();
    expect(screen.getByText('Tier List 2')).toBeInTheDocument();
  });

  it('calls onLoad when selecting a tier list', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    const savedTierLists = [
      {
        id: generateId(),
        name: 'Tier List 1',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
    ];

    render(
      <SaveLoadControls
        {...mockProps}
        savedTierLists={savedTierLists}
        onLoad={onLoad}
      />,
    );

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const tierListItem = screen.getByText('Tier List 1');
    await user.click(tierListItem);

    expect(onLoad).toHaveBeenCalledWith(savedTierLists[0].id);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const savedTierLists = [
      {
        id: generateId(),
        name: 'Tier List 1',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
    ];

    render(
      <SaveLoadControls
        {...mockProps}
        savedTierLists={savedTierLists}
        onDelete={onDelete}
      />,
    );

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const deleteButton = screen.getByRole('button', {
      name: /delete tier list 1/i,
    });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(savedTierLists[0].id);
  });

  it('closes dropdown after selecting a tier list', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    const savedTierLists = [
      {
        id: generateId(),
        name: 'Tier List 1',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
    ];

    render(
      <SaveLoadControls
        {...mockProps}
        savedTierLists={savedTierLists}
        onLoad={onLoad}
      />,
    );

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const tierListItem = screen.getByText('Tier List 1');
    await user.click(tierListItem);

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('Saved Tier Lists')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown after creating new tier list', async () => {
    const user = userEvent.setup();
    const onCreateNew = vi.fn();
    render(<SaveLoadControls {...mockProps} onCreateNew={onCreateNew} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const newButton = screen.getByText('New');
    await user.click(newButton);

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('Saved Tier Lists')).not.toBeInTheDocument();
    });
  });

  it('shows "No saved tier lists" when list is empty', async () => {
    const user = userEvent.setup();
    render(<SaveLoadControls {...mockProps} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    expect(screen.getByText('No saved tier lists')).toBeInTheDocument();
  });

  it('truncates long tier list names', async () => {
    const user = userEvent.setup();
    const savedTierLists = [
      {
        id: generateId(),
        name: 'This is a very long tier list name that should be truncated',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
    ];

    render(<SaveLoadControls {...mockProps} savedTierLists={savedTierLists} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const longName = screen.getByText(
      'This is a very long tier list name that should be truncated',
    );
    expect(longName).toHaveClass('truncate');
  });

  it('has delete button for each saved tier list', async () => {
    const user = userEvent.setup();
    const savedTierLists = [
      {
        id: generateId(),
        name: 'Tier List 1',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
    ];

    render(<SaveLoadControls {...mockProps} savedTierLists={savedTierLists} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const deleteButton = screen.getByRole('button', {
      name: /delete tier list 1/i,
    });
    expect(deleteButton).toBeInTheDocument();
  });

  it('does not close dropdown when clicking delete button', async () => {
    const user = userEvent.setup();
    const savedTierLists = [
      {
        id: generateId(),
        name: 'Tier List 1',
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
    ];

    render(<SaveLoadControls {...mockProps} savedTierLists={savedTierLists} />);

    const loadButton = screen.getByText('Load');
    await user.click(loadButton);

    const deleteButton = screen.getByRole('button', {
      name: /delete tier list 1/i,
    });
    await user.click(deleteButton);

    // Dropdown should still be open
    expect(screen.getByText('Saved Tier Lists')).toBeInTheDocument();
  });

  it('does not show status message when status is idle', () => {
    render(<SaveLoadControls {...mockProps} autoSaveStatus="idle" />);

    // No status message should be displayed for idle status
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Storage full/)).not.toBeInTheDocument();
  });

  it('formats timestamp correctly when null', () => {
    // This tests the formatTimestamp function with null timestamp
    // When status is 'saved' but lastSavedAt is null, it should show "Saved "
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus="saved"
        lastSavedAt={null}
      />,
    );

    // Should show "Saved " with empty timestamp
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('handles unknown auto-save status with default case', () => {
    // This tests the default case in getStatusMessage switch
    // We need to pass an invalid status to trigger the default case
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus={undefined as unknown as 'idle'}
      />,
    );

    // No status message should be displayed for unknown status (default case)
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Storage full/)).not.toBeInTheDocument();
  });

  it('applies red text color for error status', () => {
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus="error"
        errorMessage="Test error"
      />,
    );

    // Find the status message span and verify it has the error class
    const errorMessage = screen.getByText('Error: Test error');
    expect(errorMessage).toHaveClass('text-red-600 dark:text-red-400');
  });

  it('applies red text color for quota-exceeded status', () => {
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus="quota-exceeded"
        errorMessage="Storage full"
      />,
    );

    // Find the status message span and verify it has the error class
    const errorMessage = screen.getByText('Storage full: Storage full');
    expect(errorMessage).toHaveClass('text-red-600 dark:text-red-400');
  });

  it('does not apply red text color for saving status', () => {
    render(<SaveLoadControls {...mockProps} autoSaveStatus="saving" />);

    // Find the status message span and verify it does NOT have the error class
    const savingMessage = screen.getByText('Saving...');
    expect(savingMessage).not.toHaveClass('text-red-600 dark:text-red-400');
  });

  it('does not apply red text color for saved status', () => {
    const now = Date.now();
    render(
      <SaveLoadControls
        {...mockProps}
        autoSaveStatus="saved"
        lastSavedAt={now}
      />,
    );

    // Find the status message span and verify it does NOT have the error class
    const savedMessage = screen.getByText(/Saved/);
    expect(savedMessage).not.toHaveClass('text-red-600 dark:text-red-400');
  });
});

describe('getStatusClassName', () => {
  it('returns error class for error status', () => {
    expect(getStatusClassName('error')).toBe('text-red-600 dark:text-red-400');
  });

  it('returns error class for quota-exceeded status', () => {
    expect(getStatusClassName('quota-exceeded')).toBe(
      'text-red-600 dark:text-red-400',
    );
  });

  it('returns empty string for saving status', () => {
    expect(getStatusClassName('saving')).toBe('');
  });

  it('returns empty string for saved status', () => {
    expect(getStatusClassName('saved')).toBe('');
  });

  it('returns empty string for idle status', () => {
    expect(getStatusClassName('idle')).toBe('');
  });
});
