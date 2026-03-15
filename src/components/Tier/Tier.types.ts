/**
 * Type definitions for the Tier component.
 * @packageDocumentation
 */

import { type Tier as TierType } from 'src/types/tierList';

/**
 * Props for the Tier component.
 */
export interface TierProps {
  /**
   * The tier data to render.
   */
  tier: TierType;
  /**
   * The index of this tier in the list.
   */
  index: number;
  /**
   * Total number of tiers.
   */
  totalTiers: number;
  /**
   * Whether this tier is currently being dragged.
   */
  isDragging?: boolean;
  /**
   * Whether a drag item is over this tier.
   */
  isOver?: boolean;
  /**
   * Callback when tier label changes.
   */
  onLabelChange: (label: string) => void;
  /**
   * Callback when tier color changes.
   */
  onColorChange: (color: string) => void;
  /**
   * Callback when tier is deleted.
   */
  onDelete: () => void;
  /**
   * Callback when tier is moved up.
   */
  onMoveUp?: () => void;
  /**
   * Callback when tier is moved down.
   */
  onMoveDown?: () => void;
  /**
   * Callback when item is dropped on this tier.
   */
  onItemDrop: (itemId: string, index: number) => void;
  /**
   * The currently dragged item id, if any.
   */
  activeItemId?: string | null;
  /**
   * Callback when a dragged item enters the tier.
   */
  onItemDragEnter?: () => void;
  /**
   * Callback when a dragged item leaves the tier.
   */
  onItemDragLeave?: () => void;
  /**
   * Native drag-over handler for the drop zone.
   */
  onItemDragOver?: React.DragEventHandler<HTMLDivElement>;
  /**
   * Callback when item is reordered within this tier.
   */
  onItemReorder?: (itemId: string, newIndex: number) => void;
  /**
   * Optional custom item content.
   */
  children?: React.ReactNode;
  /**
   * Size of items to display.
   */
  itemSize: 'small' | 'medium' | 'large';
  /**
   * Whether to show item labels.
   */
  showLabels: boolean;
}
