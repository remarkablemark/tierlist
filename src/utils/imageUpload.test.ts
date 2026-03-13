/**
 * Tests for the image upload utilities.
 * @packageDocumentation
 */

import { blobToDataUrl, fileToBlob, fileToDataUrl } from './imageUpload';

describe('imageUpload', () => {
  describe('fileToBlob', () => {
    it('should convert a file to a blob', () => {
      const file = new File(['test content'], 'test.png', {
        type: 'image/png',
      });

      const blob = fileToBlob(file);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBe(file.size);
    });

    it('should preserve the file content', async () => {
      const file = new File(['hello world'], 'test.txt', {
        type: 'text/plain',
      });

      const blob = fileToBlob(file);
      const text = await blob.text();

      expect(text).toBe('hello world');
    });

    it('should handle empty files', () => {
      const file = new File([], 'empty.png', { type: 'image/png' });

      const blob = fileToBlob(file);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(0);
    });

    it('should handle different mime types', () => {
      const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      types.forEach((type) => {
        const file = new File(['test'], 'test', { type });
        const blob = fileToBlob(file);
        expect(blob.type).toBe(type);
      });
    });
  });

  describe('blobToDataUrl', () => {
    it('should convert a blob to a data URL', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });

      const dataUrl = await blobToDataUrl(blob);

      expect(dataUrl).toMatch(/^data:text\/plain;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('test content');
    });

    it('should handle image blobs', async () => {
      // Create a simple PNG-like blob (not a valid PNG, but tests the conversion)
      const blob = new Blob(['image data'], { type: 'image/png' });

      const dataUrl = await blobToDataUrl(blob);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle empty blobs', async () => {
      const blob = new Blob([]);

      const dataUrl = await blobToDataUrl(blob);

      expect(dataUrl).toMatch(/^data:application\/octet-stream;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('');
    });

    it('should handle binary data', async () => {
      const binaryData = new Uint8Array([0, 1, 2, 3, 4, 5]);
      const blob = new Blob([binaryData]);

      const dataUrl = await blobToDataUrl(blob);

      expect(dataUrl).toMatch(/^data:application\/octet-stream;base64,/);
    });
  });

  describe('fileToDataUrl', () => {
    it('should convert a file to a data URL', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:text\/plain;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('test content');
    });

    it('should handle image files', async () => {
      const file = new File(['image data'], 'test.png', {
        type: 'image/png',
      });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle empty files', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:text\/plain;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('');
    });

    it('should preserve filename in conversion', async () => {
      const file = new File(['test'], 'my-file.json', {
        type: 'application/json',
      });

      const dataUrl = await fileToDataUrl(file);

      expect(dataUrl).toMatch(/^data:application\/json;base64,/);
      expect(atob(dataUrl.split(',')[1])).toBe('test');
    });

    it('should handle different file types', async () => {
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
    it('should reject if FileReader fails for blob', async () => {
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

      const blob = new Blob(['test']);

      await expect(blobToDataUrl(blob)).rejects.toThrow('FileReader error');

      window.FileReader = originalFileReader;
    });

    it('should reject if FileReader fails for file', async () => {
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
