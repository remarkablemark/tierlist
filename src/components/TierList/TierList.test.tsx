/**
 * Provider-backed tests for the TierList component.
 * @packageDocumentation
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DEFAULT_SETTINGS, DEFAULT_TIERS } from 'src/constants/tierList';
import { TierListProvider } from 'src/store/tierListContext';
import { type TierList as TierListData } from 'src/types/tierList';
import { generateId } from 'src/utils/generateId';

import { TierList } from './TierList';

/**
 * Creates a tier list with a custom unassigned item count.
 */
function createMockTierListWithItems(itemCount: number): TierListData {
  const now = Date.now();
  const items = Array.from({ length: itemCount }, (_, index) => ({
    id: generateId(),
    label: `Item ${String(index + 1)}`,
    imageUrl: null,
    imageBlobId: null,
    createdAt: now,
    metadata: {},
  }));

  return {
    id: generateId(),
    name: 'Test Tier List',
    createdAt: now,
    updatedAt: now,
    tiers: DEFAULT_TIERS.map((tier) => ({
      ...tier,
      id: generateId(),
      items: [],
    })),
    unassignedItems: items,
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}

function renderTierList(initialTierList?: TierListData) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TierListProvider initialTierList={initialTierList}>
      {children}
    </TierListProvider>
  );

  return render(<TierList />, { wrapper });
}

describe('TierList', () => {
  it('renders the provider-backed shell', () => {
    renderTierList();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tier List' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /add item/i }),
    ).toBeInTheDocument();
  });

  it('updates a tier label through the real provider state', () => {
    renderTierList();

    const firstInput = screen.getAllByRole('textbox', {
      name: /tier label/i,
    })[0];

    fireEvent.change(firstInput, { target: { value: 'Custom Label' } });
    fireEvent.blur(firstInput);

    expect(firstInput).toHaveValue('Custom Label');
  });

  it('shows the performance warning at the threshold', () => {
    renderTierList(createMockTierListWithItems(50));

    expect(
      screen.getByText(/warning: adding more items may affect performance/i),
    ).toBeInTheDocument();
  });

  it('omits the performance warning below the threshold', () => {
    renderTierList(createMockTierListWithItems(10));

    expect(
      screen.queryByText(/warning: adding more items may affect performance/i),
    ).not.toBeInTheDocument();
  });
});
