# Implementation Plan: Tier List Application

**Branch**: `001-tier-list` | **Date**: 2026-03-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-tier-list/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a client-side React application for creating and managing tier lists with drag-and-drop functionality. Users can create ranked tiers, add items with images, categorize items into tiers, and customize appearance. Technical approach: React 19 with @dnd-kit for accessible drag-and-drop, useReducer + Context API for state management, in-memory state only (no persistence), and Tailwind CSS for styling.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: React 19, @dnd-kit/react (core, sortable, touch-sensor, accessibility)
**Storage**: In-memory state only (no persistence)
**Testing**: Vitest 4 + @testing-library/react + @testing-library/user-event
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
**Project Type**: Frontend-only web application (SPA)
**Performance Goals**: 60fps drag-and-drop, <100ms visual feedback
**Constraints**: Responsive 320px-1920px, 100 items max (soft warning at 50+), 50-action undo limit, system-preference dark mode only
**Scale/Scope**: Single-page React app with feature-based organization, tab-local isolation (no cross-tab sync)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Gate Evaluation

| Principle                       | Status  | Notes                                                                                                                                                |
| ------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Test-First Development**   | ✅ PASS | TDD will be followed: tests written first, red-green-refactor cycle, 100% coverage required (barrel exports excluded)                                |
| **II. TypeScript Strict Mode**  | ✅ PASS | TypeScript 5 with strict mode, explicit types for all functions, interfaces for object shapes, proper React event types                              |
| **III. Component Architecture** | ✅ PASS | Functional components only, hooks at top level, props destructured, feature-based directories, each component has own directory with types and tests |
| **IV. Accessibility First**     | ✅ PASS | ARIA labels, keyboard navigation via @dnd-kit keyboard sensor, screen reader announcements, visible focus indicators, 44x44px touch targets          |
| **V. Tailwind-Only Styling**    | ✅ PASS | All styling uses Tailwind utility classes, responsive prefixes (sm:, md:, lg:), dark: prefix for system preference                                   |

### Code Quality Standards Compliance

- ✅ ESLint will pass with zero errors before commits
- ✅ Prettier formatting applied
- ✅ No console.log statements (proper error handling only)
- ✅ No debugger statements
- ✅ TSDoc comments for public APIs
- ✅ Naming conventions: PascalCase components, camelCase functions, UPPER_SNAKE_CASE constants

### Development Workflow Compliance

- ✅ Conventional Commits for git messages
- ✅ Husky hooks enforce code quality
- ✅ Vitest for testing, Testing Library for components
- ✅ Mock @dnd-kit context for isolated component tests
- ✅ React Compiler handles memoization (no manual optimization)

**Result**: ✅ ALL GATES PASS - No violations. Plan aligns with constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-tier-list/
├── plan.md              # This implementation plan
├── research.md          # Phase 0 output - Technical decisions and best practices
├── data-model.md        # Phase 1 output - Entity definitions and validation
├── quickstart.md        # Phase 1 output - Getting started guide
├── contracts/           # Phase 1 output - Interface contracts
│   └── interface-contracts.md
└── tasks.md             # Phase 2 output - Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── TierList/
│   │   ├── TierList.tsx
│   │   ├── TierList.test.tsx
│   │   └── index.ts
│   ├── Tier/
│   │   ├── Tier.tsx
│   │   ├── Tier.types.ts
│   │   ├── Tier.test.tsx
│   │   └── index.ts
│   ├── TierListItem/
│   │   ├── TierListItem.tsx
│   │   ├── TierListItem.types.ts
│   │   ├── TierListItem.test.tsx
│   │   └── index.ts
│   ├── AddItemButton/
│   │   ├── AddItemButton.tsx
│   │   ├── AddItemButton.types.ts
│   │   ├── AddItemButton.test.tsx
│   │   └── index.ts
│   ├── ColorPicker/
│   │   ├── ColorPicker.tsx
│   │   ├── ColorPicker.test.tsx
│   │   └── index.ts
│   ├── UndoRedoControls/
│   │   ├── UndoRedoControls.tsx
│   │   ├── UndoRedoControls.types.ts
│   │   ├── UndoRedoControls.test.tsx
│   │   └── index.ts
│   └── SaveLoadControls/
│       ├── SaveLoadControls.tsx
│       ├── SaveLoadControls.types.ts
│       ├── SaveLoadControls.test.tsx
│       └── index.ts
├── hooks/
│   ├── useTierList.ts
│   └── useTierList.test.ts
├── services/
│   ├── storage.ts
│   └── storage.test.ts
├── store/
│   ├── tierListReducer.ts
│   ├── tierListReducer.test.ts
│   ├── tierListContext.tsx
│   └── tierListContext.test.tsx
├── constants/
│   ├── tierList.ts
│   └── colorPalette.ts
├── types/
│   └── tierList.ts
└── utils/
    ├── escapeHtml.ts
    ├── escapeHtml.test.ts
    ├── validation.ts
    └── validation.test.ts
```

**Structure Decision**: Flat structure without feature directories. Since this app has a single feature (the tier list), the extra nesting of `features/tier-list/` is unnecessary overhead. Components live in `src/components/`, with shared utilities in `src/hooks/`, `src/services/`, `src/store/`, and `src/utils/`. This matches the existing `src/components/App/` pattern and keeps navigation simple. Refactor to feature-based structure only if genuinely separate features are added later.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied by this plan.

---

## Phase 2: Implementation Planning

**Status**: READY FOR TASK CREATION

### Prerequisites Complete

- [x] Phase 0: Research completed (`research.md`)
- [x] Phase 1: Data model defined (`data-model.md`)
- [x] Phase 1: Interface contracts defined (`contracts/interface-contracts.md`)
- [x] Phase 1: Quick start guide created (`quickstart.md`)
- [x] Phase 1: Agent context updated (QWEN.md)
- [x] Constitution Check: Re-evaluated post-design - ALL GATES PASS

### Next Steps

1. **Create Tasks**: Run `/speckit.tasks` to generate `tasks.md` with implementation tasks
2. **Create Checklist**: Run `/speckit.checklist` to generate verification checklist
3. **Begin Implementation**: Follow TDD workflow (red-green-refactor)

### Implementation Phases

**Phase 2.1: Core Infrastructure**

- Define TypeScript types
- Implement tier list reducer
- Create context provider
- Set up IndexedDB

**Phase 2.2: Tier Components**

- TierList component
- Tier component with drag-and-drop
- Tier reordering, labeling, coloring
- Tier deletion with item recovery

**Phase 2.3: Item Components**

- TierListItem component
- File upload for images
- Item drag-and-drop between tiers
- Item deletion

**Phase 2.4: Undo/Redo**

- Wrap state with undo/redo
- Implement UNDO/REDO actions
- 50-action circular buffer

**Phase 2.5: Accessibility**

- Keyboard navigation
- Screen reader announcements
- ARIA labels
- Touch target sizing

**Phase 2.6: Testing & Polish**

- Unit tests for reducer
- Component tests
- Integration tests
- 100% coverage achievement
