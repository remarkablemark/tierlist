/**
 * TierListItem component representing an individual item in the tier list.
 * @packageDocumentation
 */

import { type KeyboardEvent, useState } from 'react';

import { type TierListItemComponentProps } from './TierListItem.types';

/**
 * TierListItem component that displays a single item with image and label.
 */
export function TierListItem({
  item,
  isDragging = false,
  isKeyboardDragActive = false,
  isDropTarget = false,
  onDragStart,
  onDragEnd,
  onMove,
  onDelete,
  onLabelEdit,
  onPointerDragStart,
  onPointerDragEnd,
  size,
  showLabel,
}: TierListItemComponentProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState(item.label);

  const handleDragStart = (source: 'keyboard' | 'pointer') => {
    onDragStart(source);
  };

  const handleDragEnd = (dropped: boolean) => {
    onDragEnd(dropped);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (isKeyboardDragActive) {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onMove('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          onMove('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onMove('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          onMove('right');
          break;
        case 'Escape':
          event.preventDefault();
          handleDragEnd(false);
          break;
        case 'Enter':
          event.preventDefault();
          handleDragEnd(true);
          break;
        /* v8 ignore start */
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          onDelete();
          break;
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDragStart('keyboard');
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      onDelete();
    }
    /* v8 ignore stop */
  };

  const handleLabelDoubleClick = () => {
    setIsEditing(true);
    setLocalLabel(item.label);
  };

  const handleLabelBlur = () => {
    if (localLabel !== item.label && localLabel.trim()) {
      onLabelEdit(localLabel.trim());
    } else {
      setLocalLabel(item.label);
    }
    setIsEditing(false);
  };

  const handleLabelKeydown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setLocalLabel(item.label);
      setIsEditing(false);
    }
  };

  const sizeClasses = {
    small: 'h-16 w-16',
    medium: 'h-24 w-24',
    large: 'h-32 w-32',
  };

  const draggingClasses = isDragging ? 'opacity-50' : 'opacity-100';
  const keyboardDragClasses = isKeyboardDragActive
    ? 'ring-2 ring-blue-500 ring-inset'
    : '';
  const dropTargetClasses = isDropTarget
    ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white bg-amber-50 shadow-md dark:ring-amber-400 dark:ring-offset-slate-900 dark:bg-amber-950/30'
    : '';

  return (
    <div
      className={`relative flex flex-col items-center rounded-md border border-slate-200 bg-white p-2 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800 ${sizeClasses[size]} ${draggingClasses} ${keyboardDragClasses} ${dropTargetClasses} min-h-11 min-w-11 focus-within:ring-2 focus-within:ring-blue-500`}
      role="listitem"
      aria-label={item.label}
      data-grabbed={isDragging}
      data-drop-target={isDropTarget}
      aria-describedby={`item-instructions-${item.id}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={onPointerDragStart}
      onDragEnd={onPointerDragEnd}
    >
      {/* Hidden instructions for screen readers */}
      <span id={`item-instructions-${item.id}`} className="sr-only">
        Press Enter to pick up, arrow keys to move, Enter to drop, Escape to
        cancel
      </span>

      {/* Image or Placeholder */}
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.label}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
            <span className="text-xs">No Image</span>
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="mt-1 w-full">
          {isEditing ? (
            <input
              type="text"
              value={localLabel}
              onChange={(e) => {
                setLocalLabel(e.target.value);
              }}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeydown}
              className="w-full rounded border border-slate-300 bg-white px-1 py-0.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              autoFocus
              aria-label="Edit item label"
            />
          ) : (
            <span
              className="block truncate text-xs text-slate-700 dark:text-slate-300"
              onDoubleClick={handleLabelDoubleClick}
              role="button"
              tabIndex={0}
              aria-label="Double-click to edit label"
            >
              {item.label}
            </span>
          )}
        </div>
      )}

      {/* Drag Handle */}
      <button
        className="absolute -top-1 -right-1 rounded-full bg-slate-200 p-1 text-slate-600 opacity-0 transition-opacity hover:bg-slate-300 hover:text-slate-900 focus:opacity-100 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500 dark:hover:text-white"
        onClick={() => {
          handleDragStart('keyboard');
        }}
        aria-label="Drag handle"
        tabIndex={0}
        type="button"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </button>

      {/* Delete Button */}
      <button
        className="absolute -top-1 -left-1 rounded-full bg-red-100 p-1 text-red-600 opacity-0 transition-opacity hover:bg-red-200 hover:text-red-700 focus:opacity-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
        onClick={onDelete}
        aria-label="Delete item"
        tabIndex={0}
        type="button"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
