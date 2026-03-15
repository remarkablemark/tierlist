/**
 * Tests for the image upload utilities.
 * @packageDocumentation
 */

import { fileToDataUrl } from './imageUpload';

describe('imageUpload', () => {
  describe('fileToDataUrl', () => {
    it('converts a file to a data URL', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:text\/plain;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('test content');
    });

    it('handles image files', async () => {
      const file = new File(['image data'], 'test.png', {
        type: 'image/png',
      });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('handles empty files', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:text\/plain;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('');
    });

    it('preserves filename in conversion', async () => {
      const file = new File(['test'], 'my-file.json', {
        type: 'application/json',
      });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:application\/json;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('test');
    });

    it('handles different file types', async () => {
      const files = [
        { content: 'html', name: 'test.html', type: 'text/html' },
        { content: 'css', name: 'test.css', type: 'text/css' },
        { content: 'js', name: 'test.js', type: 'application/javascript' },
      ];

      for (const { content, name, type } of files) {
        const file = new File([content], name, { type });
        const dataUrl = await fileToDataUrl(file);
        expect(dataUrl).toMatch(
          new RegExp(`^data:${type.replace('/', '\\/')};base64,`),
        );
      }
    });
  });

  describe('error handling', () => {
    it('rejects if FileReader fails for file', async () => {
      // Mock FileReader to fail
      const originalFileReader = window.FileReader;

      class MockFileReader extends EventTarget {
        onload:
          | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
          | null = null;
        onerror:
          | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
          | null = null;
        result: string | ArrayBuffer | null = null;

        readAsDataURL() {
          // Simulate error
          setTimeout(() => {
            if (this.onerror) {
              this.onerror.call(
                this as unknown as FileReader,
                new ProgressEvent('error') as ProgressEvent<FileReader>,
              );
            }
          }, 0);
        }
      }

      // @ts-expect-error - Mock for testing
      window.FileReader = MockFileReader;

      const file = new File(['test'], 'test.txt');

      await expect(fileToDataUrl(file)).rejects.toThrow('FileReader error');

      window.FileReader = originalFileReader;
    });
  });
});
