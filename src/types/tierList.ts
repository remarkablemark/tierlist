/**
 * Core type definitions for the Tier List application.
 * @packageDocumentation
 */

/**
 * Metadata associated with a tier list item.
 */
export interface ItemMetadata {
  originalFileName?: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: number;
}

/**
 * An individual item to be ranked in the tier list.
 */
export interface TierListItem {
  id: string;
  label: string;
  imageUrl: string | null;
  imageBlobId: string | null;
  createdAt: number;
  metadata: ItemMetadata;
}

/**
 * A ranked category within a tier list.
 */
export interface Tier {
  id: string;
  label: string;
  color: string;
  items: TierListItem[];
  isCustomColor: boolean;
  isCustomLabel: boolean;
}

/**
 * Configuration for tier list display and behavior.
 */
export interface TierListSettings {
  itemSize: 'small' | 'medium' | 'large';
  showItemLabels: boolean;
}

/**
 * The root entity representing a complete tier list collection.
 */
export interface TierList {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tiers: Tier[];
  unassignedItems: TierListItem[];
  settings: TierListSettings;
  version: number;
}

/**
 * Complete state for the tier list reducer with undo/redo support.
 */
export interface TierListState {
  past: TierList[];
  present: TierList;
  future: TierList[];
}

/**
 * Union type for all state-changing actions.
 */
export type TierListAction =
  // Tier operations
  | { type: 'TIER_ADD'; payload: { label?: string; color?: string } }
  | { type: 'TIER_DELETE'; payload: { tierId: string } }
  | {
      type: 'TIER_REORDER';
      payload: { tierId: string; direction: 'up' | 'down' };
    }
  | { type: 'TIER_UPDATE_LABEL'; payload: { tierId: string; label: string } }
  | { type: 'TIER_UPDATE_COLOR'; payload: { tierId: string; color: string } }
  | { type: 'TIER_RESET'; payload: { tierId: string } }

  // Item operations
  | { type: 'ITEM_ADD'; payload: { item: TierListItem; targetTierId?: string } }
  | { type: 'ITEM_DELETE'; payload: { itemId: string } }
  | {
      type: 'ITEM_MOVE';
      payload: {
        itemId: string;
        sourceTierId: string;
        targetTierId: string | null;
        targetIndex: number;
      };
    }
  | {
      type: 'ITEM_REORDER';
      payload: { tierId: string; itemId: string; direction: 'up' | 'down' };
    }
  | { type: 'ITEM_UPDATE_LABEL'; payload: { itemId: string; label: string } }

  // Undo/redo
  | { type: 'UNDO' }
  | { type: 'REDO' }

  // Settings
  | { type: 'SETTINGS_UPDATE'; payload: Partial<TierListSettings> };
