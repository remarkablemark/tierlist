/**
 * Type definitions for the TierListItem component.
 * @packageDocumentation
 */

import { type DragEventHandler } from 'react';

import { type TierListItem as TierItemType } from '../../types/tierList.types';

/**
 * Props for the TierListItem component.
 */
export interface TierListItemComponentProps {
  /**
   * The item data to render.
   */
  item: TierItemType;
  /**
   * Whether this item is currently being dragged.
   */
  isDragging?: boolean;
  /**
   * Whether keyboard drag mode is active.
   */
  isKeyboardDragActive?: boolean;
  /**
   * Whether this item is the active reorder target.
   */
  isDropTarget?: boolean;
  /**
   * Callback when drag starts.
   */
  onDragStart: (source: 'keyboard' | 'pointer') => void;
  /**
   * Callback when drag ends.
   */
  onDragEnd: (dropped: boolean) => void;
  /**
   * Callback when item is moved via keyboard.
   */
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  /**
   * Callback when item is deleted.
   */
  onDelete: () => void;
  /**
   * Callback when item label is edited.
   */
  onLabelEdit: (label: string) => void;
  /**
   * Callback for native drag start events.
   */
  onPointerDragStart?: DragEventHandler<HTMLDivElement>;
  /**
   * Callback for native drag end events.
   */
  onPointerDragEnd?: DragEventHandler<HTMLDivElement>;
  /**
   * Size of the item display.
   */
  size: 'small' | 'medium' | 'large';
  /**
   * Whether to show the item label.
   */
  showLabel: boolean;
}
