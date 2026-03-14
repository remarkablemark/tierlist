/**
 * SaveLoadControls component for managing tier list persistence.
 * @packageDocumentation
 */

import { useState } from 'react';

import { type SaveLoadControlsProps } from './SaveLoadControls.types';
import { getStatusClassName } from './SaveLoadControls.utils';

/**
 * SaveLoadControls component that provides UI for saving and loading tier lists.
 */
export function SaveLoadControls({
  autoSaveStatus,
  lastSavedAt,
  errorMessage,
  onCreateNew,
  onLoad,
  onDelete,
  onSave,
  savedTierLists,
  currentTierList,
}: SaveLoadControlsProps): React.ReactElement {
  const [isLoadingOpen, setIsLoadOpen] = useState(false);

  const handleLoadClick = (): void => {
    setIsLoadOpen(!isLoadingOpen);
  };

  const handleSelectTierList = (id: string): void => {
    void onLoad(id);
    setIsLoadOpen(false);
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusMessage = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return `Saved ${formatTimestamp(lastSavedAt ?? 0)}`;
      /* v8 ignore next */
      case 'error':
        return `Error: ${errorMessage ?? ''}`;
      /* v8 ignore next */
      case 'quota-exceeded':
        return `Storage full: ${errorMessage ?? ''}`;
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Status Indicator */}
      <div className="text-slate-600 dark:text-slate-400">
        {getStatusMessage() && (
          <span className={getStatusClassName(autoSaveStatus)}>
            {getStatusMessage()}
          </span>
        )}
      </div>

      {/* Manual Save Button */}
      <button
        className="rounded-md bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        onClick={(e) => {
          e.preventDefault();
          void onSave();
        }}
        disabled={autoSaveStatus === 'saving' || !currentTierList}
        type="button"
      >
        Save
      </button>

      {/* Load Button */}
      <div className="relative">
        <button
          className="rounded-md bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          onClick={handleLoadClick}
          type="button"
        >
          Load
        </button>

        {/* Load Dropdown */}
        {isLoadingOpen && (
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">
                Saved Tier Lists
              </span>
              <button
                className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                onClick={(): void => {
                  void onCreateNew();
                  setIsLoadOpen(false);
                }}
                type="button"
              >
                New
              </button>
            </div>

            {savedTierLists.length === 0 ? (
              <div className="py-2 text-slate-500 dark:text-slate-400">
                No saved tier lists
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {savedTierLists.map((tierList) => (
                  <li key={tierList.id}>
                    <div className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-700">
                      <button
                        className="flex-1 truncate text-left text-slate-900 hover:bg-transparent dark:text-white"
                        onClick={(): void => {
                          handleSelectTierList(tierList.id);
                        }}
                        type="button"
                      >
                        {tierList.name}
                      </button>
                      <button
                        className="ml-2 rounded-md p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onDelete(tierList.id);
                        }}
                        aria-label={`Delete ${tierList.name}`}
                        type="button"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
