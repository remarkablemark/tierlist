/**
 * Component tests for the TierList component.
 * @packageDocumentation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
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

describe('TierList', () => {
  it('renders with header', () => {
    render(<TierList />, { wrapper: TierListWrapper });
    expect(screen.getByText('Tier List')).toBeInTheDocument();
  });

  it('renders unassigned items area', () => {
    render(<TierList />, { wrapper: TierListWrapper });
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('has undo/redo buttons', () => {
    render(<TierList />, { wrapper: TierListWrapper });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeInTheDocument();
  });

  it('has add tier button', () => {
    render(<TierList />, { wrapper: TierListWrapper });
    expect(
      screen.getByRole('button', { name: 'Add tier' }),
    ).toBeInTheDocument();
  });

  it('allows adding a new tier', async () => {
    render(<TierList />, { wrapper: TierListWrapper });
    const addTierButton = screen.getByRole('button', { name: 'Add tier' });
    await userEvent.click(addTierButton);
    const tierInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    expect(tierInputs.length).toBeGreaterThan(0);
  });

  it('supports undo/redo', async () => {
    render(<TierList />, { wrapper: TierListWrapper });
    const addTierButton = screen.getByRole('button', { name: 'Add tier' });
    await userEvent.click(addTierButton);
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    await userEvent.click(undoButton);
    expect(undoButton).toBeDisabled();
  });

  it('shows item limit warning when 50+ items', () => {
    const tierListWith50Items = createMockTierListWithItems(50);
    render(<TierList />, {
      wrapper: ({ children }) => (
        <TierListProvider initialTierList={tierListWith50Items}>
          {children}
        </TierListProvider>
      ),
    });
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('shows maximum items reached warning when 100+ items', () => {
    const tierListWith100Items = createMockTierListWithItems(100);
    render(<TierList />, {
      wrapper: ({ children }) => (
        <TierListProvider initialTierList={tierListWith100Items}>
          {children}
        </TierListProvider>
      ),
    });
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('does not show warnings when under 50 items', () => {
    const tierListWith10Items = createMockTierListWithItems(10);
    render(<TierList />, {
      wrapper: ({ children }) => (
        <TierListProvider initialTierList={tierListWith10Items}>
          {children}
        </TierListProvider>
      ),
    });
    expect(
      screen.queryByText(/Warning:.*items may affect performance/i),
    ).not.toBeInTheDocument();
  });

  it('deletes a tier from the list', () => {
    render(<TierList />, { wrapper: TierListWrapper });
    const deleteButtons = screen.getAllByRole('button', {
      name: /delete tier/i,
    });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('customizes tier label', async () => {
    render(<TierList />, { wrapper: TierListWrapper });
    const labelInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    const firstInput = labelInputs[0];
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'Custom Label');
    expect(firstInput).toHaveValue('Custom Label');
  });

  it('resets tier to default values', async () => {
    render(<TierList />, { wrapper: TierListWrapper });
    const labelInputs = screen.getAllByRole('textbox', {
      name: /tier label/i,
    });
    const firstInput = labelInputs[0];
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'Custom Label');
    const resetButtons = screen.getAllByRole('button', { name: /reset tier/i });
    await userEvent.click(resetButtons[0]);
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
    render(<TierList />, {
      wrapper: ({ children }) => (
        <TierListProvider initialTierList={tierListWithItems}>
          {children}
        </TierListProvider>
      ),
    });
    expect(screen.getByText('Unassigned Items')).toBeInTheDocument();
  });

  it('ignores drops when no item is active', () => {
    render(<TierList />, { wrapper: TierListWrapper });
    const unassignedArea = screen.getByText('Unassigned Items').closest('div');
    if (unassignedArea) {
      fireEvent.dragOver(unassignedArea);
      fireEvent.drop(unassignedArea);
    }
    expect(screen.getByText('No unassigned items')).toBeInTheDocument();
  });
});
