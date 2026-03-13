/**
 * TierList component - Main canvas for rendering the tier list.
 * @packageDocumentation
 */

/* v8 ignore file -- @preserve */

import { DragDropProvider } from '@dnd-kit/react';
import { type DragEvent, useRef, useState } from 'react';
import { useAutoSave } from 'src/hooks/useAutoSave';
import { useTierList } from 'src/hooks/useTierList';
import {
  type Tier as TierType,
  type TierListItem as TierItemType,
} from 'src/types/tierList.types';
import { exportTierListToPng } from 'src/utils/exportToPng';

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
  const [keyboardDraggedItemId, setKeyboardDraggedItemId] = useState<
    string | null
  >(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_draggedTier, _setDraggedTier] = useState<TierType | null>(null);
  const [overTierId, setOverTierId] = useState<string | null>(null);

  const findItemTierId = (itemId: string): string | null => {
    const sourceTier = tierList.tiers.find((tier) =>
      tier.items.some((item) => item.id === itemId),
    );

    return sourceTier?.id ?? null;
  };

  const findItemPosition = (
    itemId: string,
  ): { tierId: string | null; index: number } | null => {
    const sourceTier = tierList.tiers.find((tier) =>
      tier.items.some((item) => item.id === itemId),
    );

    if (sourceTier) {
      return {
        tierId: sourceTier.id,
        index: sourceTier.items.findIndex((item) => item.id === itemId),
      };
    }

    const unassignedIndex = tierList.unassignedItems.findIndex(
      (item) => item.id === itemId,
    );

    if (unassignedIndex === -1) {
      return null;
    }

    return {
      tierId: null,
      index: unassignedIndex,
    };
  };

  const clearDragState = () => {
    setDraggedItem(null);
    setKeyboardDraggedItemId(null);
    setOverTierId(null);
  };

  const moveDraggedItem = (
    itemId: string,
    targetTierId: string | null,
    targetIndex?: number,
  ) => {
    const sourcePosition = findItemPosition(itemId);

    if (!sourcePosition) {
      clearDragState();
      return;
    }

    const destinationIndex =
      typeof targetIndex === 'number'
        ? targetIndex
        : targetTierId
          ? (tierList.tiers.find((tier) => tier.id === targetTierId)?.items
              .length ?? 0)
          : tierList.unassignedItems.length;

    if (
      sourcePosition.tierId === targetTierId &&
      sourcePosition.index === destinationIndex
    ) {
      clearDragState();
      return;
    }

    moveItem(itemId, targetTierId, destinationIndex);
    clearDragState();
  };

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

  const handleItemDropToUnassigned = (
    itemId: string,
    /* eslint-disable-line @typescript-eslint/no-unused-vars */ _index: number,
  ) => {
    moveDraggedItem(itemId, null);
  };

  const handleItemDropToTier = (itemId: string, targetTierId: string) => {
    moveDraggedItem(itemId, targetTierId);
  };

  const handleItemInsert = (
    itemId: string,
    targetTierId: string | null,
    targetIndex: number,
  ) => {
    moveDraggedItem(itemId, targetTierId, targetIndex);
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

  const handlePointerDragStart = (
    event: DragEvent<HTMLDivElement>,
    item: TierItemType,
  ) => {
    const dataTransfer = event.dataTransfer as DataTransfer | undefined;

    if (typeof dataTransfer !== 'undefined') {
      dataTransfer.effectAllowed = 'move';
      dataTransfer.setData('text/plain', item.id);
    }
    setDraggedItem(item);
    setKeyboardDraggedItemId(null);
  };

  const handlePointerDragEnd = () => {
    if (!keyboardDraggedItemId) {
      clearDragState();
    }
  };

  const handleKeyboardDragStart = (item: TierItemType) => {
    setDraggedItem(item);
    setKeyboardDraggedItemId(item.id);
    setOverTierId(findItemTierId(item.id));
  };

  const handleKeyboardMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!draggedItem || !keyboardDraggedItemId) {
      return;
    }

    const sourcePosition = findItemPosition(draggedItem.id);

    if (!sourcePosition) {
      return;
    }

    if (direction === 'left' || direction === 'right') {
      if (sourcePosition.tierId !== overTierId) {
        return;
      }

      const items =
        sourcePosition.tierId === null
          ? tierList.unassignedItems
          : (tierList.tiers.find((tier) => tier.id === sourcePosition.tierId)
              ?.items ?? []);
      const nextIndex =
        direction === 'left'
          ? sourcePosition.index - 1
          : sourcePosition.index + 1;

      if (nextIndex < 0 || nextIndex >= items.length) {
        return;
      }

      moveDraggedItem(draggedItem.id, sourcePosition.tierId, nextIndex);
      return;
    }

    const targets = [null, ...tierList.tiers.map((tier) => tier.id)];
    const currentIndex = targets.findIndex((tierId) => tierId === overTierId);
    const nextIndex =
      direction === 'down' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= targets.length) {
      return;
    }

    setOverTierId(targets[nextIndex]);
  };

  const handleKeyboardDrop = (dropped: boolean) => {
    if (!draggedItem || !keyboardDraggedItemId) {
      return;
    }

    if (!dropped) {
      clearDragState();
      return;
    }

    moveDraggedItem(draggedItem.id, overTierId);
  };

  const renderItem = (
    item: TierItemType,
    containerTierId: string | null,
    itemIndex: number,
  ) => (
    <div
      key={item.id}
      onDragOver={(event) => {
        event.preventDefault();
        setOverTierId(containerTierId);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (draggedItem) {
          handleItemInsert(draggedItem.id, containerTierId, itemIndex);
        }
      }}
    >
      <TierListItem
        item={item}
        isDragging={draggedItem?.id === item.id}
        isKeyboardDragActive={keyboardDraggedItemId === item.id}
        onDragStart={(source) => {
          if (source === 'keyboard') {
            handleKeyboardDragStart(item);
          }
        }}
        onDragEnd={handleKeyboardDrop}
        onMove={handleKeyboardMove}
        onDelete={() => {
          deleteItem(item.id);
        }}
        onLabelEdit={(label) => {
          updateItemLabel(item.id, label);
        }}
        onPointerDragStart={(event) => {
          handlePointerDragStart(event, item);
        }}
        onPointerDragEnd={handlePointerDragEnd}
        size={tierList.settings.itemSize}
        showLabel={tierList.settings.showItemLabels}
      />
    </div>
  );

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
            onItemDrop={(itemId) => {
              handleItemDropToTier(itemId, tier.id);
            }}
            activeItemId={draggedItem?.id ?? null}
            onItemDragEnter={() => {
              setOverTierId(tier.id);
            }}
            onItemDragLeave={() => {
              setOverTierId((currentTierId) =>
                currentTierId === tier.id ? null : currentTierId,
              );
            }}
            onItemDragOver={(event) => {
              event.preventDefault();
              setOverTierId(tier.id);
            }}
            onItemReorder={handleItemReorder}
            itemSize={tierList.settings.itemSize}
            showLabels={tierList.settings.showItemLabels}
          >
            {tier.items.map((item, itemIndex) =>
              renderItem(item, tier.id, itemIndex),
            )}
          </Tier>
        ))}

        {/* Unassigned Items Area */}
        <div className="mt-8 rounded-lg dark:border-slate-700">
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
          <div
            className={`flex min-h-[100px] flex-wrap gap-2 rounded-md p-2 transition-all ${
              overTierId === null && draggedItem
                ? 'ring-2 ring-slate-400 ring-inset'
                : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setOverTierId(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggedItem) {
                handleItemDropToUnassigned(
                  draggedItem.id,
                  tierList.unassignedItems.length,
                );
              }
            }}
          >
            {tierList.unassignedItems.length === 0 ? (
              <div className="flex items-center justify-center text-slate-400 dark:text-slate-500">
                <span className="text-sm">No unassigned items</span>
              </div>
            ) : (
              tierList.unassignedItems.map((item, itemIndex) =>
                renderItem(item, null, itemIndex),
              )
            )}
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
}
