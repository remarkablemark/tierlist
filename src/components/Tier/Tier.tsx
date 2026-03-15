/**
 * Tier component representing a single tier in the tier list.
 * @packageDocumentation
 */

import { useRef, useState } from 'react';

import { ColorPicker } from '../ColorPicker';
import { type TierProps } from './Tier.types';

/**
 * Tier component that displays a single tier with its items.
 */
export function Tier({
  tier,
  index,
  totalTiers,
  isDragging = false,
  isOver = false,
  onLabelChange,
  onColorChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onItemDrop,
  activeItemId = null,
  onItemDragEnter,
  onItemDragLeave,
  onItemDragOver,
  itemSize,
  showLabels,
  children,
}: TierProps): React.ReactElement {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  const handleLabelBlur = () => {
    const input = labelRef.current;
    if (input && input.value !== tier.label) {
      onLabelChange(input.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  const handleMoveUp = () => {
    onMoveUp?.();
  };

  const handleMoveDown = () => {
    onMoveDown?.();
  };

  const dropZoneClasses = isOver
    ? 'ring-2 ring-slate-400 ring-inset'
    : 'border-slate-200 dark:border-slate-700';

  const draggingClasses = isDragging ? 'opacity-50' : 'opacity-100';

  // Size classes for items
  const sizeClasses = {
    small: 'h-16 w-16',
    medium: 'h-24 w-24',
    large: 'h-32 w-32',
  };

  return (
    <div
      className={`relative ${dropZoneClasses} ${draggingClasses} transition-all`}
      style={{ backgroundColor: tier.color }}
      role="region"
      aria-label={`Tier ${tier.label}`}
    >
      {/* Tier Header */}
      <div className="flex items-center justify-between bg-white/50 p-3 dark:bg-slate-900/50">
        {/* Tier Label */}
        {showLabels ? (
          <input
            ref={labelRef}
            key={`${tier.id}-${tier.label}`}
            type="text"
            defaultValue={tier.label}
            onBlur={handleLabelBlur}
            onKeyDown={handleKeyDown}
            className="w-32 rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            aria-label="Tier label"
          />
        ) : (
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {tier.label}
          </span>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Move Up */}
          {index > 0 && (
            <button
              className="cursor-pointer rounded-md p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={handleMoveUp}
              aria-label="Move up"
              title="Move up"
              type="button"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          )}

          {/* Move Down */}
          {index < totalTiers - 1 && (
            <button
              className="cursor-pointer rounded-md p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={handleMoveDown}
              aria-label="Move down"
              title="Move down"
              type="button"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}

          {/* Color Picker */}
          <div className="relative">
            <button
              className="cursor-pointer rounded-md p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={() => {
                setIsColorPickerOpen(!isColorPickerOpen);
              }}
              aria-label="Tier color"
              title="Change color"
              type="button"
            >
              <div
                className="h-5 w-5 rounded border border-slate-300"
                style={{ backgroundColor: tier.color }}
              />
            </button>

            {isColorPickerOpen && (
              <ColorPicker
                color={tier.color}
                onColorSelect={onColorChange}
                isOpen={isColorPickerOpen}
                onToggle={() => {
                  setIsColorPickerOpen(false);
                }}
              />
            )}
          </div>

          {/* Delete */}
          <button
            className="cursor-pointer rounded-md p-1 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
            onClick={onDelete}
            aria-label="Delete tier"
            title="Delete tier"
            type="button"
          >
            <svg
              className="h-5 w-5"
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
      </div>

      {/* Items Drop Zone */}
      <div
        className="min-h-[100px] p-3"
        role="list"
        aria-label="Tier items"
        onDragEnter={() => {
          onItemDragEnter?.();
        }}
        onDragLeave={() => {
          onItemDragLeave?.();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          onItemDragOver?.(event);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (activeItemId) {
            onItemDrop(activeItemId, tier.items.length);
          }
        }}
      >
        {tier.items.length === 0 ? (
          <div className="h-20" aria-hidden="true" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {children ??
              tier.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col items-center rounded-md border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${sizeClasses[itemSize]}`}
                  role="listitem"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  {showLabels && item.label && (
                    <span className="mt-1 truncate text-xs text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
