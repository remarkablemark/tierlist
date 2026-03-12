/**
 * TierList component - Main canvas for rendering the tier list.
 * @packageDocumentation
 */

import { useTierList } from '../../hooks/useTierList';
import { type TierListProps } from './TierList.types';

/**
 * TierList component that renders the complete tier list canvas.
 */
export function TierList({ className }: TierListProps): React.ReactElement {
  const {
    addTier,
    undo,
    redo,
    canUndo,
    canRedo,
    totalItems,
    hasReachedItemLimit,
    hasItemLimitWarning,
  } = useTierList();

  const handleAddTier = () => {
    addTier();
  };

  return (
    <div className={`mx-auto max-w-7xl p-4 ${className ?? ''}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tier List
        </h1>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            type="button"
          >
            Undo
          </button>
          <button
            className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            type="button"
          >
            Redo
          </button>

          {/* Add Tier Button */}
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            onClick={handleAddTier}
            aria-label="Add tier"
            type="button"
          >
            + Add Tier
          </button>
        </div>
      </div>

      {/* Item count warning */}
      {hasReachedItemLimit && (
        <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Maximum 100 items reached. Please remove items before adding more.
        </div>
      )}
      {hasItemLimitWarning && !hasReachedItemLimit && (
        <div className="mb-4 rounded-md bg-yellow-100 p-3 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Warning: {totalItems} items may affect performance.
        </div>
      )}

      {/* Tiers */}
      <div className="space-y-4">
        {/* This will be populated with actual tiers in the next iteration */}
      </div>

      {/* Unassigned Items Area */}
      <div className="mt-8 rounded-lg border-2 border-dashed border-slate-300 p-4 dark:border-slate-700">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
          Unassigned Items
        </h2>
        <div className="flex min-h-[100px] flex-wrap gap-2">
          <div className="flex items-center justify-center text-slate-400 dark:text-slate-500">
            <span className="text-sm">No unassigned items</span>
          </div>
        </div>
      </div>
    </div>
  );
}
