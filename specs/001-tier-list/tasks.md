# Tasks: Tier List Application

**Input**: Design documents from `/specs/001-tier-list/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/interface-contracts.md, quickstart.md

**Tests**: TDD approach required per constitution principle I - tests written first, red-green-refactor cycle, 100% coverage required (barrel exports excluded). ⚠ Implementation tasks MAY NOT begin until all related tests in the same phase have been written and observed failing.

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Source code: `src/`
- Tests: Co-located with source files (`.test.tsx` or `.test.ts`)
- Single-page React application with flat component directories per plan (each component keeps its own folder under `src/components`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Verify Node.js 24, npm, and existing project structure
- [x] T002 Install idb library for IndexedDB: `npm install idb`
- [x] T003 [P] Install html2canvas for PNG export: `npm install html2canvas`
- [x] T004 [P] Install fake-indexeddb for testing: `npm install --save-dev fake-indexeddb`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Define TypeScript types in `src/types/tierList.types.ts`: TierList, Tier, TierListItem, ItemMetadata, TierListSettings, TierListState, TierListAction
- [x] T006 [P] Create utility: `src/utils/escapeHtml.ts` with escapeHtml function and tests
- [x] T007 [P] Create utility: `src/utils/validation.ts` with validateTierList, validateTier, validateItem, isValidCssColor, getTotalItemCount, findItemLocation and tests
- [x] T008 [P] Create utility: `src/utils/generateId.ts` with generateId function using crypto.randomUUID() and tests
- [x] T009 Create IndexedDB service: `src/services/storage.ts` with openDB, saveTierList, loadTierList, deleteTierList, saveImage, loadImage, deleteImage functions
- [x] T010 Write storage service tests: `src/services/storage.test.ts` mocking IndexedDB with fake-indexeddb
- [x] T011 Create tier list reducer: `src/store/tierListReducer.ts` implementing all TierListAction types (TIER_ADD, TIER_DELETE, TIER_REORDER, TIER_UPDATE_LABEL, TIER_UPDATE_COLOR, TIER_RESET, ITEM_ADD, ITEM_DELETE, ITEM_MOVE, ITEM_REORDER, ITEM_UPDATE_LABEL, DRAG_START, DRAG_MOVE, DRAG_END, UNDO, REDO, SETTINGS_UPDATE, LOAD, SAVE_REQUEST, SAVE_SUCCESS, SAVE_ERROR)
- [x] T012 Write reducer tests: `src/store/tierListReducer.test.ts` covering all action types
- [x] T013 Create context provider: `src/store/tierListContext.tsx` with TierListContext, TierListProvider, useTierListContext
- [x] T014 Write context tests: `src/store/tierListContext.test.tsx` testing provider and hook
- [x] T019 [P] [US1] Unit test: createDefaultTierList produces DEFAULT_TIERS baseline in `src/utils/createDefaultTierList.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Organize Tiers (Priority: P1) 🎯 MVP

**Goal**: Users can create a tier list with multiple ranked tiers, add tiers with custom labels, reorder tiers vertically, and delete tiers with items moving to unassigned area

**Independent Test**: User can create a new tier list, add multiple tiers with custom labels (e.g., "S", "A", "B", "C", "D"), see them displayed in ranked order, reorder them, and delete a tier

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Do not start T020-T030 while these tests are red.**

- [x] T015 [P] [US1] Component test: TierList renders with default tiers in `src/components/TierList/TierList.test.tsx`
- [x] T016 [P] [US1] Component test: Tier displays label and color in `src/components/Tier/Tier.test.tsx`
- [x] T017 [P] [US1] Integration test: Add tier flow in `src/components/TierList/TierList.test.tsx`
- [x] T018 [P] [US1] Integration test: Delete tier with items moves to unassigned in `src/components/TierList/TierList.test.tsx`
- [x] T019 [P] [US1] Unit test: createDefaultTierList produces DEFAULT_TIERS baseline in `src/utils/createDefaultTierList.test.ts`

### Implementation for User Story 1

- [x] T020 [P] [US1] Create default tier list factory: `src/utils/createDefaultTierList.ts` with createDefaultTierList function and DEFAULT_TIERS array
- [x] T021 [US1] Create TierList component: `src/components/TierList/TierList.tsx` with DragDropProvider provider, renders tiers, handles tier add/delete/reorder
- [x] T022 [US1] Create TierList types: `src/components/TierList/TierList.types.ts` with TierListProps interface
- [x] T023 [US1] Create barrel export: `src/components/TierList/index.ts`
- [x] T024 [US1] Create Tier component: `src/components/Tier/Tier.tsx` with SortableContext, renders tier label, color, delete button, drop zone
- [x] T025 [US1] Create Tier types: `src/components/Tier/Tier.types.ts` with TierProps interface
- [x] T026 [US1] Create barrel export: `src/components/Tier/index.ts`
- [x] T027 [US1] Create useTierList hook: `src/hooks/useTierList.ts` wrapping context with tier operations (addTier, deleteTier, reorderTiers, updateTierLabel, updateTierColor, resetTier)
- [x] T028 [US1] Write useTierList hook tests: `src/hooks/useTierList.test.ts`
- [x] T029 [US1] Add unassigned items area UI in TierList component for items from deleted tiers

**Checkpoint**: User Story 1 complete - users can create, organize, and delete tiers independently

---

## Phase 4: User Story 2 - Add and Drag Items into Tiers (Priority: P1) 🎯 MVP

**Goal**: Users can add items with images, drag items into tiers, move items between tiers, and rearrange items within tiers

**Independent Test**: User can add items to the tier list and drag each item into any tier, with items remaining in their assigned tier until moved

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Do not start T035-T045 while these tests are red.**

- [x] T030 [P] [US2] Component test: TierListItem renders with image and label in `src/components/TierListItem/TierListItem.test.tsx`
- [x] T031 [P] [US2] Component test: AddItemButton opens file picker in `src/components/AddItemButton/AddItemButton.test.tsx`
- [x] T032 [P] [US2] Integration test: Drag item from unassigned to tier with hover/drop visual cues in `src/components/TierList/TierList.test.tsx`
- [x] T033 [P] [US2] Integration test: Move item between tiers and verify visual feedback persists in `src/components/TierList/TierList.test.tsx`

### Implementation for User Story 2

- [x] T034 [P] [US2] Create image upload utility: `src/utils/imageUpload.ts` with fileToBlob, blobToDataUrl functions and tests
- [x] T035 [P] [US2] Create TierListItem component: `src/components/TierListItem/TierListItem.tsx` with SortableItem, renders image, label, drag handle
- [x] T036 [US2] Create TierListItem types: `src/components/TierListItem/TierListItem.types.ts` with TierListItemComponentProps interface
- [x] T037 [US2] Create barrel export: `src/components/TierListItem/index.ts`
- [x] T038 [US2] Create AddItemButton component: `src/components/AddItemButton/AddItemButton.tsx` with file input, item count validation, warning at 50+ items
- [x] T039 [US2] Create AddItemButton types: `src/components/AddItemButton/AddItemButton.types.ts` with AddItemButtonProps interface
- [x] T040 [US2] Create barrel export: `src/components/AddItemButton/index.ts`
- [x] T041 [US2] Extend useTierList hook with item operations: addItem, deleteItem, moveItem, reorderItem, updateItemLabel
- [x] T042 [US2] Implement drag-and-drop handlers in TierList component using @dnd-kit/react onDragEnd with hover/drop zone styling hooks
- [x] T043 [US2] Add collision detection for item drops in tiers using @dnd-kit/react closestCenter
- [x] T044 [US2] Implement item reordering within tiers using @dnd-kit/react sortable

**Checkpoint**: User Stories 1 AND 2 complete - full tier list creation and item management functional

---

## Phase 5: User Story 3 - Customize Tier Appearance (Priority: P2)

**Goal**: Users can customize the background color and label of each tier, with changes immediately visible

**Independent Test**: User can change the background color and label text of any tier, with changes immediately visible

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Do not start T048-T053 while these tests are red.**

- [x] T045 [P] [US3] Component test: Tier color picker updates color in `src/components/Tier/Tier.test.tsx`
- [x] T046 [P] [US3] Component test: Tier label input updates label in `src/components/Tier/Tier.test.tsx`
- [x] T047 [P] [US3] Integration test: Customize tier and verify persistence in `src/components/TierList/TierList.test.tsx`

### Implementation for User Story 3

- [x] T048 [P] [US3] Create color picker component: `src/components/ColorPicker/ColorPicker.tsx` with predefined color palette, custom color input
- [x] T049 [US3] Create ColorPicker types: `src/components/ColorPicker/ColorPicker.types.ts`
- [x] T050 [US3] Create barrel export: `src/components/ColorPicker/index.ts`
- [x] T051 [US3] Add tier customization UI to Tier component: color picker button, label edit input, reset button
- [x] T052 [US3] Extend useTierList hook with customization operations: updateTierColor, updateTierLabel, resetTier
- [x] T053 [US3] Add tier customization actions to reducer: TIER_UPDATE_COLOR, TIER_UPDATE_LABEL, TIER_RESET with isCustomColor and isCustomLabel flags

**Checkpoint**: User Story 3 complete - tier customization functional independently

---

## Phase 6: User Story 4 - Save and Load Tier Lists (Priority: P2)

**Goal**: Users can save tier list configurations to IndexedDB and reload them later with all tiers, items, and customizations intact

**Independent Test**: User can save a completed tier list and reload it later with all tiers, items, and customizations intact

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Do not start T058-T065 while these tests are red.**

- [x] T054 [P] [US4] Integration test: Save tier list and verify IndexedDB storage in `src/services/storage.test.ts`
- [x] T055 [P] [US4] Integration test: Load saved tier list and verify state restoration in `src/components/TierList/TierList.test.tsx`
- [x] T056 [P] [US4] Error test: Handle IndexedDB save failure with user notification in `src/services/storage.test.ts`
- [x] T057 [P] [US4] Hook test: Auto-save debounces saves (≤500ms), registers `beforeunload`, and surfaces non-blocking status indicator in `src/hooks/useAutoSave.test.ts`
- [ ] T058 [US4] Integration test: Auto-saved work-in-progress restores after refresh/navigation in `src/components/TierList/TierList.test.tsx`

### Implementation for User Story 4

- [x] T059 [P] [US4] Create auto-save hook: `src/hooks/useAutoSave.ts` that debounces saves (≤500ms), registers `beforeunload` persistence, displays non-blocking status indicator, and logs failures
- [x] T060 [US4] Create save/load UI component: `src/components/SaveLoadControls/SaveLoadControls.tsx` with save button, load list, delete saved list
- [x] T061 [US4] Create SaveLoadControls types: `src/components/SaveLoadControls/SaveLoadControls.types.ts`
- [x] T062 [US4] Create barrel export: `src/components/SaveLoadControls/index.ts`
- [x] T063 [US4] Extend useTierList hook with persistence operations: save, load, createNew, getAllSaved
- [x] T064 [US4] Add persistence actions to reducer: LOAD, SAVE_REQUEST, SAVE_SUCCESS, SAVE_ERROR
- [x] T065 [US4] Implement IndexedDB error handling with user notifications (QuotaExceededError, NotFoundError)
- [x] T066 [US4] Wire auto-save hook into TierList lifecycle to trigger debounced saves on reducer commits, handle `beforeunload`, and enqueue failure logs in IndexedDB
- [x] T067 [US4] Implement restoration flow leveraging auto-save snapshot when app initializes (TierList + context)

**Checkpoint**: User Story 4 complete - persistence functional independently

---

## Phase 7: User Story 5 - Export Tier List as Image (Priority: P3)

**Goal**: Users can export their tier list as a downloadable PNG image file that accurately represents the visual layout

**Independent Test**: User can generate a downloadable PNG image file from their completed tier list that accurately represents the visual layout

### Tests for User Story 5 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Do not start T068-T074 while these tests are red.**

- [ ] T068 [P] [US5] Integration test: Export generates PNG file in `src/components/ExportButton/ExportButton.test.tsx`
- [ ] T069 [P] [US5] Error test: Export failure shows error message in `src/components/ExportButton/ExportButton.test.tsx`
- [ ] T070 [P] [US5] Validation test: Export enforces ≥1080px width, 2x scale, and displays standardized error banner copy in `src/components/ExportButton/ExportButton.test.tsx`

### Implementation for User Story 5

- [x] T071 [P] [US5] Create export utility: `src/utils/exportToPng.ts` with exportTierListToPng function using html2canvas, enforcing ≥1080px width, 2x scale, and returning standardized error messages plus failure logging hook
- [x] T072 [P] [US5] Write export utility tests: `src/utils/exportToPng.test.ts` mocking html2canvas
- [x] T073 [US5] Create ExportButton component: `src/components/ExportButton/ExportButton.tsx` with loading state, standardized error banner messaging, download trigger, and logging of failures to IndexedDB
- [x] T074 [US5] Create ExportButton types: `src/components/ExportButton/ExportButton.types.ts` with ExportButtonProps interface
- [x] T075 [US5] Create barrel export: `src/components/ExportButton/index.ts`
- [x] T076 [US5] Extend useTierList hook with exportToPng operation
- [x] T077 [US5] Add export container ref for capturing tier list canvas at full resolution

**Checkpoint**: User Story 5 complete - export functional independently

---

## Phase 8: Undo/Redo (Cross-Cutting - Priority: P1)

**Goal**: Users can undo and redo all state-changing actions with a 50-action history limit using circular buffer

**Independent Test**: User can perform undo/redo on tier operations, item operations, and customization changes

### Tests for Undo/Redo ⚠️

- [x] T078 [P] Unit test: Undo action restores previous state in `src/store/tierListReducer.test.ts`
- [x] T079 [P] Unit test: Redo action restores future state in `src/store/tierListReducer.test.ts`
- [x] T080 [P] Unit test: 50-action limit with circular buffer in `src/store/tierListReducer.test.ts`
- [x] T081 [P] Integration test: Undo/redo UI updates canUndo/canRedo in `src/components/UndoRedoControls/UndoRedoControls.test.tsx`

### Implementation for Undo/Redo

- [x] T082 Wrap TierListState with undo/redo wrapper: past array (max 50), present state, future array
- [x] T083 Implement UNDO action in reducer: moves present to future, restores from past
- [x] T084 Implement REDO action in reducer: moves present to past, restores from future
- [x] T085 Implement circular buffer: enforce 50-action limit, clear future on new actions
- [x] T086 Create UndoRedoControls component: `src/components/UndoRedoControls/UndoRedoControls.tsx` with undo/redo buttons, disabled states, keyboard shortcuts display
- [x] T087 Create UndoRedoControls types: `src/components/UndoRedoControls/UndoRedoControls.types.ts` with UndoRedoControlsProps interface
- [x] T088 Create barrel export: `src/components/UndoRedoControls/index.ts`
- [x] T089 Extend useTierList hook with undo, redo operations and canUndo, canRedo computed values

**Checkpoint**: Undo/redo complete - all state changes are reversible

---

## Phase 9: Accessibility (Priority: P1)

**Goal**: Application is fully accessible via keyboard navigation with screen reader support

**Independent Test**: Users can navigate and operate all features using keyboard only, with screen reader announcements

### Tests for Accessibility ⚠️

- [ ] T090 [P] Accessibility test: Keyboard navigation for drag-and-drop in `src/components/TierList/TierList.test.tsx`
- [ ] T091 [P] Accessibility test: Screen reader announcements for drag pickup/move/drop (covers FR-014/FR-015) in `src/components/TierList/TierList.test.tsx`
- [ ] T092 [P] Accessibility test: Focus indicators visible in all components

### Implementation for Accessibility

- [ ] T093 [P] Configure @dnd-kit/react keyboard sensor in useTierList hook
- [ ] T094 [P] Configure @dnd-kit/react touch sensor with activation constraint (distance: 5)
- [ ] T095 Add ARIA labels to all interactive elements: TierList (role="application"), Tier (role="region"), TierListItem (role="listitem")
- [ ] T096 Add aria-grabbed to draggable items, aria-dropeffect to drop zones
- [ ] T097 Create live region for screen reader announcements during drag operations
- [ ] T098 Implement step-by-step audio cues: "Press Enter to pick up, arrow keys to move, Enter to drop"
- [ ] T099 Ensure 44x44px minimum touch targets via Tailwind classes (min-h-11 min-w-11)
- [ ] T100 Add visible focus indicators: focus:ring-2 focus:ring-offset-2 on all interactive elements
- [ ] T101 Add keyboard instructions to aria-describedby for draggable items

**Checkpoint**: Accessibility complete - application usable via keyboard and screen reader

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T102 [P] Add responsive design: mobile-first Tailwind breakpoints (sm:, md:, lg:, xl:) for 320px-1920px viewport
- [ ] T103 [P] Implement dark mode support: system-preference only via prefers-color-scheme media query, dark: prefix classes
- [ ] T104 [P] Add performance warning: display toast when item count >= 50, hard stop at 100 items
- [ ] T105 [P] Add loading states: skeleton loaders for tier list, items, export
- [ ] T106 [P] Add error boundaries: component-level error boundaries with fallback UI
- [ ] T107 [P] Write integration tests: complete user journey from create to save to export
- [ ] T108 [P] Run test coverage: `npm run test:ci` and verify 100% coverage (excluding barrel exports)
- [ ] T109 [P] Run type check: `npm run lint:tsc` with zero errors
- [ ] T110 [P] Run linter: `npm run lint` with zero errors
- [ ] T111 [P] Update quickstart.md: validate all commands and paths work correctly
- [ ] T112 [P] Add TSDoc comments to all public APIs: components, hooks, utilities
- [ ] T113 [P] Code cleanup: remove unused imports, dead code, console statements

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) after Foundational is complete
  - Or sequentially in priority order (P1 → P2 → P3)
- **Undo/Redo (Phase 8)**: Can start after Foundational, runs parallel to user stories
- **Accessibility (Phase 9)**: Should be integrated throughout user story implementation
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent but integrates with US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent customization
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent persistence
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent export

### Within Each User Story

1. Tests MUST be written and FAIL before implementation (TDD)
2. Models/utilities before components
3. Core implementation before integration
4. Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase**:

- T003 (html2canvas) and T004 (fake-indexeddb) can install in parallel

**Foundational Phase**:

- T007 (escapeHtml), T008 (validation), T009 (generateId) utilities can develop in parallel
- T010 (storage) and T012 (reducer) can develop in parallel

**User Story 1**:

- T015, T016, T017, T018 (tests) can run in parallel
- T019 (createDefaultTierList) and T015-T018 (tests) can start in parallel

**User Story 2**:

- T030, T031, T032, T033 (tests) can run in parallel
- T034 (imageUpload) and T035 (TierListItem) can develop in parallel

**User Story 3**:

- T045, T046, T047 (tests) can run in parallel
- T048 (ColorPicker) and T051 (Tier customization UI) can develop in parallel

**User Story 4**:

- T054, T055, T056, T057 (tests) can run in parallel
- T058 (useAutoSave) and T059 (SaveLoadControls) can develop in parallel

**User Story 5**:

- T068, T069, T070 (tests) can run in parallel
- T071 (exportToPng) and T073 (ExportButton) can develop in parallel

**Undo/Redo**:

- T078, T079, T080, T081 (tests) can run in parallel

**Accessibility**:

- T090, T091 (sensors) can configure in parallel
- T092-T098 (ARIA, live regions, focus) can implement in parallel

**Polish**:

- T102-T107 can implement in parallel
- T108-T113 (validation) should run sequentially at end

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
npm test -- src/components/TierList/TierList.test.tsx &
npm test -- src/components/Tier/Tier.test.tsx &

# Launch utilities in parallel:
# Developer A: T019 createDefaultTierList.ts
# Developer B: T015-T018 tests
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
npm test -- src/components/TierListItem/TierListItem.test.tsx &
npm test -- src/components/AddItemButton/AddItemButton.test.tsx &
npm test -- src/components/TierList/TierList.test.tsx &

# Launch implementation in parallel:
# Developer A: T034 imageUpload.ts
# Developer B: T035 TierListItem.tsx
# Developer C: T038 AddItemButton.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T014)
3. Complete Phase 3: User Story 1 (T015-T029)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Can create tier list with tiers?
   - Can add/delete/reorder tiers?
   - Do all tests pass with 100% coverage?
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add Undo/Redo → Test independently → Deploy/Demo
8. Polish → Final validation → Production

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T015-T029)
   - Developer B: User Story 2 (T030-T044)
   - Developer C: User Story 3 (T045-T053) + User Story 4 (T054-T067)
3. Stories complete and integrate independently
4. Team reconvenes for Undo/Redo (T078-T089)
5. Team reconvenes for Accessibility (T090-T101)
6. Team reconvenes for Polish (T102-T113)

---

## Task Summary

| Phase     | Description       | Task Count |
| --------- | ----------------- | ---------- |
| Phase 1   | Setup             | 4          |
| Phase 2   | Foundational      | 10         |
| Phase 3   | User Story 1 (P1) | 15         |
| Phase 4   | User Story 2 (P1) | 15         |
| Phase 5   | User Story 3 (P2) | 9          |
| Phase 6   | User Story 4 (P2) | 14         |
| Phase 7   | User Story 5 (P3) | 10         |
| Phase 8   | Undo/Redo         | 12         |
| Phase 9   | Accessibility     | 12         |
| Phase 10  | Polish            | 12         |
| **Total** |                   | **113**    |

### Task Count per User Story

- **User Story 1**: 15 tasks (T015-T029)
- **User Story 2**: 15 tasks (T030-T044)
- **User Story 3**: 9 tasks (T045-T053)
- **User Story 4**: 14 tasks (T054-T067)
- **User Story 5**: 10 tasks (T068-T077)

### Suggested MVP Scope

**Minimum Viable Product** (User Story 1 + User Story 2 only):

- T001-T044 (Setup + Foundational + US1 + US2)
- Users can create tier lists, add tiers, add items, drag items into tiers
- Total: 44 tasks

**Extended MVP** (add Undo/Redo):

- T001-T044 + T078-T089
- Users can undo/redo their actions
- Total: 56 tasks

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD red-green-refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- React Compiler handles memoization automatically - no manual useMemo/useCallback needed
- All styling uses Tailwind CSS only - no custom CSS files
- System-preference dark mode only - no manual toggle

---

## Format Validation

✅ ALL tasks follow the checklist format:

- Checkbox: `- [ ]`
- Task ID: T001, T002, T003...
- [P] marker for parallelizable tasks
- [Story] label for user story phase tasks (US1, US2, US3, US4, US5)
- Description with file path
