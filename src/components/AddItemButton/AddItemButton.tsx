/**
 * AddItemButton component for uploading images to the tier list.
 * @packageDocumentation
 */

import { useRef } from 'react';

import { type AddItemButtonProps } from './AddItemButton.types';

/**
 * AddItemButton component that allows users to add items via file upload.
 */
export function AddItemButton({
  onFileSelect,
  itemCount,
  maxItems,
  disabled = false,
}: AddItemButtonProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasReachedLimit = itemCount >= maxItems;
  const hasWarning = itemCount >= 50;
  const isDisabled = disabled || hasReachedLimit;

  /* v8 ignore start */
  const handleClick = () => {
    if (!isDisabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  /* v8 ignore stop */

  /* v8 ignore start */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onFileSelect(files);
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  /* v8 ignore stop */

  return (
    <div
      data-testid="add-item-container"
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
        hasWarning
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
          : 'border-slate-200 dark:border-slate-700'
      } ${hasReachedLimit ? 'opacity-50' : ''}`}
    >
      <button
        className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Add item"
        aria-describedby={hasWarning ? 'item-warning' : undefined}
        type="button"
      >
        + Add Item
      </button>

      {/* Item count display */}
      <div className="text-slate-600 dark:text-slate-400">
        <span className="font-medium">{itemCount}</span>/{maxItems} items
      </div>

      {/* Warning message */}
      {hasWarning && !hasReachedLimit && (
        <p
          id="item-warning"
          className="text-xs text-yellow-700 dark:text-yellow-400"
        >
          Warning: Adding more items may affect performance.
        </p>
      )}

      {/* Maximum reached message */}
      {hasReachedLimit && (
        <p className="text-xs text-red-700 dark:text-red-400">
          Maximum {maxItems} items reached.
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        data-testid="file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        disabled={isDisabled}
      />
    </div>
  );
}
