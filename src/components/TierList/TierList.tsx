/**
 * TierList component - Main canvas for rendering the tier list.
 * @packageDocumentation
 */

import { DragDropProvider } from '@dnd-kit/react';
import { type DragEvent, useRef, useState } from 'react';
import { useTierList } from 'src/hooks/useTierList';
import { type TierListItem as TierItemType } from 'src/types/tierList.types';
import { generateId } from 'src/utils/generateId';
import { fileToDataUrl } from 'src/utils/imageUpload';

import { AddItemButton } from '../AddItemButton';
import { Tier } from '../Tier';
import { TierListItem } from '../TierListItem';

/**
 * TierList component that renders the complete tier list canvas.
 */
export function TierList() {
  const {
    addTier,
    deleteTier,
    updateTierLabel,
    updateTierColor,
    reorderTiers,
    addItem,
    deleteItem,
    moveItem,
    updateItemLabel,
    undo,
    redo,
    canUndo,
    canRedo,
    totalItems,
    hasReachedItemLimit,
    hasItemLimitWarning,
    tierList,
  } = useTierList();

  const containerRef = useRef<HTMLDivElement>(null);

  const [draggedItem, setDraggedItem] = useState<TierItemType | null>(null);
  const [keyboardDraggedItemId, setKeyboardDraggedItemId] = useState<
    string | null
  >(null);
  const [overTierId, setOverTierId] = useState<string | null>(null);
  const [reorderTarget, setReorderTarget] = useState<{
    tierId: string | null;
    index: number;
  } | null>(null);

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
    setReorderTarget(null);
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
        : /* v8 ignore start */
          targetTierId
          ? (tierList.tiers.find((tier) => tier.id === targetTierId)?.items
              .length ?? 0)
          : tierList.unassignedItems.length;
    /* v8 ignore stop */

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

  const handleFileSelect = (files: File[]) => {
    void (async () => {
      const availableSlots = Math.max(0, 100 - totalItems);
      const filesToAdd = files.slice(0, availableSlots);

      for (const file of filesToAdd) {
        const imageUrl = await fileToDataUrl(file);
        const uploadedAt = Date.now();
        const newItem: TierItemType = {
          id: generateId(),
          label: file.name.split('.')[0] || 'Item',
          imageUrl,
          imageBlobId: null,
          createdAt: uploadedAt,
          metadata: {
            originalFileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadedAt,
          },
        };
        addItem(newItem);
      }
    })();
  };

  const handlePointerDragStart = (
    event: DragEvent<HTMLDivElement>,
    item: TierItemType,
  ) => {
    const dataTransfer = event.dataTransfer as DataTransfer | undefined;

    /* v8 ignore start */
    if (typeof dataTransfer !== 'undefined') {
      dataTransfer.effectAllowed = 'move';
      dataTransfer.setData('text/plain', item.id);
    }
    /* v8 ignore stop */

    setDraggedItem(item);
    setKeyboardDraggedItemId(null);
    setReorderTarget(null);
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
    setReorderTarget(null);
  };

  const handleKeyboardMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!draggedItem || !keyboardDraggedItemId) {
      return;
    }

    const sourcePosition = findItemPosition(draggedItem.id);

    /* v8 ignore start */
    if (!sourcePosition) {
      return;
    }
    /* v8 ignore stop */

    if (direction === 'left' || direction === 'right') {
      /* v8 ignore start */
      if (sourcePosition.tierId !== overTierId) {
        return;
      }
      /* v8 ignore stop */

      /* v8 ignore start */
      const items =
        sourcePosition.tierId === null
          ? tierList.unassignedItems
          : (tierList.tiers.find((tier) => tier.id === sourcePosition.tierId)
              ?.items ?? []);
      /* v8 ignore stop */

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
  ) => {
    const isDropTarget =
      reorderTarget?.tierId === containerTierId &&
      reorderTarget.index === itemIndex;
    const dropTargetWrapperClasses = isDropTarget
      ? 'z-10 -translate-y-1 translate-x-4'
      : '';

    return (
      <div
        key={item.id}
        className={`relative transition-transform duration-150 ease-out ${dropTargetWrapperClasses}`}
        data-reorder-preview={isDropTarget}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOverTierId(containerTierId);

          if (!draggedItem || draggedItem.id === item.id) {
            setReorderTarget(null);
            return;
          }

          const sourcePosition = findItemPosition(draggedItem.id);

          if (sourcePosition?.tierId === containerTierId) {
            setReorderTarget({
              tierId: containerTierId,
              index: itemIndex,
            });
            return;
          }

          setReorderTarget(null);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (draggedItem) {
            handleItemInsert(draggedItem.id, containerTierId, itemIndex);
          }
        }}
      >
        {isDropTarget ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-2 -left-2 w-1 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(251,191,36,0.25)] dark:bg-amber-400 dark:shadow-[0_0_0_3px_rgba(251,191,36,0.2)]"
          />
        ) : null}
        <TierListItem
          item={item}
          isDragging={draggedItem?.id === item.id}
          isKeyboardDragActive={keyboardDraggedItemId === item.id}
          isDropTarget={isDropTarget}
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
  };

  return (
    <DragDropProvider>
      <div ref={containerRef} className="mx-auto max-w-6xl p-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {tierList.name}
          </h1>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
              type="button"
            >
              Undo
            </button>
            <button
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo"
              type="button"
            >
              Redo
            </button>

            {/* Add Tier Button */}
            <button
              className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
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
        {tierList.tiers.map((tier, index) => (
          <Tier
            key={tier.id}
            tier={tier}
            index={index}
            totalTiers={tierList.tiers.length}
            isOver={overTierId === tier.id}
            onLabelChange={(label) => {
              handleTierLabelChange(tier.id, label);
            }}
            onColorChange={(color) => {
              handleTierColorChange(tier.id, color);
            }}
            onDelete={() => {
              handleDeleteTier(tier.id);
            }}
            onMoveUp={() => {
              reorderTiers(tier.id, index - 1);
            }}
            onMoveDown={() => {
              reorderTiers(tier.id, index + 1);
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

              /* v8 ignore start */
              setReorderTarget((currentTarget) =>
                currentTarget?.tierId === tier.id ? null : currentTarget,
              );
              /* v8 ignore stop */
            }}
            onItemDragOver={(event) => {
              event.preventDefault();
              setOverTierId(tier.id);
              setReorderTarget(null);
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
        <div
          data-testid="unassigned-items-section"
          className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30"
        >
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
            className={`flex min-h-[100px] flex-wrap gap-2 rounded-md border border-dashed border-slate-300 bg-white p-2 transition-all dark:border-slate-600 dark:bg-slate-950/40 ${
              overTierId === null && draggedItem
                ? 'ring-2 ring-slate-400 ring-inset'
                : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setOverTierId(null);
              setReorderTarget(null);
            }}
            onDrop={(event) => {
              event.preventDefault();

              /* v8 ignore start */
              if (draggedItem) {
                handleItemDropToUnassigned(
                  draggedItem.id,
                  tierList.unassignedItems.length,
                );
              }
              /* v8 ignore stop */
            }}
          >
            {tierList.unassignedItems.length === 0 ? (
              <div className="flex w-full items-center justify-center text-slate-400 dark:text-slate-500">
                No unassigned items
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
