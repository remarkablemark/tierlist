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
  width?: number;
  height?: number;
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
  theme: 'light' | 'dark' | 'system';
  tierHeight: number;
  itemSize: 'small' | 'medium' | 'large';
  showItemLabels: boolean;
  enableAnimations: boolean;
  snapToGrid: boolean;
}

/**
 * Default tier list settings.
 */
export const DEFAULT_SETTINGS: TierListSettings = {
  theme: 'system',
  tierHeight: 120,
  itemSize: 'medium',
  showItemLabels: true,
  enableAnimations: true,
  snapToGrid: false,
};

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

  // Drag and drop operations
  | { type: 'DRAG_START'; payload: { type: 'tier' | 'item'; id: string } }
  | {
      type: 'DRAG_MOVE';
      payload: { type: 'tier' | 'item'; id: string; over: string | null };
    }
  | {
      type: 'DRAG_END';
      payload: {
        type: 'tier' | 'item';
        id: string;
        over: string | null;
        dropped: boolean;
      };
    }

  // Undo/redo
  | { type: 'UNDO' }
  | { type: 'REDO' }

  // Settings
  | { type: 'SETTINGS_UPDATE'; payload: Partial<TierListSettings> }

  // Persistence
  | { type: 'LOAD'; payload: TierList }
  | { type: 'SAVE_REQUEST' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; payload: string };

/**
 * Default tier configuration.
 */
export const DEFAULT_TIERS: Omit<Tier, 'id'>[] = [
  {
    label: 'S',
    color: '#ff7f7f',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'A',
    color: '#ffbf7f',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'B',
    color: '#ffff7f',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'C',
    color: '#bfff7f',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'D',
    color: '#7fff7f',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'E',
    color: '#7fbfff',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'F',
    color: '#bf7fff',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
];

/**
 * Validation result with errors and warnings.
 */
export interface ValidationResult {
  errors: string[];
  warnings: string[];
}
