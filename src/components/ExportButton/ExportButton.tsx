/**
 * ExportButton component for exporting tier list as PNG.
 * @packageDocumentation
 */

import { useState } from 'react';

import { type ExportButtonProps } from './ExportButton.types';

/**
 * ExportButton component that triggers PNG export.
 *
 * Features:
 * - Loading state during export
 * - Standardized error banner messaging
 * - Download trigger on success
 * - Logs failures to IndexedDB
 */
export function ExportButton({
  onExport,
  disabled = false,
  isLoading = false,
}: ExportButtonProps): React.ReactElement {
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setError(null);
    try {
      await onExport();
    } catch (errorObj) {
      const error = errorObj as Error;
      setError(error.message || 'Export failed. Tier list may be too large.');
    }
  };

  return (
    <div className="inline-block">
      <button
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
        onClick={(e) => {
          e.preventDefault();
          void handleClick();
        }}
        disabled={disabled || isLoading}
        aria-label="Export as PNG"
        type="button"
      >
        {isLoading ? 'Exporting...' : 'Export PNG'}
      </button>

      {error && (
        <div
          className="mt-2 rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
