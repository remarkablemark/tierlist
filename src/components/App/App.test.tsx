import { render, screen } from '@testing-library/react';

import { App } from '.';

describe('App component', () => {
  it('renders the tier list workspace', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /untitled tier list/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add tier/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /unassigned items/i }),
    ).toBeInTheDocument();
  });
});
