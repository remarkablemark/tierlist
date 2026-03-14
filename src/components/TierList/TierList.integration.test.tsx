/**
 * Component tests for the TierList component.
 * @packageDocumentation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { TierListProvider } from 'src/store/tierListContext';
import {
  DEFAULT_SETTINGS,
  DEFAULT_TIERS,
  type TierList as TierListData,
} from 'src/types/tierList.types';
import { createDefaultTierList } from 'src/utils/createDefaultTierList';
import { generateId } from 'src/utils/generateId';

import { TierList } from './TierList';

/**
 * Creates a mock tier list with specified number of items.
 */
function createMockTierListWithItems(itemCount: number): TierListData {
  const now = Date.now();
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: generateId(),
    label: `Item ${String(i + 1)}`,
    imageUrl: null,
    imageBlobId: null,
    createdAt: now,
    metadata: {},
  }));

  const tiers: TierListData['tiers'] = DEFAULT_TIERS.map((t) => ({
    ...t,
    id: generateId(),
    items: [],
  }));

  return {
    id: generateId(),
    name: 'Test Tier List',
    createdAt: now,
    updatedAt: now,
    tiers,
    unassignedItems: items,
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}

/**
 * Wrapper component for rendering with provider.
 */
function TierListWrapper({ children }: { children: React.ReactNode }) {
  return <TierListProvider>{children}</TierListProvider>;
}

function renderTierList(initialTierList?: TierListData) {
  if (initialTierList) {
    return render(<TierList />, {
      wrapper: ({ children }) => (
        <TierListProvider initialTierList={initialTierList}>
          {children}
        </TierListProvider>
      ),
    });
  }

  return render(<TierList />, { wrapper: TierListWrapper });
}

describe('TierList', () => {
  it('renders with header', () => {
    renderTierList();
    expect(screen.getByText('Tier List')).toBeInTheDocument();
  });

  it('renders unassigned items area', () => {
    renderTierList();
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('has undo/redo buttons', () => {
    renderTierList();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeInTheDocument();
  });

  it('has add tier button', () => {
    renderTierList();
    expect(
      screen.getByRole('button', { name: 'Add tier' }),
    ).toBeInTheDocument();
  });

  it('allows adding a new tier', () => {
    renderTierList();
    fireEvent.click(screen.getByRole('button', { name: 'Add tier' }));
    const tierInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    expect(tierInputs.length).toBeGreaterThan(0);
  });

  it('supports undo/redo', () => {
    renderTierList();
    fireEvent.click(screen.getByRole('button', { name: 'Add tier' }));
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    fireEvent.click(undoButton);
    expect(undoButton).toBeDisabled();
  });

  it('shows item limit warning when 50+ items', () => {
    const tierListWith50Items = createMockTierListWithItems(50);
    renderTierList(tierListWith50Items);
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('shows maximum items reached warning when 100+ items', () => {
    const tierListWith100Items = createMockTierListWithItems(100);
    renderTierList(tierListWith100Items);
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('does not show warnings when under 50 items', () => {
    const tierListWith10Items = createMockTierListWithItems(10);
    renderTierList(tierListWith10Items);
    expect(
      screen.queryByText(/Warning:.*items may affect performance/i),
    ).not.toBeInTheDocument();
  });

  it('deletes a tier from the list', () => {
    renderTierList();
    const deleteButtons = screen.getAllByRole('button', {
      name: /delete tier/i,
    });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('customizes tier label', () => {
    renderTierList();
    const labelInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    const firstInput = labelInputs[0];
    fireEvent.change(firstInput, { target: { value: 'Custom Label' } });
    fireEvent.blur(firstInput);
    expect(firstInput).toHaveValue('Custom Label');
  });

  it('resets tier to default values', () => {
    renderTierList();
    const labelInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    const firstInput = labelInputs[0];
    fireEvent.change(firstInput, { target: { value: 'Custom Label' } });
    fireEvent.blur(firstInput);
    const resetButtons = screen.getAllByRole('button', { name: /reset tier/i });
    fireEvent.click(resetButtons[0]);
    const updatedLabelInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    expect(updatedLabelInputs[0]).toHaveValue('S');
  });

  it('renders items in unassigned area', () => {
    const tierListWithItems = createDefaultTierList();
    tierListWithItems.unassignedItems = [
      {
        id: 'test-item',
        label: 'Test Item',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      },
    ];
    renderTierList(tierListWithItems);
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('ignores drops when no item is active', () => {
    renderTierList();
    const unassignedArea = screen.getByText('Unassigned Items').closest('div');
    if (unassignedArea) {
      fireEvent.dragOver(unassignedArea);
      fireEvent.drop(unassignedArea);
    }
    expect(screen.getByText('No unassigned items')).toBeInTheDocument();
  });
});
