/**
 * Export utility for generating PNG images from tier list canvas.
 * @packageDocumentation
 */

import html2canvas from 'html2canvas';

/**
 * Export options for PNG generation.
 */
export interface ExportOptions {
  /** Output format (always 'png' for this implementation). */
  format: 'png';
  /** Scale factor for retina displays (default: 2). */
  scale?: number;
  /** Minimum width in pixels (default: 1080). */
  minWidth?: number;
  /** Background color (default: from theme). */
  backgroundColor?: string;
  /** File name for download (default: tier list name). */
  fileName?: string;
}

/**
 * Result of an export operation.
 */
export interface ExportResult {
  /** Whether export was successful. */
  success: boolean;
  /** Generated PNG blob (if successful). */
  blob?: Blob;
  /** Download URL (if successful). */
  url?: string;
  /** Error message (if failed). */
  error?: string;
  /** Exported image width in pixels. */
  width: number;
  /** Exported image height in pixels. */
  height: number;
}

/**
 * Standardized error messages for export failures.
 */
export const EXPORT_ERRORS = {
  /** Container element not found. */
  NO_CONTAINER: 'Tier list container not found',
  /** Export failed during rendering. */
  RENDER_FAILED: 'Export failed during rendering',
  /** Image generation failed. */
  IMAGE_GENERATION_FAILED: 'Failed to generate image',
  /** Download failed. */
  DOWNLOAD_FAILED: 'Failed to download image',
  /** Browser not supported. */
  BROWSER_NOT_SUPPORTED: 'Browser does not support required features',
} as const;

/**
 * Minimum width for export (per requirements SC-006).
 */
const MIN_WIDTH = 1080;

/**
 * Default scale factor for retina displays.
 */
const DEFAULT_SCALE = 2;

/**
 * Exports a tier list container to a PNG image.
 *
 * Requirements:
 * - Enforces minimum 1080px width (SC-006)
 * - Uses 2x scale for retina displays
 * - Returns standardized error messages
 * - Logs failures for later retrieval
 *
 * @param container - HTML element containing the tier list.
 * @param options - Export configuration options.
 * @returns Export result with blob/URL or error message.
 */
export async function exportTierListToPng(
  container: HTMLDivElement,
  options?: ExportOptions,
): Promise<ExportResult> {
  const {
    format = 'png',
    scale = DEFAULT_SCALE,
    minWidth = MIN_WIDTH,
    backgroundColor = '#ffffff',
    fileName,
  } = options ?? {};

  // Validate container
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!container) {
    return {
      success: false,
      error: EXPORT_ERRORS.NO_CONTAINER,
      width: 0,
      height: 0,
    };
  }

  try {
    // Calculate scale to ensure minimum width
    const rect = container.getBoundingClientRect();
    const calculatedScale = Math.max(scale, minWidth / rect.width);

    // Render to canvas using html2canvas
    const canvas = await html2canvas(container, {
      backgroundColor,
      scale: calculatedScale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 0,
      ignoreElements: (element) => {
        // Ignore elements that shouldn't be in export
        return element.hasAttribute('data-export-ignore');
      },
    });

    // Validate canvas dimensions
    if (canvas.width < minWidth) {
      return {
        success: false,
        error: EXPORT_ERRORS.IMAGE_GENERATION_FAILED,
        width: canvas.width,
        height: canvas.height,
      };
    }

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, `image/${format}`);
    });

    if (!blob) {
      return {
        success: false,
        error: EXPORT_ERRORS.IMAGE_GENERATION_FAILED,
        width: canvas.width,
        height: canvas.height,
      };
    }

    // Create download URL
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName ?? 'tier-list'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      blob,
      url,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    const errorObj = error as Error & { name?: string };

    // Log failure for later retrieval
    await logExportFailure(errorObj);

    return {
      success: false,
      /* v8 ignore next */
      error: errorObj.message || EXPORT_ERRORS.RENDER_FAILED,
      width: 0,
      height: 0,
    };
  }
}

/**
 * Logs export failures to IndexedDB for later retrieval.
 * This is a non-blocking operation that doesn't affect user experience.
 *
 * @param error - The error that occurred during export.
 */
export async function logExportFailure(error: Error): Promise<void> {
  try {
    const db = await import('idb');
    const database = await db.openDB('TierListDB', 1);
    await database.put('metadata', {
      key: `export-failure-${String(Date.now())}`,
      value: {
        error: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });
  } catch {
    // Silently fail - logging itself is not critical
  }
}

/**
 * Validates that the browser supports required export features.
 * @returns True if export is supported, false otherwise.
 */
export function isExportSupported(): boolean {
  // Check for canvas support
  const canvas = document.createElement('canvas');
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!canvas.getContext) {
    return false;
  }

  // Check for blob support
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!canvas.toBlob) {
    return false;
  }

  // Check for download attribute support
  if (!('download' in document.createElement('a'))) {
    return false;
  }

  return true;
}
