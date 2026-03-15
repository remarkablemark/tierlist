/**
 * Image upload utilities for handling file uploads and conversions.
 * @packageDocumentation
 */

/**
 * Converts a File object to a data URL.
 * @param file - The file to convert.
 * @returns A promise that resolves to the data URL string.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('FileReader error'));
    };
    reader.readAsDataURL(file);
  });
}
