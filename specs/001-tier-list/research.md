# Research: Tier List Application

**Date**: 2026-03-11
**Feature**: Tier List Application
**Branch**: `001-tier-list`

## Technical Decisions

### 1. Language & Version

**Decision**: TypeScript 5 with strict mode enabled

**Rationale**:

- Project already configured with TypeScript 5 (from AGENTS.md)
- Strict mode required by constitution principle II
- Provides type safety for complex drag-and-drop state management
- Catches errors at compile-time for better developer experience

**Alternatives Considered**:

- JavaScript: Rejected due to constitution requiring TypeScript strict mode
- Flow: Rejected in favor of TypeScript which is already established in project

---

### 2. Primary Dependencies

**Decision**: React 19 + @dnd-kit/react for drag-and-drop

**Rationale**:

- React 19 is the established UI library (from AGENTS.md)
- @dnd-kit/react is the project's drag-and-drop library (from AGENTS.md)
- @dnd-kit provides touch sensor support for mobile devices (FR-018)
- @dnd-kit has built-in accessibility support for keyboard navigation (FR-015)
- @dnd-kit is actively maintained and works with React 19

**Alternatives Considered**:

- react-dnd: Rejected due to larger bundle size and less mobile-friendly API
- react-beautiful-dnd: Rejected as it's in maintenance mode
- Custom drag-and-drop: Rejected due to accessibility complexity and reinventing the wheel

**Best Practices**:

- Use `DragDropProvider` from `@dnd-kit/react` for drag-and-drop context
- Use `@dnd-kit/sortable` for sortable lists (tiers and items)
- Use `@dnd-kit/touch-sensor` for mobile touch support
- Use `@dnd-kit/accessibility` for screen reader announcements

---

### 3. Storage

**Decision**: IndexedDB with idb library wrapper

**Rationale**:

- Spec requires IndexedDB (FR-009)
- IndexedDB supports larger data storage than localStorage
- IndexedDB supports storing binary data (images as blobs/data URLs)
- Async API prevents blocking main thread
- `idb` library provides Promise-based wrapper for cleaner code

**Alternatives Considered**:

- localStorage: Rejected due to 5MB limit and synchronous API
- WebSQL: Rejected as it's deprecated
- File System Access API: Rejected due to limited browser support

**Best Practices**:

- Use transaction-based operations for data integrity
- Implement versioned schema for future migrations
- Store images as blobs, not base64 data URLs (more efficient)
- Handle QuotaExceededError gracefully with user notification

---

### 4. Testing

**Decision**: Vitest 4 + Testing Library (@testing-library/react)

**Rationale**:

- Vitest 4 is the established testing framework (from AGENTS.md)
- Testing Library provides user-centric testing approach
- @testing-library/user-event for realistic interaction simulation
- Constitution principle I requires TDD with 100% coverage
- Vitest has fast parallel test execution

**Alternatives Considered**:

- Jest: Rejected in favor of Vitest (already configured)
- Cypress: Rejected as it's E2E testing, not unit testing
- React Testing Library alone: Rejected as Vitest provides better DX

**Best Practices**:

- Write tests before implementation (TDD red-green-refactor)
- Mock IndexedDB using fake-indexeddb
- Mock @dnd-kit context for isolated component tests
- Test accessibility with axe-core integration
- Exclude barrel exports from coverage requirements

---

### 5. Target Platform

**Decision**: Modern web browsers (Chrome, Firefox, Safari, Edge)

**Rationale**:

- React static website targets web browsers (from AGENTS.md)
- @dnd-kit supports all modern browsers
- IndexedDB has universal support in modern browsers
- Responsive design required from 320px to 1920px (FR-019)

**Alternatives Considered**:

- Electron desktop app: Rejected as web-first is simpler
- PWA with offline support: Could be added later, not in scope

**Browser Support**:

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions (iOS Safari included)

---

### 6. Project Type

**Decision**: Frontend-only web application

**Rationale**:

- No backend required - all data stored client-side in IndexedDB
- React SPA with Vite build tool (from AGENTS.md)
- Tab-local isolation means no server coordination needed (FR-020)

**Structure**: Single-page application with feature-based organization

**Alternatives Considered**:

- Full-stack with backend: Rejected as unnecessary complexity
- Static site with JSON files: Rejected as users need dynamic creation

---

### 7. Performance Goals

**Decision**: 60fps drag-and-drop, <100ms visual feedback (SC-003)

**Rationale**:

- Success criteria specifies <100ms drag feedback (SC-003)
- 60fps required for smooth drag operations
- React Compiler handles memoization automatically (AGENTS.md)
- @dnd-kit uses transforms for GPU-accelerated animations

**Implementation Approach**:

- Use CSS transforms for drag animations (GPU accelerated)
- Avoid state updates during drag - use @dnd-kit collision detection
- Virtual scrolling NOT needed for <100 items (FR-020)

**Alternatives Considered**:

- RequestAnimationFrame for animations: Rejected as @dnd-kit handles this

---

### 8. Constraints

**Decision**: Responsive 320px-1920px, 100 items max, 50 action undo limit

**Rationale**:

- Responsive requirement from FR-019 (320px minimum mobile)
- 100 item limit with soft warning at 50+ (FR-020)
- Undo/redo limit of 50 actions with circular buffer (FR-016)
- Touch targets minimum 44x44px for mobile (SC-009)

**Implementation Approach**:

- Tailwind responsive prefixes: sm:, md:, lg:, xl:
- Mobile-first design approach
- Circular buffer implemented with fixed-size array
- Warning toast at 50 items, hard stop at 100

---

### 9. Scale/Scope

**Decision**: Single-page React application with feature-based structure

**Rationale**:

- AGENTS.md specifies React static website
- Feature-based structure aligns with component organization principle
- Each feature in its own directory with types and tests
- Scalable to multiple features in future

**File Structure**:

```
src/
├── features/
│   └── tier-list/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       ├── types/
│       └── utils/
├── components/          # Shared components
├── hooks/              # Shared hooks
├── services/           # Shared services
├── types/              # Global types
└── utils/              # Shared utilities
```

---

## Integration Patterns

### @dnd-kit Integration

**Pattern**: Context-based drag-and-drop with sortable presets

```typescript
// Top-level provider
<DragDropProvider
  sensors={[mouseSensor, touchSensor, keyboardSensor]}
  collisionDetection={closestCenter}
  onDrop={handleDrop}
>
  <SortableContext items={tierIds} strategy={verticalListStrategy}>
    {tiers.map(tier => <SortableTier key={tier.id} {...tier} />)}
  </SortableContext>
</DragDropProvider>
```

**Accessibility**:

- Keyboard sensor for arrow key navigation
- Live regions for screen reader announcements
- Focus management during drag operations

### State Management Pattern

**Decision**: useReducer + Context API (no external library)

**Rationale**:

- Spec requires useState + useReducer with Context API
- No external state management library needed
- React Compiler optimizes automatically

**Pattern**:

```typescript
// Single reducer for all tier list actions
const tierListReducer = (state, action) => {
  switch (action.type) {
    case 'TIER_ADD':
      return addTier(state, action.payload);
    case 'ITEM_MOVE':
      return moveItem(state, action.payload);
    // ... all actions
  }
};

// Context for global access
const TierListContext = createContext<{
  state: TierListState;
  dispatch: React.Dispatch<TierListAction>;
}>(null!);
```

### IndexedDB Pattern

**Decision**: Transaction-based operations with idb library

```typescript
// Database schema
const db = await openDB('TierListDB', 1, {
  upgrade(db) {
    db.createObjectStore('tierLists', { keyPath: 'id' });
  },
});

// Save operation
async function saveTierList(tierList: TierList) {
  const tx = db.transaction('tierLists', 'readwrite');
  await tx.store.put(tierList);
  await tx.done;
}
```

---

## Security Considerations

### XSS Prevention

**Decision**: HTML entity escaping for user-provided content

**Implementation**:

```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

**Applied to**:

- Tier labels
- Item names
- Any user-provided text content

### Data Sanitization

**Decision**: Minimal sanitization approach

- Escape HTML entities only (`<`, `>`, `&`)
- No rich text support needed
- Images stored as blobs, not executed

---

## Accessibility Strategy

### Keyboard Navigation

**Pattern**: @dnd-kit keyboard sensor

- Tab to focus on draggable items
- Enter/Space to pick up item
- Arrow keys to move within list
- Enter/Space to drop
- Escape to cancel drag

### Screen Reader Support

**Pattern**: ARIA live regions with step-by-step cues

```typescript
// Announcements during drag
const announcements = {
  onDragStart: (id: string) =>
    `Picked up item ${id}. Press arrow keys to move, Enter to drop, Escape to cancel.`,
  onDragMove: (position: number) => `Position ${position} of ${total}.`,
  onDragEnd: (success: boolean) =>
    success ? 'Item dropped.' : 'Drag cancelled.',
};
```

### Touch Accessibility

**Pattern**: @dnd-kit touch sensor

- 44x44px minimum touch targets (SC-009)
- Touch-optimized collision detection
- Prevent scroll during drag on mobile

---

## Responsive Design Strategy

**Pattern**: Mobile-first Tailwind breakpoints

```typescript
// Breakpoint mapping
// sm: 640px  (large phones)
// md: 768px  (tablets)
// lg: 1024px (small laptops)
// xl: 1280px (desktops)

// Example responsive classes
<div className="
  flex-col           // mobile default
  sm:flex-row        // tablets+
  lg:flex-wrap       // desktops
">
```

**Tier List Layout**:

- Mobile: Single column, stacked tiers
- Tablet: Two columns if space allows
- Desktop: Full width with side controls

---

## Dark Mode Strategy

**Decision**: System-preference only via CSS media query

**Implementation**:

```css
@layer base {
  :root {
    --background: #ffffff;
    --foreground: #000000;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --background: #1a1a1a;
      --foreground: #ffffff;
    }
  }
}
```

**Tailwind**:

```typescript
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

**Rationale**:

- No manual toggle required (per spec clarification)
- Automatically switches with system preference
- Reduces state management complexity

---

## Error Handling Strategy

### IndexedDB Failures

**Pattern**: Immediate error notification, no retry

```typescript
try {
  await saveTierList(tierList);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    showError('Storage full. Please delete old tier lists.');
  } else {
    showError('Failed to save.');
  }
}
```

---

## Undo/Redo Implementation

**Decision**: Circular buffer with 50 action limit

**Pattern**:

```typescript
interface UndoRedoState {
  past: TierListState[]; // Max 50
  present: TierListState;
  future: TierListState[]; // Always empty after new action
}

function undoReducer(state: UndoRedoState, action: Action) {
  switch (action.type) {
    case 'UNDO':
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    case 'REDO':
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    default:
      // Add to past, clear future, enforce 50 limit
      return {
        past: [...state.past, state.present].slice(-50),
        present: newState,
        future: [],
      };
  }
}
```

---

## Image Storage Strategy

**Decision**: Store images as blobs in IndexedDB

**Rationale**:

- More efficient than base64 data URLs
- Smaller storage footprint
- Faster load times
- Native binary support in IndexedDB

**Implementation**:

```typescript
// Convert file to blob
const file = input.files[0];
const blob = file.slice(0, file.size, file.type);

// Store in IndexedDB
await db.put('images', { id: itemId, blob, type: file.type });

// Load and convert to URL for display
const record = await db.get('images', itemId);
const url = URL.createObjectURL(record.blob);
```

**Cleanup**:

- Revoke object URLs when component unmounts
- Store metadata (type, size) with blob

---

## Summary of Technology Choices

| Category         | Decision                      | Justification                                     |
| ---------------- | ----------------------------- | ------------------------------------------------- |
| Language         | TypeScript 5 (strict)         | Constitution requirement, type safety             |
| UI Framework     | React 19                      | Project standard                                  |
| Drag-and-Drop    | @dnd-kit/react                | Touch support, accessibility, React 19 compatible |
| State Management | useReducer + Context          | Spec requirement, no external dependency          |
| Storage          | IndexedDB + idb               | Large data, async, binary support                 |
| Testing          | Vitest 4 + Testing Library    | Project standard, TDD support                     |
| Styling          | Tailwind CSS 4                | Constitution requirement                          |
| Build Tool       | Vite 7                        | Project standard                                  |
| Accessibility    | @dnd-kit/accessibility + ARIA | Keyboard nav, screen reader support               |

---

## Risks & Mitigations

| Risk                              | Impact | Mitigation                                      |
| --------------------------------- | ------ | ----------------------------------------------- |
| @dnd-kit learning curve           | Medium | Study examples, use sortable presets            |
| IndexedDB browser inconsistencies | Low    | Use idb library which abstracts differences     |
| Touch drag-and-drop complexity    | Medium | @dnd-kit touch sensor handles most cases        |
| Performance with 100 items        | Medium | Monitor, optimize with React Compiler if needed |

---

## References

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [idb library](https://github.com/jakearchibald/idb)
- [Testing Library](https://testing-library.com/)
- [Vitest](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Compiler](https://react.dev/learn/react-compiler)
