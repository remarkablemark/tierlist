import { render, screen } from '@testing-library/react';

import { App } from './App';

describe('App component', () => {
  it('renders the tier list', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tier List' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /add tier/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Unassigned Items' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /add item/i }),
    ).toBeInTheDocument();
  });
});
