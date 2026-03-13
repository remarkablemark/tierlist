/**
 * AddItemButton component for uploading images to the tier list.
 * @packageDocumentation
 */

import { type ChangeEvent, useRef } from 'react';

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

  const handleClick = () => {
    /* v8 ignore start */
    if (!isDisabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
    /* v8 ignore stop */
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Clear the input so the same file can be selected again
      /* v8 ignore start */
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      /* v8 ignore stop */
    }
  };

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
        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Add item"
        aria-describedby={hasWarning ? 'item-warning' : undefined}
        type="button"
      >
        <svg
          data-testid="plus-icon"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Add Item</span>
      </button>

      {/* Item count display */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
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
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        disabled={isDisabled}
      />
    </div>
  );
}
