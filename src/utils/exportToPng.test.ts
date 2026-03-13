/**
 * Tests for the exportToPng utility.
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Mocks cause unsafe assignments */

import {
  EXPORT_ERRORS,
  type ExportOptions,
  exportTierListToPng,
  isExportSupported,
} from './exportToPng';

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

// Mock idb
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    put: vi.fn(),
  }),
}));

import { default as html2canvas } from 'html2canvas';

describe('exportTierListToPng', () => {
  const mockContainer = document.createElement('div');
  const mockCanvas = document.createElement('canvas');
  const mockBlob = new Blob(['test'], { type: 'image/png' });
  const mockUrl = 'blob:test-url';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock canvas
    mockCanvas.width = 1920;
    mockCanvas.height = 1080;
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas);

    // Mock toBlob with proper typing
    const toBlobMock = vi.fn(((callback: BlobCallback) => {
      callback(mockBlob);
    }) as unknown as HTMLCanvasElement['toBlob']);
    mockCanvas.toBlob = toBlobMock;

    // Mock URL.createObjectURL
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);

    // Mock document.createElement for link
    const mockLink = document.createElement('a');
    const clickMock = vi.fn(() => {
      /* v8 ignore next */
    });
    mockLink.click = clickMock;
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

    // Mock body.appendChild and removeChild
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      <T extends Node>(child: T): T => child,
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      <T extends Node>(child: T): T => child,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports successfully with default options', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 960,
      height: 540,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 540,
      toJSON: vi.fn(),
    });

    const result = await exportTierListToPng(mockContainer);

    expect(result.success).toBe(true);
    expect(result.blob).toBeDefined();
    expect(result.url).toBe(mockUrl);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);

    expect(html2canvas).toHaveBeenCalledWith(mockContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 0,
      ignoreElements: expect.any(Function),
    });
  });

  it('uses custom options when provided', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 960,
      height: 540,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 540,
      toJSON: vi.fn(),
    });

    const options: ExportOptions = {
      format: 'png',
      scale: 3,
      minWidth: 1200,
      backgroundColor: '#000000',
      fileName: 'custom-name',
    };

    await exportTierListToPng(mockContainer, options);

    expect(html2canvas).toHaveBeenCalledWith(mockContainer, {
      backgroundColor: '#000000',
      scale: 3,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 0,
      ignoreElements: expect.any(Function),
    });
  });

  it('calculates scale to ensure minimum width', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 500,
      bottom: 300,
      toJSON: vi.fn(),
    });

    await exportTierListToPng(mockContainer);

    // Should use scale that ensures minWidth (1080 / 500 = 2.16)
    const callArgs = vi.mocked(html2canvas).mock.calls[0]?.[1];
    expect(callArgs?.scale).toBeGreaterThan(2);
  });

  it('returns error when container is not provided', async () => {
    const result = await exportTierListToPng(null as unknown as HTMLDivElement);

    expect(result.success).toBe(false);
    expect(result.error).toBe(EXPORT_ERRORS.NO_CONTAINER);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('returns error when canvas width is less than minWidth', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 960,
      height: 540,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 540,
      toJSON: vi.fn(),
    });

    // Mock canvas with width less than minWidth (1080)
    mockCanvas.width = 500;
    mockCanvas.height = 300;
    vi.mocked(html2canvas).mockResolvedValue(mockCanvas);

    const result = await exportTierListToPng(mockContainer);

    expect(result.success).toBe(false);
    expect(result.error).toBe(EXPORT_ERRORS.IMAGE_GENERATION_FAILED);
    expect(result.width).toBe(500);
    expect(result.height).toBe(300);
  });

  it('returns error when blob generation fails', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 960,
      height: 540,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 540,
      toJSON: vi.fn(),
    });

    // Mock toBlob to return null with proper typing
    const toBlobMock = vi.fn(((callback: BlobCallback) => {
      callback(null);
    }) as unknown as HTMLCanvasElement['toBlob']);
    mockCanvas.toBlob = toBlobMock;

    const result = await exportTierListToPng(mockContainer);

    expect(result.success).toBe(false);
    expect(result.error).toBe(EXPORT_ERRORS.IMAGE_GENERATION_FAILED);
  });

  it('returns error when html2canvas throws', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 960,
      height: 540,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 540,
      toJSON: vi.fn(),
    });

    vi.mocked(html2canvas).mockRejectedValue(new Error('Render failed'));

    const result = await exportTierListToPng(mockContainer);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Render failed');
  });

  it('triggers download with correct filename', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 960,
      height: 540,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 540,
      toJSON: vi.fn(),
    });

    const mockLink = document.createElement('a');
    const clickMock = vi.fn(() => {
      /* v8 ignore next */
    });
    mockLink.click = clickMock;

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink);

    await exportTierListToPng(mockContainer, {
      format: 'png',
      fileName: 'my-tier-list',
    });

    expect(mockLink.download).toBe('my-tier-list.png');
    expect(clickMock).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('ignores elements with data-export-ignore attribute', async () => {
    mockContainer.getBoundingClientRect = () => ({
      width: 960,
      height: 540,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 540,
      toJSON: vi.fn(),
    });

    await exportTierListToPng(mockContainer);

    const callArgs = vi.mocked(html2canvas).mock.calls[0]?.[1];
    const ignoreElements = callArgs?.ignoreElements;

    expect(ignoreElements).toBeDefined();

    if (ignoreElements) {
      const elementWithAttr = document.createElement('div');
      elementWithAttr.setAttribute('data-export-ignore', 'true');

      // Element with data-export-ignore should be ignored
      expect(ignoreElements(elementWithAttr)).toBe(true);
    }
  });
});

describe('isExportSupported', () => {
  it('returns true when all features are supported', () => {
    expect(isExportSupported()).toBe(true);
  });

  it('returns false when canvas getContext is not supported', () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const originalCreateElement = document.createElement.bind(document);

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          // Mock canvas without getContext
          return {
            getContext: undefined,
            toBlob: vi.fn(),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tagName);
      });

    expect(isExportSupported()).toBe(false);

    createElementSpy.mockRestore();
  });

  it('returns false when canvas toBlob is not supported', () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const originalCreateElement = document.createElement.bind(document);

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          // Mock canvas without toBlob
          return {
            getContext: vi.fn(),
            toBlob: undefined,
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tagName);
      });

    expect(isExportSupported()).toBe(false);

    createElementSpy.mockRestore();
  });

  it('returns false when download attribute is not supported', () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const originalCreateElement = document.createElement.bind(document);

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName) => {
        if (tagName === 'a') {
          // Mock anchor without download attribute
          // The 'in' operator checks prototype chain, so we need to make it not exist
          const mockAnchor = Object.create(null) as HTMLAnchorElement;
          return mockAnchor;
        }
        return originalCreateElement(tagName);
      });

    expect(isExportSupported()).toBe(false);

    createElementSpy.mockRestore();
  });
});
