# Interface Contracts: Tier List Application

**Date**: 2026-03-11
**Feature**: Tier List Application
**Branch**: `001-tier-list`

## Overview

This document defines the interface contracts exposed by the Tier List Application. As a client-side React application, the primary interfaces are:

1. **Component Props API** - Public interfaces for reusable components
2. **Hook API** - Custom hooks for external composition
3. **Storage API** - IndexedDB schema for data persistence
4. **Export API** - Image export functionality

---

## Component Props Contracts

### TierListCanvasProps

Main canvas component for rendering the tier list.

```typescript
interface TierListCanvasProps {
  tierList: TierList;
  onTierAdd: (label?: string, color?: string) => void;
  onTierDelete: (tierId: string) => void;
  onTierReorder: (tierId: string, newIndex: number) => void;
  onTierUpdateLabel: (tierId: string, label: string) => void;
  onTierUpdateColor: (tierId: string, color: string) => void;
  onItemAdd: (item: TierListItem, targetTierId?: string) => void;
  onItemDelete: (itemId: string) => void;
  onItemMove: (
    itemId: string,
    targetTierId: string | null,
    targetIndex: number,
  ) => void;
  onItemReorder: (tierId: string, itemId: string, newIndex: number) => void;
  onSettingsUpdate: (settings: Partial<TierListSettings>) => void;
  onExport: () => Promise<void>;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}
```

**Usage**:

```typescript
<TierListCanvas
  tierList={tierList}
  onTierAdd={handleTierAdd}
  onItemMove={handleItemMove}
  onExport={handleExport}
/>
```

---

### TierProps

Individual tier component.

```typescript
interface TierProps {
  tier: Tier;
  index: number;
  totalTiers: number;
  isDragging?: boolean;
  isOver?: boolean;
  onLabelChange: (label: string) => void;
  onColorChange: (color: string) => void;
  onReset: () => void;
  onDelete: () => void;
  onItemDrop: (itemId: string, index: number) => void;
  onItemReorder: (itemId: string, newIndex: number) => void;
  itemSize: 'small' | 'medium' | 'large';
  showLabels: boolean;
}
```

**Accessibility Requirements**:

- MUST have `role="region"` with `aria-label` containing tier label
- MUST have drop zone with `aria-dropeffect="move"`
- MUST announce when item is dropped via live region

---

### TierListItemComponentProps

Individual item component.

```typescript
interface TierListItemComponentProps {
  item: TierListItem;
  tierId: string | null; // null if unassigned
  index: number;
  isDragging?: boolean;
  isKeyboardDragActive?: boolean;
  onDragStart: () => void;
  onDragEnd: (dropped: boolean) => void;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onDelete: () => void;
  onLabelEdit: (label: string) => void;
  size: 'small' | 'medium' | 'large';
  showLabel: boolean;
}
```

**Accessibility Requirements**:

- MUST have `role="listitem"` within parent `role="list"`
- MUST have `aria-grabbed` for drag state
- MUST have keyboard instructions in `aria-describedby`
- MUST have minimum 44x44px touch target

---

### AddItemButtonProps

Button for adding new items.

```typescript
interface AddItemButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  itemCount: number;
  maxItems: number;
}
```

**Behavior**:

- Opens file picker dialog (`<input type="file">`)
- Shows warning when itemCount >= 50
- Disabled when itemCount >= 100
- Accepts image files only (image/\*)

---

### UndoRedoControlsProps

Undo/redo button group.

```typescript
interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength?: number;
  historyLimit?: number;
}
```

**Accessibility Requirements**:

- Buttons MUST have `aria-label` describing action
- Disabled buttons MUST have `aria-disabled="true"`
- SHOULD show keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)

---

## Hook API Contracts

### useTierList

Main hook for tier list state management.

```typescript
interface UseTierListReturn {
  // State
  tierList: TierList | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;

  // Computed
  canUndo: boolean;
  canRedo: boolean;
  totalItems: number;
  hasReachedItemLimit: boolean;
  hasItemLimitWarning: boolean;

  // Tier operations
  addTier: (label?: string, color?: string) => void;
  deleteTier: (tierId: string) => void;
  reorderTiers: (tierId: string, newIndex: number) => void;
  updateTierLabel: (tierId: string, label: string) => void;
  updateTierColor: (tierId: string, color: string) => void;
  resetTier: (tierId: string) => void;

  // Item operations
  addItem: (file: File, targetTierId?: string) => Promise<void>;
  deleteItem: (itemId: string) => void;
  moveItem: (
    itemId: string,
    targetTierId: string | null,
    targetIndex: number,
  ) => void;
  reorderItem: (tierId: string, itemId: string, newIndex: number) => void;
  updateItemLabel: (itemId: string, label: string) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Settings
  updateSettings: (settings: Partial<TierListSettings>) => void;

  // Persistence
  save: () => Promise<void>;
  load: (id: string) => Promise<void>;
  createNew: (name?: string) => void;
}

function useTierList(): UseTierListReturn;
```

**Usage**:

```typescript
const { tierList, addTier, moveItem, undo, save } = useTierList();
```

**Invariants**:

- MUST be used within `TierListProvider` context
- All operations trigger undo/redo history
- Save/load handle IndexedDB errors gracefully

---

### useDragAndDrop

Hook for drag-and-drop integration.

```typescript
interface UseDragAndDropReturn {
  sensors: Sensor[];
  collisionDetection: CollisionDetection;
  onDragStart: (event: DragStartEvent) => void;
  onDragMove: (event: DragMoveEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: (event: DragCancelEvent) => void;
  announcements: Announcements;
  modifiers: Modifier[];
}

function useDragAndDrop(
  dispatch: React.Dispatch<TierListAction>,
): UseDragAndDropReturn;
```

**Sensor Configuration**:

```typescript
const sensors = [
  mouseSensor({ activationConstraint: { distance: 5 } }),
  touchSensor({ activationConstraint: { distance: 5 } }),
  keyboardSensor(),
];
```

---

### useIndexedDB

Hook for IndexedDB operations.

```typescript
interface UseIndexedDBReturn {
  saveTierList: (tierList: TierList) => Promise<void>;
  loadTierList: (id: string) => Promise<TierList | undefined>;
  deleteTierList: (id: string) => Promise<void>;
  getAllTierLists: () => Promise<TierListSummary[]>;
  saveImage: (id: string, blob: Blob, type: string) => Promise<void>;
  loadImage: (id: string) => Promise<Blob | undefined>;
  deleteImage: (id: string) => Promise<void>;
  clearDatabase: () => Promise<void>;
}

function useIndexedDB(dbName?: string, version?: number): UseIndexedDBReturn;
```

**Error Handling**:

- QuotaExceededError → throws with user-friendly message
- NotFoundError → returns undefined
- All errors include original error for debugging

---

## Storage API Contract

### IndexedDB Schema

**Database Name**: `TierListDB`
**Version**: `1`

#### Object Stores

**tierLists**:

```typescript
interface TierListStore {
  key: string; // UUID
  value: {
    id: string;
    data: TierList;
    createdAt: number;
    updatedAt: number;
    lastAccessedAt: number;
  };
  indexes: [
    { name: 'updatedAt'; keyPath: 'updatedAt'; multiEntry: false },
    { name: 'lastAccessedAt'; keyPath: 'lastAccessedAt'; multiEntry: false },
  ];
}
```

**images**:

```typescript
interface ImageStore {
  key: string; // Item ID
  value: {
    id: string;
    blob: Blob;
    type: string;
    size: number;
    createdAt: number;
  };
  indexes: [];
}
```

**metadata**:

```typescript
interface MetadataStore {
  key: string; // Metadata key
  value: {
    key: string;
    value: any;
    updatedAt: number;
  };
  indexes: [];
}
```

---

### Storage Operations

```typescript
interface StorageAPI {
  // Tier list CRUD
  save(data: TierList): Promise<void>;
  load(id: string): Promise<TierList | undefined>;
  delete(id: string): Promise<void>;
  list(): Promise<TierListSummary[]>;

  // Image CRUD
  saveImage(itemId: string, blob: Blob, type: string): Promise<void>;
  loadImage(itemId: string): Promise<Blob | undefined>;
  deleteImage(itemId: string): Promise<void>;

  // Metadata
  setMetadata(key: string, value: any): Promise<void>;
  getMetadata(key: string): Promise<any>;

  // Maintenance
  clear(): Promise<void>;
  getUsage(): Promise<{ used: number; limit: number }>;
}
```

**Error Types**:

```typescript
type StorageError =
  | { type: 'QUOTA_EXCEEDED'; message: string }
  | { type: 'NOT_FOUND'; id: string }
  | { type: 'INVALID_DATA'; reason: string }
  | { type: 'UNKNOWN'; error: Error };
```

---

## Event Contracts

### Drag Events

**DragStartEvent**:

```typescript
interface DragStartEvent {
  active: Active;
  collision: Collision | null;
}
```

**DragMoveEvent**:

```typescript
interface DragMoveEvent {
  active: Active;
  collisions: Collision[] | null;
  delta: {
    x: number;
    y: number;
  };
}
```

**DragEndEvent**:

```typescript
interface DragEndEvent {
  active: Active;
  collisions: Collision[] | null;
  delta: {
    x: number;
    y: number;
  };
  over: Identifiable | null;
}
```

**DragCancelEvent**:

```typescript
interface DragCancelEvent {
  active: Active;
  collisions: Collision[] | null;
}
```

---

### Keyboard Events

**KeyboardDragEvent**:

```typescript
interface KeyboardDragEvent {
  type: 'tier' | 'item';
  id: string;
  action: 'pickup' | 'move' | 'drop' | 'cancel';
  direction?: 'up' | 'down' | 'left' | 'right';
}
```

---

## Error Boundaries

### Component Error Boundary

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

**Behavior**:

- Catches render errors in children
- Shows fallback UI
- Logs error for debugging
- Allows retry via key change

---

### Hook Error Handler

```typescript
interface UseErrorHandlerReturn {
  error: Error | null;
  hasError: boolean;
  logError: (error: Error) => void;
  clearError: () => void;
}

function useErrorHandler(): UseErrorHandlerReturn;
```

---

## Accessibility Contracts

### Screen Reader Announcements

```typescript
interface Announcements {
  onDragStart(id: string, type: 'tier' | 'item'): string;
  onDragMove(position: number, total: number): string;
  onDragEnd(success: boolean): string;
  onDragCancel(): string;
  onDropInvalid(): string;
}

const DEFAULT_ANNOUNCEMENTS: Announcements = {
  onDragStart: (id, type) =>
    `Picked up ${type} ${id}. Press arrow keys to move, Enter to drop, Escape to cancel.`,
  onDragMove: (position, total) => `Position ${position} of ${total}.`,
  onDragEnd: (success) =>
    success ? 'Item dropped successfully.' : 'Drag cancelled.',
  onDragCancel: () => 'Drag operation cancelled.',
  onDropInvalid: () => 'Invalid drop zone. Try a different location.',
};
```

### Keyboard Instructions

```typescript
interface KeyboardInstructions {
  tier: string;
  item: string;
  general: string;
}

const KEYBOARD_INSTRUCTIONS: KeyboardInstructions = {
  tier: 'Tab to tier, Enter to pick up, Arrow keys to reorder, Enter to drop',
  item: 'Tab to item, Enter to pick up, Arrow keys to move, Enter to drop in tier',
  general:
    'Use Tab to navigate, Enter to activate, Escape to cancel drag operations',
};
```

---

## Version History

| Version | Date       | Changes                      |
| ------- | ---------- | ---------------------------- |
| 1.0.0   | 2026-03-11 | Initial contract definitions |

---

## References

- Feature Specification: `/specs/001-tier-list/spec.md`
- Data Model: `/specs/001-tier-list/data-model.md`
- Research: `/specs/001-tier-list/research.md`
- @dnd-kit Documentation: https://docs.dndkit.com/
