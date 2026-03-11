import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '.';

describe('App component', () => {
  it('renders without crashing', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /count is 0/i });
    expect(button).toBeInTheDocument();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('button click increments count', async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole('button', { name: /count is 0/i });

    await user.click(button);
    expect(button).toHaveTextContent('count is 1');

    await user.click(button);
    expect(button).toHaveTextContent('count is 2');
  });
});
