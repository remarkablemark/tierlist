# Quick Start: Tier List Application

**Date**: 2026-03-11
**Feature**: Tier List Application
**Branch**: `001-tier-list`

## Overview

This quick start guide provides the essential information needed to begin implementing the Tier List Application feature.

---

## Project Setup

### Prerequisites

- Node.js 24 (check with `node --version`)
- npm (comes with Node.js)
- Git (for branch management)

### Initial Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

---

## Feature Branch

```bash
# Create and checkout feature branch
git checkout -b 001-tier-list

# Verify branch
git branch --show-current
```

---

## Directory Structure

```
src/
├── components/
│   ├── TierList/        # Main tier list canvas
│   ├── Tier/            # Individual tier component
│   ├── TierListItem/    # Individual item component
│   ├── AddItemButton/   # File upload button
│   └── UndoRedoControls/# Undo/redo buttons
├── hooks/
│   └── useTierList.ts   # Main hook for state management
├── services/
│   └── storage.ts       # IndexedDB operations
├── store/
│   ├── tierListReducer.ts    # Reducer for all actions
│   └── tierListContext.tsx   # Context provider
└── utils/
    ├── escapeHtml.ts    # HTML entity escaping
    └── validation.ts    # Validation helpers
```

---

## Key Technologies

### React 19

- Functional components with hooks
- React Compiler handles memoization automatically
- No manual `useMemo` or `useCallback` needed

### @dnd-kit

Drag-and-drop library for tier and item interactions.

```bash
# Install if not already present
npm install @dnd-kit/react @dnd-kit/sortable @dnd-kit/touch-sensor @dnd-kit/accessibility
```

**Basic Setup**:

```typescript
import { DragDropProvider, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
  useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor)
);

function App() {
  return (
    <DragDropProvider
      sensors={sensors}
      collisionDetection={closestCenter}
      onDrop={handleDrop}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {/* Sortable items */}
      </SortableContext>
    </DragDropProvider>
  );
}
```

### IndexedDB with idb

Promise-based wrapper for IndexedDB.

```bash
npm install idb
```

**Basic Setup**:

```typescript
import { openDB } from 'idb';

const DB_NAME = 'TierListDB';
const DB_VERSION = 1;

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('tierLists', { keyPath: 'id' });
      db.createObjectStore('images', { keyPath: 'id' });
    },
  });
}
```

### Tailwind CSS 4

Styling utility classes.

```typescript
// Example component styling
<div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    Tier List
  </h1>
</div>
```

---

## State Management Pattern

### useReducer + Context API

```typescript
// store/tierListReducer.ts
import { TierList, TierListAction } from '../types';

export function tierListReducer(state: TierList, action: TierListAction): TierList {
  switch (action.type) {
    case 'TIER_ADD':
      return addTier(state, action.payload);
    case 'ITEM_MOVE':
      return moveItem(state, action.payload);
    // ... other cases
    default:
      return state;
  }
}

// store/TierListContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

interface TierListContextValue {
  state: TierList;
  dispatch: React.Dispatch<TierListAction>;
}

const TierListContext = createContext<TierListContextValue | null>(null);

export function TierListProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tierListReducer, createDefaultTierList());

  return (
    <TierListContext.Provider value={{ state, dispatch }}>
      {children}
    </TierListContext.Provider>
  );
}

export function useTierListContext() {
  const context = useContext(TierListContext);
  if (!context) {
    throw new Error('useTierListContext must be used within TierListProvider');
  }
  return context;
}
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Define TypeScript types (from data-model.md)
- [ ] Create tier list reducer
- [ ] Create context provider
- [ ] Set up IndexedDB database
- [ ] Implement storage service

### Phase 2: Tier Components

- [ ] Create TierList component
- [ ] Create Tier component with drag-and-drop
- [ ] Implement tier reordering
- [ ] Implement tier label editing
- [ ] Implement tier color customization
- [ ] Add tier delete functionality

### Phase 3: Item Components

- [ ] Create TierListItem component
- [ ] Implement file upload for images
- [ ] Create AddItemButton component
- [ ] Implement item drag-and-drop
- [ ] Implement item move between tiers
- [ ] Add item delete functionality

### Phase 4: Undo/Redo

- [ ] Wrap state with undo/redo wrapper
- [ ] Implement UNDO action
- [ ] Implement REDO action
- [ ] Create UndoRedoControls component
- [ ] Add 50-action limit with circular buffer

### Phase 5: Persistence

- [ ] Implement auto-save on state change
- [ ] Create save/load UI
- [ ] Handle IndexedDB errors
- [ ] Add quota exceeded handling

### Phase 6: Accessibility

- [ ] Add keyboard navigation
- [ ] Implement screen reader announcements
- [ ] Add ARIA labels
- [ ] Test with screen reader
- [ ] Ensure 44x44px touch targets

### Phase 8: Testing

- [ ] Write unit tests for reducer
- [ ] Write component tests with Testing Library
- [ ] Write integration tests
- [ ] Mock IndexedDB for tests
- [ ] Achieve 100% coverage (excluding barrel exports)

---

## Testing Strategy

### TDD Workflow

1. **Red**: Write failing test first
2. **Green**: Implement minimum code to pass
3. **Refactor**: Clean up while keeping tests green

### Example Test Structure

```typescript
// features/tier-list/store/tierListReducer.test.ts
import { tierListReducer } from './tierListReducer';
import { createDefaultTierList } from '../utils/createDefaultTierList';

describe('tierListReducer', () => {
  it('should add a new tier', () => {
    const state = createDefaultTierList();
    const action = { type: 'TIER_ADD' as const, payload: {} };
    const newState = tierListReducer(state, action);

    expect(newState.tiers).toHaveLength(state.tiers.length + 1);
  });
});
```

### Mocking IndexedDB

```typescript
// Use fake-indexeddb for tests
import 'fake-indexeddb/auto';
import { openDB } from 'idb';

// Reset database before each test
beforeEach(async () => {
  const db = await openDB('TierListDB', 1, {
    upgrade(db) {
      db.createObjectStore('tierLists', { keyPath: 'id' });
    },
  });
  db.clear('tierLists');
});
```

---

## Common Patterns

### HTML Escaping

```typescript
// utils/escapeHtml.ts
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

### UUID Generation

```typescript
// utils/generateId.ts
export function generateId(): string {
  return crypto.randomUUID();
}
```

### Item Count Validation

```typescript
// utils/validation.ts
const MAX_ITEMS = 100;
const WARNING_THRESHOLD = 50;

export function validateItemCount(currentCount: number): {
  valid: boolean;
  warning?: string;
} {
  if (currentCount >= MAX_ITEMS) {
    return { valid: false, warning: `Maximum ${MAX_ITEMS} items reached` };
  }
  if (currentCount >= WARNING_THRESHOLD) {
    return {
      valid: true,
      warning: `Warning: ${currentCount} items may affect performance`,
    };
  }
  return { valid: true };
}
```

---

## Git Workflow

### Commit Messages

Use Conventional Commits format:

```
<type>(<scope>): <description>

feat(tier-list): add tier creation functionality
fix(tier-list): resolve drag-and-drop collision detection
docs(tier-list): update quickstart guide
test(tier-list): add reducer unit tests
refactor(tier-list): simplify state management
```

### Branch Management

```bash
# Regular commits
git add .
git commit -m "feat(tier-list): add tier component"

# Push to branch
git push -u origin 001-tier-list

# Check status
git status
```

---

## Development Commands

```bash
# Start dev server (opens browser)
npm start

# Run tests in watch mode
npm test

# Run tests with coverage
npm run test:ci

# Lint code
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Type check
npm run lint:tsc

# Build for production
npm run build
```

---

## Debugging Tips

### React DevTools

- Install React DevTools extension
- Inspect component hierarchy
- View state and props

### IndexedDB DevTools

- Chrome: DevTools → Application → IndexedDB
- Firefox: Storage Inspector → IndexedDB
- View stored tier lists and images

### Debugging Drag-and-Drop

```typescript
// Add debug logging to drag handlers
const handleDragEnd = (event: DragEndEvent) => {
  console.log('Drag ended:', {
    active: event.active,
    over: event.over,
    delta: event.delta,
  });
  // ... handle drag end
};
```

---

## Resources

- [React Documentation](https://react.dev/)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [idb Documentation](https://github.com/jakearchibald/idb)
- [Testing Library](https://testing-library.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)

---

## Next Steps

1. Review data-model.md for entity definitions
2. Review contracts/interface-contracts.md for API contracts
3. Set up feature directory structure
4. Begin TDD with tier list reducer tests
5. Implement core components following contracts

---

**Questions?** Refer to:

- Feature Spec: `/specs/001-tier-list/spec.md`
- Research: `/specs/001-tier-list/research.md`
- Data Model: `/specs/001-tier-list/data-model.md`
- Constitution: `/.specify/memory/constitution.md`
