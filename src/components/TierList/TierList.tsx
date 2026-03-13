/**
 * TierList component - Main canvas for rendering the tier list.
 * @packageDocumentation
 */

/* v8 ignore file -- @preserve */

import { DragDropProvider } from '@dnd-kit/react';
import { useRef, useState } from 'react';

import { useAutoSave } from '../../hooks/useAutoSave';
import { useTierList } from '../../hooks/useTierList';
import {
  type Tier as TierType,
  type TierListItem as TierItemType,
} from '../../types/tierList.types';
import { exportTierListToPng } from '../../utils/exportToPng';
import { AddItemButton } from '../AddItemButton';
import { ExportButton } from '../ExportButton';
import { SaveLoadControls } from '../SaveLoadControls';
import { Tier } from '../Tier';
import { TierListItem } from '../TierListItem';

/**
 * TierList component that renders the complete tier list canvas.
 */
export function TierList({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const {
    addTier,
    deleteTier,
    // reorderTiers - reserved for future keyboard navigation
    updateTierLabel,
    updateTierColor,
    resetTier,
    addItem,
    deleteItem,
    moveItem,
    // reorderItem - reserved for future use
    updateItemLabel,
    undo,
    redo,
    canUndo,
    canRedo,
    totalItems,
    hasReachedItemLimit,
    hasItemLimitWarning,
    tierList,
    save,
    load,
    createNew,
    deleteSaved,
  } = useTierList();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Auto-save hook - wires into lifecycle for debounced saves
  const {
    status: autoSaveStatus,
    errorMessage: autoSaveError,
    lastSavedAt,
  } = useAutoSave(tierList);

  const [savedTierLists] = useState<
    { id: string; name: string; updatedAt: number; lastAccessedAt: number }[]
  >([]);

  const [draggedItem, setDraggedItem] = useState<TierItemType | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_draggedTier, _setDraggedTier] = useState<TierType | null>(null);
  const [overTierId, setOverTierId] = useState<string | null>(null);

  const handleAddTier = () => {
    addTier();
  };

  const handleDeleteTier = (tierId: string) => {
    deleteTier(tierId);
  };

  const handleTierLabelChange = (tierId: string, label: string) => {
    updateTierLabel(tierId, label);
  };

  const handleTierColorChange = (tierId: string, color: string) => {
    updateTierColor(tierId, color);
  };

  const handleTierReset = (tierId: string) => {
    resetTier(tierId);
  };

  const handleItemDrop = (
    itemId: string,
    /* eslint-disable-line @typescript-eslint/no-unused-vars */ _index: number,
  ) => {
    // Drop into unassigned area (index not used for unassigned)
    moveItem(itemId, null, 0);
    setDraggedItem(null);
    setOverTierId(null);
  };

  const handleItemReorder = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _itemId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _newIndex: number,
  ) => {
    // Reorder within unassigned area (not implemented yet)
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newItem: TierItemType = {
        id: crypto.randomUUID(),
        label: file.name.split('.')[0] || 'Item',
        imageUrl,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {
          originalFileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: Date.now(),
        },
      };
      addItem(newItem);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!containerRef.current) {
      throw new Error('Container not available for export');
    }

    setIsExporting(true);
    try {
      const result = await exportTierListToPng(containerRef.current, {
        format: 'png',
        scale: 2,
        minWidth: 1080,
        fileName: tierList.name.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
      });

      if (!result.success) {
        throw new Error(result.error ?? 'Export failed');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveClick = async (): Promise<void> => {
    await save();
  };

  const handleLoadClick = async (id: string): Promise<void> => {
    await load(id);
  };

  const handleDeleteClick = async (id: string): Promise<void> => {
    await deleteSaved(id);
  };

  const handleCreateNewClick = (name?: string): void => {
    createNew(name);
  };

  return (
    <DragDropProvider>
      <div
        ref={containerRef}
        className={`mx-auto max-w-6xl p-4 ${className ?? ''}`}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {tierList.name}
          </h1>

          <div className="flex items-center gap-2">
            {/* Save/Load Controls */}
            <SaveLoadControls
              autoSaveStatus={autoSaveStatus}
              lastSavedAt={lastSavedAt}
              errorMessage={autoSaveError}
              onSave={handleSaveClick}
              onLoad={handleLoadClick}
              onDelete={handleDeleteClick}
              onCreateNew={handleCreateNewClick}
              savedTierLists={savedTierLists}
              currentTierList={tierList}
            />

            {/* Export Button */}
            <ExportButton
              onExport={handleExport}
              isLoading={isExporting}
              disabled={tierList.tiers.length === 0}
            />

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

        {/* Auto-save status */}
        {autoSaveError && (
          <div
            className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
            role="alert"
          >
            {autoSaveError}
          </div>
        )}
        {autoSaveStatus === 'saving' && (
          <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Saving...
          </div>
        )}
        {autoSaveStatus === 'saved' && (
          <div className="mb-4 text-sm text-green-600 dark:text-green-400">
            Saved
          </div>
        )}

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
          {tierList.tiers.map((tier, index) => (
            <Tier
              key={tier.id}
              tier={tier}
              index={index}
              totalTiers={tierList.tiers.length}
              isDragging={_draggedTier?.id === tier.id}
              isOver={overTierId === tier.id}
              onLabelChange={(label) => {
                handleTierLabelChange(tier.id, label);
              }}
              onColorChange={(color) => {
                handleTierColorChange(tier.id, color);
              }}
              onReset={() => {
                handleTierReset(tier.id);
              }}
              onDelete={() => {
                handleDeleteTier(tier.id);
              }}
              onItemDrop={handleItemDrop}
              onItemReorder={handleItemReorder}
              itemSize={tierList.settings.itemSize}
              showLabels={tierList.settings.showItemLabels}
            />
          ))}
        </div>

        {/* Unassigned Items Area */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-slate-300 p-4 dark:border-slate-700">
          <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
            Unassigned Items
          </h2>

          {/* Add Item Button */}
          <div className="mb-4">
            <AddItemButton
              onFileSelect={handleFileSelect}
              itemCount={totalItems}
              maxItems={100}
            />
          </div>

          {/* Unassigned Items Grid */}
          <div className="flex min-h-[100px] flex-wrap gap-2">
            {tierList.unassignedItems.length === 0 ? (
              <div className="flex items-center justify-center text-slate-400 dark:text-slate-500">
                <span className="text-sm">No unassigned items</span>
              </div>
            ) : (
              tierList.unassignedItems.map((item) => (
                <div key={item.id}>
                  <TierListItem
                    item={item}
                    isDragging={draggedItem?.id === item.id}
                    isKeyboardDragActive={false}
                    onDragStart={() => {
                      setDraggedItem(item);
                    }}
                    onDragEnd={(dropped) => {
                      if (!dropped) {
                        setDraggedItem(null);
                      }
                    }}
                    onMove={() => {
                      // Keyboard move handled separately
                    }}
                    onDelete={() => {
                      deleteItem(item.id);
                    }}
                    onLabelEdit={(label) => {
                      updateItemLabel(item.id, label);
                    }}
                    size={tierList.settings.itemSize}
                    showLabel={tierList.settings.showItemLabels}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
}
