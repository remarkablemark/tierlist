import { createRoot } from 'react-dom/client';

const mockRender = vi.fn();

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: mockRender,
  })),
}));

const mockCreateRoot = vi.mocked(createRoot);

beforeAll(() => {
  document.body.innerHTML = '<div id="root"></div>';
});

afterAll(() => {
  document.body.innerHTML = '';
});

describe('main entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates root and renders App', () => {
    return import('./main').then(() => {
      expect(mockCreateRoot).toHaveBeenCalledWith(
        document.getElementById('root'),
      );

      expect(mockRender).toHaveBeenCalled();
    });
  });
});
