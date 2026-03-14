# Data Model: Tier List Application

**Date**: 2026-03-11
**Feature**: Tier List Application
**Branch**: `001-tier-list`

## Core Entities

### TierList

The root entity representing a complete tier list collection.

```typescript
interface TierList {
  id: string; // UUID v4
  name: string; // User-provided name
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  tiers: Tier[]; // Ordered array of tiers
  unassignedItems: TierListItem[]; // Items not yet placed in tiers
  settings: TierListSettings; // Display and behavior settings
  version: number; // Schema version for migrations
}
```

**Invariants**:

- `id` MUST be unique across all tier lists
- `tiers` array order represents visual ranking (index 0 = top tier)
- `unassignedItems` contains items not yet categorized
- Total items (tiers + unassigned) MUST NOT exceed 100 (FR-020)
- `version` MUST match current schema version

---

### Tier

A ranked category within a tier list.

```typescript
interface Tier {
  id: string; // UUID v4
  label: string; // Tier label (e.g., "S", "A", "B")
  color: string; // Background color (hex, rgb, or hsl)
  items: TierListItem[]; // Items in this tier (ordered)
  isCustomColor: boolean; // Whether user customized color
  isCustomLabel: boolean; // Whether user customized label
}
```

**Invariants**:

- `id` MUST be unique within a tier list
- `label` MUST be escaped for HTML entities (FR-022)
- `color` MUST be valid CSS color value
- `items` array order represents visual arrangement within tier
- Default labels: ["S", "A", "B", "C", "D", "E", "F"]
- Default colors: Predefined palette per tier rank

**Validation Rules**:

- `label`: 1-10 characters, alphanumeric + common symbols
- `color`: Must match `/^#([0-9A-F]{3}){1,2}$/i` or valid CSS color

---

### TierListItem

An individual item to be ranked in the tier list.

```typescript
interface TierListItem {
  id: string; // UUID v4
  label: string; // Item name/label
  imageUrl: string | null; // Object URL or data URL for image
  imageBlobId: string | null; // Reference to blob in IndexedDB
  createdAt: number; // Unix timestamp
  metadata: ItemMetadata; // Additional item data
}
```

**Invariants**:

- `id` MUST be unique within a tier list
- `label` MUST be escaped for HTML entities (FR-022)
- Either `imageUrl` OR `imageBlobId` MUST be set if image exists
- `imageUrl` for temporary URLs, `imageBlobId` for persisted blobs

**Validation Rules**:

- `label`: 1-100 characters, any printable characters (escaped)
- `imageUrl`: Must be valid object URL or data URL
- `imageBlobId`: Must reference existing blob in IndexedDB

---

### ItemMetadata

Additional data about a tier list item.

```typescript
interface ItemMetadata {
  originalFileName?: string; // Original uploaded file name
  fileType?: string; // MIME type (e.g., "image/png")
  fileSize?: number; // File size in bytes
  width?: number; // Image width in pixels
  height?: number; // Image height in pixels
  uploadedAt?: number; // Unix timestamp of upload
}
```

**Invariants**:

- All fields optional
- `fileType` MUST be valid MIME type if present
- `fileSize` MUST be positive integer if present

---

### TierListSettings

Configuration for tier list display and behavior.

```typescript
interface TierListSettings {
  theme: 'light' | 'dark' | 'system'; // Color theme preference
  tierHeight: number; // Height of each tier in pixels
  itemSize: 'small' | 'medium' | 'large'; // Item display size
  showItemLabels: boolean; // Whether to show item text
  enableAnimations: boolean; // Enable drag animations
  snapToGrid: boolean; // Snap items to grid when dropping
}
```

**Defaults**:

```typescript
const DEFAULT_SETTINGS: TierListSettings = {
  theme: 'system',
  tierHeight: 120,
  itemSize: 'medium',
  showItemLabels: true,
  enableAnimations: true,
  snapToGrid: false,
};
```

---

### TierListState

Complete state for the tier list reducer (includes undo/redo).

```typescript
interface TierListState {
  past: TierList[]; // Past states for undo (max 50)
  present: TierList; // Current state
  future: TierList[]; // Future states for redo
}
```

**Invariants**:

- `past.length` MUST NOT exceed 50 (FR-016)
- `future` MUST be empty after any new action (not undo/redo)
- All states MUST be valid TierList structures

---

### TierListAction

Union type for all state-changing actions.

```typescript
type TierListAction =
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
        targetTierId: string;
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
```

---

## Relationships

### TierList → Tier

**Relationship**: One-to-many composition

- TierList owns Tiers
- Tiers CANNOT exist independently of a TierList
- Tier order determines visual ranking
- Deleting TierList deletes all Tiers

```typescript
// TierList contains ordered array of Tiers
tierList.tiers[index]; // Tier at ranking position
```

### TierList → TierListItem

**Relationship**: One-to-many composition (via tiers and unassigned)

- Items exist in exactly ONE location: either in a Tier OR in unassignedItems
- Items CANNOT be in multiple tiers simultaneously
- Total item count = sum(tier.items.length) + unassignedItems.length

```typescript
// Item location helpers
function findItemLocation(
  tierList: TierList,
  itemId: string,
):
  | { type: 'tier'; tierId: string; index: number }
  | { type: 'unassigned'; index: number }
  | null {
  // Search tiers first, then unassigned
}
```

### Tier → TierListItem

**Relationship**: One-to-many composition

- Tier owns its items
- Items in tier are ordered
- Deleting tier moves items to unassigned (FR-014a)

---

## State Transitions

### Tier List Lifecycle

```
[Created] → [Editing] → [Saved]
     ↑          ↓
     └──────────┘
```

**Transitions**:

1. **Created**: New TierList with default tiers, no items
2. **Editing**: Any state-changing action
3. **Saved**: Successfully persisted to IndexedDB

### Item Lifecycle

```
[Added] → [Unassigned] → [In Tier] → [Deleted/Moved]
              ↑              ↓
              └──────────────┘
```

**Transitions**:

1. **Added**: Item created with image upload
2. **Unassigned**: Item placed in unassignedItems
3. **In Tier**: Item dragged into a tier
4. **Deleted/Moved**: Item removed or moved to another tier

### Tier Lifecycle

```
[Created] → [Customized] → [Populated] → [Deleted]
```

**Transitions**:

1. **Created**: Tier added with default label/color
2. **Customized**: User changes label or color
3. **Populated**: Items added to tier
4. **Deleted**: Tier removed, items moved to unassigned

---

## Validation Rules

### TierList Validation

```typescript
function validateTierList(tierList: TierList): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Total item count
  const totalItems =
    tierList.unassignedItems.length +
    tierList.tiers.reduce((sum, tier) => sum + tier.items.length, 0);

  if (totalItems > 100) {
    errors.push('Tier list exceeds maximum of 100 items');
  } else if (totalItems >= 50) {
    warnings.push(
      `Performance warning: ${totalItems} items may slow down rendering`,
    );
  }

  // Unique tier IDs
  const tierIds = new Set(tierList.tiers.map((t) => t.id));
  if (tierIds.size !== tierList.tiers.length) {
    errors.push('Duplicate tier IDs detected');
  }

  // Unique item IDs across all locations
  const itemIds = new Set([
    ...tierList.unassignedItems.map((i) => i.id),
    ...tierList.tiers.flatMap((t) => t.items.map((i) => i.id)),
  ]);
  if (
    itemIds.size !==
    tierList.unassignedItems.length +
      tierList.tiers.reduce((sum, t) => sum + t.items.length, 0)
  ) {
    errors.push('Duplicate item IDs detected');
  }

  // Item exists in only one location
  const unassignedIds = new Set(tierList.unassignedItems.map((i) => i.id));
  const tierItemIds = new Set(
    tierList.tiers.flatMap((t) => t.items.map((i) => i.id)),
  );
  const intersection = [...unassignedIds].filter((id) => tierItemIds.has(id));
  if (intersection.length > 0) {
    errors.push(
      `Items found in multiple locations: ${intersection.join(', ')}`,
    );
  }

  return { errors, warnings };
}
```

### Tier Validation

```typescript
function validateTier(tier: Tier): ValidationResult {
  const errors: string[] = [];

  // Label length
  if (tier.label.length < 1 || tier.label.length > 10) {
    errors.push('Tier label must be 1-10 characters');
  }

  // Label sanitization
  if (tier.label !== escapeHtml(tier.label)) {
    errors.push('Tier label contains invalid HTML characters');
  }

  // Color format
  if (!isValidCssColor(tier.color)) {
    errors.push('Invalid tier color format');
  }

  // Unique item IDs within tier
  const itemIds = new Set(tier.items.map((i) => i.id));
  if (itemIds.size !== tier.items.length) {
    errors.push('Duplicate item IDs in tier');
  }

  return { errors, warnings: [] };
}
```

### Item Validation

```typescript
function validateItem(item: TierListItem): ValidationResult {
  const errors: string[] = [];

  // Label length
  if (item.label.length < 1 || item.label.length > 100) {
    errors.push('Item label must be 1-100 characters');
  }

  // Label sanitization
  if (item.label !== escapeHtml(item.label)) {
    errors.push('Item label contains invalid HTML characters');
  }

  // Image consistency
  if (
    item.imageUrl &&
    !item.imageBlobId &&
    !item.imageUrl.startsWith('data:')
  ) {
    warnings.push('Item has temporary URL that may expire');
  }

  return { errors, warnings: [] };
}
```

---

## IndexedDB Schema

### Database Structure

```typescript
interface TierListDB {
  tierLists: ObjectStore<'tierLists', TierListRecord>;
  images: ObjectStore<'images', ImageRecord>;
  metadata: ObjectStore<'metadata', MetadataRecord>;
}
```

### TierListRecord

```typescript
interface TierListRecord {
  id: string; // Primary key
  data: TierList; // Serialized TierList object
  createdAt: number; // Creation timestamp
  updatedAt: number; // Last update timestamp
  lastAccessedAt: number; // Last access timestamp
}
```

### ImageRecord

```typescript
interface ImageRecord {
  id: string; // Primary key (item ID)
  blob: Blob; // Image binary data
  type: string; // MIME type
  size: number; // File size in bytes
  createdAt: number; // Upload timestamp
}
```

### MetadataRecord

```typescript
interface MetadataRecord {
  key: string; // Primary key
  value: any; // Arbitrary metadata
  updatedAt: number; // Last update timestamp
}
```

### Schema Versioning

```typescript
const DB_VERSION = 1;
const DB_NAME = 'TierListDB';

async function openDatabase(): Promise<TierListDB> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      if (oldVersion < 1) {
        // Initial schema
        db.createObjectStore('tierLists', { keyPath: 'id' });
        db.createObjectStore('images', { keyPath: 'id' });
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
      // Future migrations:
      // if (oldVersion < 2) { ... }
    },
  });
}
```

---

## Default Values

### Default Tier Configuration

```typescript
const DEFAULT_TIERS: Omit<Tier, 'id'>[] = [
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
```

### Default Tier List

```typescript
function createDefaultTierList(name: string = 'Tier List'): TierList {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: escapeHtml(name),
    createdAt: now,
    updatedAt: now,
    tiers: DEFAULT_TIERS.map((t) => ({ ...t, id: crypto.randomUUID() })),
    unassignedItems: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}
```

---

## Type Guards

```typescript
function isTierList(obj: any): obj is TierList {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.createdAt === 'number' &&
    typeof obj.updatedAt === 'number' &&
    Array.isArray(obj.tiers) &&
    Array.isArray(obj.unassignedItems) &&
    typeof obj.settings === 'object' &&
    typeof obj.version === 'number'
  );
}

function isTier(obj: any): obj is Tier {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.label === 'string' &&
    typeof obj.color === 'string' &&
    Array.isArray(obj.items) &&
    typeof obj.isCustomColor === 'boolean' &&
    typeof obj.isCustomLabel === 'boolean'
  );
}

function isTierListItem(obj: any): obj is TierListItem {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.label === 'string' &&
    (obj.imageUrl === null || typeof obj.imageUrl === 'string') &&
    (obj.imageBlobId === null || typeof obj.imageBlobId === 'string') &&
    typeof obj.createdAt === 'number' &&
    typeof obj.metadata === 'object'
  );
}
```

---

## Utility Functions

### HTML Escaping

```typescript
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
  // Alternative manual implementation:
  // return text
  //   .replace(/&/g, '&amp;')
  //   .replace(/</g, '&lt;')
  //   .replace(/>/g, '&gt;');
}
```

### CSS Color Validation

```typescript
function isValidCssColor(color: string): boolean {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return false;
  ctx.fillStyle = color;
  return ctx.fillStyle !== '' && ctx.fillStyle !== 'rgba(0, 0, 0, 0)';
}
```

### Item Count Helper

```typescript
function getTotalItemCount(tierList: TierList): number {
  return (
    tierList.unassignedItems.length +
    tierList.tiers.reduce((sum, tier) => sum + tier.items.length, 0)
  );
}
```

### Find Item Location

```typescript
function findItemLocation(
  tierList: TierList,
  itemId: string,
):
  | { type: 'tier'; tierId: string; index: number }
  | { type: 'unassigned'; index: number }
  | null {
  // Check unassigned first
  const unassignedIndex = tierList.unassignedItems.findIndex(
    (i) => i.id === itemId,
  );
  if (unassignedIndex !== -1) {
    return { type: 'unassigned', index: unassignedIndex };
  }

  // Check tiers
  for (const tier of tierList.tiers) {
    const index = tier.items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      return { type: 'tier', tierId: tier.id, index };
    }
  }

  return null;
}
```

---

## References

- Feature Specification: `/specs/001-tier-list/spec.md`
- Research Document: `/specs/001-tier-list/research.md`
- Constitution: `/.specify/memory/constitution.md`
