# Feature Specification: Tier List Application

**Feature Branch**: `001-tier-list`
**Created**: 2026-03-11
**Status**: Done
**Input**: User description: "tier list"

## Clarifications

### Session 2026-03-11

- Q: How should items be uniquely identified and tracked within the system? → A: Unique ID (UUID) per item, generated at creation
- Q: What persistence mechanism should be used for saving and loading tier lists? → A: IndexedDB
- Q: What actions should be included in the undo/redo history? → A: All state-changing actions (tier create/delete/reorder, item add/move/delete, customization changes)
- Q: When a tier containing items is deleted, what should happen to those items? → A: Move items to an "Unassigned" area below the tiers
- Q: How should item images be provided and stored? → A: Data URLs (base64-encoded strings) stored in IndexedDB
- Q: What state management approach should be used for managing tier list state? → A: React useState + useReducer with Context API
- Q: How should users provide images for tier list items? → A: File picker dialog (local files via `<input type="file">`)
- Q: How should the tier list application handle mobile and touch device interactions? → A: Responsive with touch support: Full functionality on mobile/tablet with touch-optimized drag-and-drop using @dnd-kit touch sensors
- Q: What is the maximum number of items a user should be able to add to a single tier list? → A: 100 items with soft warning at 50+
- Q: What should be the undo/redo history limit? → A: 50 actions with circular buffer
- Q: How should the application handle IndexedDB save failures? → A: Show error immediately, no retry: Fast failure, user must act
- Q: How should the application handle dark mode / theme switching? → A: System-preference only: Auto-detect via `prefers-color-scheme` media query, no manual toggle
- Q: How should the application handle security and data sanitization for user-provided content (tier labels, item names)? → A: Minimal sanitization: Escape HTML entities only (`<`, `>`, `&`) to prevent XSS
- Q: How should the application handle concurrent editing of the same tier list in multiple browser tabs? → A: Tab-local isolation: Each tab works independently; changes only visible after manual refresh
- Q: What level of screen reader accessibility support should the application provide for drag-and-drop operations? → A: Guided: Announce available actions, provide step-by-step audio cues during drag (e.g., "Press Enter to pick up, arrow keys to move")

## User Scenarios & Testing

### User Story 1 - Create and Organize Tiers (Priority: P1)

As a user, I want to create a tier list with multiple ranked tiers so that I can categorize items by quality or preference.

**Why this priority**: This is the core functionality of a tier list application. Without the ability to create and organize tiers, the application has no value.

**Independent Test**: User can create a new tier list, add multiple tiers with custom labels (e.g., "S", "A", "B", "C", "D"), and see them displayed in ranked order.

**Acceptance Scenarios**:

1. **Given** a blank tier list canvas, **When** the user adds a new tier, **Then** the tier appears with a default label and can be renamed
2. **Given** existing tiers, **When** the user reorders tiers vertically, **Then** the visual ranking updates to reflect the new order
3. **Given** a tier list with multiple tiers, **When** the user deletes a tier, **Then** the tier is removed and any items in it are moved to an "Unassigned" area

---

### User Story 2 - Add and Drag Items into Tiers (Priority: P1)

As a user, I want to add items and drag them into specific tiers so that I can categorize and rank them.

**Why this priority**: Items are the content being ranked. Without items in tiers, the tier list serves no purpose. This works independently with manually created tiers.

**Independent Test**: User can add items to the tier list and drag each item into any tier, with items remaining in their assigned tier until moved.

**Acceptance Scenarios**:

1. **Given** a tier list with tiers, **When** the user adds a new item, **Then** the item appears in an unassigned area ready to be placed
2. **Given** an unassigned item, **When** the user drags and drops it into a tier, **Then** the item is visually contained within that tier
3. **Given** an item already in a tier, **When** the user drags it to a different tier, **Then** the item moves to the new tier
4. **Given** multiple items in a tier, **When** the user rearranges items within the tier, **Then** the items maintain their new order

---

### User Story 3 - Customize Tier Appearance (Priority: P2)

As a user, I want to customize the color and label of each tier so that I can visually distinguish between ranking levels.

**Why this priority**: Visual customization improves clarity and user expression, but the core ranking functionality works without it.

**Independent Test**: User can change the background color and label text of any tier, with changes immediately visible.

**Acceptance Scenarios**:

1. **Given** a tier, **When** the user changes its background color, **Then** the tier's visual appearance updates immediately
2. **Given** a tier with a default label, **When** the user edits the label text, **Then** the tier displays the new custom label
3. **Given** a customized tier, **When** the user resets the tier, **Then** it returns to default appearance

---

### User Story 4 - Save and Load Tier Lists (Priority: P2)

As a user, I want to save my tier list configurations and reload them later so that I don't lose my work.

**Why this priority**: Persistence is important for user retention and practical use, but users can still create tier lists without saving.

**Independent Test**: User can save a completed tier list and reload it later with all tiers, items, and customizations intact.

**Acceptance Scenarios**:

1. **Given** a completed tier list, **When** the user saves it, **Then** the configuration is stored and can be retrieved
2. **Given** saved tier lists, **When** the user loads a saved list, **Then** the tier list displays exactly as it was saved
3. **Given** a tier list in progress, **When** the user navigates away and returns, **Then** the work-in-progress is preserved

---

### Edge Cases

- When a tier containing items is deleted, items are moved to an "Unassigned" area below the tiers for user reassignment
- How does the system handle very long item names or tier labels? Text should truncate gracefully or wrap without breaking layout
- What happens when the browser is refreshed during editing? Work-in-progress should be auto-saved to prevent data loss (debounced save after each reducer commit and restore flow on load)
- How does the system handle attempting to drop items outside of valid drop zones? Drop should be prevented with visual feedback
- What happens when saving fails (e.g., storage full)? User should receive immediate error message to free storage
- When the same tier list is edited in multiple browser tabs simultaneously, each tab operates independently with changes only visible after manual refresh

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to create multiple tiers arranged in a vertical ranking order
- **FR-002**: System MUST allow users to assign custom labels to each tier (e.g., "S", "A", "B", "C", "D")
- **FR-003**: System MUST allow users to customize the background color of each tier
- **FR-004**: System MUST allow users to add items with text labels and optional images to the tier list
- **FR-004a**: System MUST provide a file picker dialog (`<input type="file">`) for users to select image files from their device, converting selected files to data URLs
- **FR-005**: System MUST support drag-and-drop interaction for moving items between tiers
- **FR-006**: System MUST support drag-and-drop interaction for reordering tiers vertically
- **FR-007**: System MUST support drag-and-drop interaction for rearranging items within a tier
- **FR-008**: System MUST visually distinguish between different tiers using color and labels
- **FR-009**: System MUST persist tier list configurations to IndexedDB to allow saving and loading
- **FR-009a**: System MUST display an immediate error notification if IndexedDB save fails, prompting user to free storage
- **FR-010**: System MUST provide undo/redo functionality for all state-changing actions including tier operations, item operations, and customization changes with a history limit of 50 actions using circular buffer
- **FR-011**: System MUST auto-save work-in-progress within 5 seconds of the last state change using a debounced save (≤500ms delay after idle) and persist state when the tab is closed (`beforeunload` listener) while displaying a non-blocking status indicator
- **FR-012**: System MUST allow users to delete tiers and items with confirmation
- **FR-012a**: System MUST move items from a deleted tier to an "Unassigned" area below the tiers for user reassignment
- **FR-014**: System MUST provide visual feedback during drag-and-drop operations (hover states, drop zones)
- **FR-015**: System MUST be fully accessible via keyboard navigation (tab, enter, arrow keys) with step-by-step screen reader audio cues during drag operations (e.g., "Press Enter to pick up, arrow keys to move")
- **FR-016**: System MUST support touch-based drag-and-drop interactions on mobile and tablet devices using @dnd-kit touch sensors
- **FR-017**: System MUST provide responsive layout that adapts to viewport widths from 320px to 1920px
- **FR-018**: System MUST allow up to 100 items per tier list and display a soft performance warning when 50+ items are added
- **FR-019**: System MUST automatically adapt to user's system color scheme preference (light/dark) using `prefers-color-scheme` media query
- **FR-020**: System MUST escape HTML entities (`<`, `>`, `&`) in all user-provided text content (tier labels, item names) to prevent XSS attacks

### Non-Functional Requirements

- **NFR-001 Performance**: Drag-and-drop interactions MUST respond within 100ms (matching SC-003) and maintain 60fps on modern browsers.
- **NFR-002 Accessibility**: All interactive elements MUST be keyboard accessible with screen reader prompts per FR-015 and SC-011, including touch targets ≥44x44px.
- **NFR-003 Persistence SLA**: Auto-save MUST limit potential data loss to ≤5 seconds, surface IndexedDB failures immediately, and log failures for diagnostics (ties to FR-009a, SC-007).
- **NFR-004 Reliability**: Tier lists with up to 100 items and 10 tiers MUST remain responsive without layout degradation, showing a warning at 50+ items (aligns with FR-018, SC-004).

### Key Entities

- **Tier List**: A collection of tiers arranged in ranked order, containing items to be categorized
- **Tier**: A ranked category within a tier list, with a label, color, and collection of items
- **Item**: An individual element to be ranked, identified by a unique UUID generated at creation, containing a text label and optional image stored as a data URL (base64)
- **Configuration**: The complete state of a tier list including tier order, labels, colors, and item assignments, persisted to IndexedDB
- **State Management**: React useState + useReducer with Context API (no external state management library)
- **Image Upload**: File picker dialog (`<input type="file">`) for selecting local image files, converted to data URLs

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a complete tier list with 5 tiers and 10 items in under 3 minutes
- **SC-002**: 95% of users successfully complete their first tier list without assistance or tutorial
- **SC-003**: Drag-and-drop operations complete with visual feedback in under 100 milliseconds
- **SC-004**: System supports tier lists with up to 100 items and 10 tiers without performance degradation; soft warning displayed at 50+ items
- **SC-005**: In moderated usability tests (n ≥ 20 participants) using a 5-point Likert scale, at least 90% of users rate the creation experience as "intuitive" or "very intuitive"
- **SC-007**: Auto-save preserves work-in-progress with less than 5 seconds of potential data loss
- **SC-008**: All interactive elements are accessible via keyboard with visible focus indicators
- **SC-009**: Touch drag-and-drop operations function correctly on viewports from 320px width with touch targets minimum 44x44px
- **SC-010**: Application correctly switches between light and dark themes when user changes system preference
- **SC-011**: Screen reader users receive audible step-by-step guidance during drag-and-drop operations (e.g., pickup, move, drop announcements)
