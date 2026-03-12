<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (Component architecture clarification)
Modified principles:
  - III. Component Architecture (removed feature-based directory requirement)
Added sections: N/A
Removed sections: N/A
Templates requiring updates:
  - ✅ plan-template.md (no changes needed - generic)
  - ✅ spec-template.md (no changes needed - generic)
  - ✅ tasks-template.md (no changes needed - generic)
Follow-up TODOs: None
-->

# Tier List Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

All feature development MUST follow Test-Driven Development (TDD) methodology:

- Tests MUST be written before implementation code
- Tests MUST fail initially (Red phase)
- Implementation MUST make tests pass (Green phase)
- Code MUST be refactored while keeping tests green (Refactor phase)
- 100% test coverage required for statements, branches, functions, and lines
- Barrel exports (index.ts files) are excluded from coverage requirements

**Rationale**: TDD ensures code correctness, reduces regressions, and provides living documentation. The red-green-refactor cycle prevents over-engineering and validates every line of production code.

### II. TypeScript Strict Mode

All TypeScript code MUST adhere to strict type-checking:

- No implicit any types allowed
- All function parameters and return types MUST be explicitly typed
- Use interfaces for object shapes and component props
- Use proper React event types (React.MouseEvent, React.FormEvent, etc.)
- Type guards MUST be used for runtime type checking where needed

**Rationale**: Strict typing catches errors at compile-time, improves IDE support, and serves as self-documenting code.

### III. Component Architecture

React components MUST follow these patterns:

- Functional components only (no class components)
- Hooks MUST be used at the top level (never inside loops or conditions)
- Props MUST be destructured in function signature
- Each component MUST have its own directory with types and tests
- Use semantic HTML elements (header, nav, main, button, etc.)

**Rationale**: Consistent component structure improves maintainability, readability, and team collaboration.

### IV. Accessibility First

All user-facing features MUST be accessible:

- Proper ARIA labels MUST be included where semantic HTML is insufficient
- All interactive elements MUST support keyboard navigation
- Images MUST have descriptive alt text
- Color contrast MUST meet WCAG guidelines
- Focus states MUST be visible and logical

**Rationale**: Accessibility ensures the application is usable by all users and is a legal requirement in many contexts.

### V. Tailwind-Only Styling

All styling MUST use Tailwind CSS utility classes:

- No custom CSS files unless absolutely necessary (must be justified)
- Responsive design MUST use Tailwind responsive prefixes (sm:, md:, lg:)
- Dark mode MUST use dark: prefix
- Component variants MUST follow consistent Tailwind patterns

**Rationale**: Tailwind provides consistent design tokens, reduces CSS bundle size, and eliminates styling context-switching.

## Code Quality Standards

### Linting and Formatting

- ESLint MUST pass with zero errors before any commit
- Prettier MUST be used for code formatting (auto-formatted on save)
- No console.log statements in production code
- No debugger statements (will cause ESLint errors)
- TSDoc comments REQUIRED for public APIs and complex functions

### Naming Conventions

- Components: PascalCase (UserProfile, NavigationMenu)
- Functions: camelCase (getUserData, handleSubmit)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL, MAX_RETRIES)
- Files:
  - Components: ComponentName.tsx
  - Types: ComponentName.types.ts
  - Utilities: utilityName.ts
  - Tests: ComponentName.test.tsx

### Error Handling

- Async operations MUST use try-catch blocks
- Promise rejections MUST be handled properly
- Error boundaries MUST be implemented for component error handling
- Type guards MUST be used for runtime type validation

## Development Workflow

### Git Workflow

- Conventional Commits MUST be used for commit messages
- Husky hooks enforce code quality on commits
- lint-staged runs checks on staged files only
- Branch naming: [number]-[feature-name] (e.g., 001-add-tier-drag-drop)

### Testing Standards

- Vitest MUST be used for all tests
- Testing Library (@testing-library/react) for component testing
- @testing-library/user-event for simulating user interactions
- External dependencies MUST be mocked (API calls, browser APIs)
- Test names MUST clearly state what is being tested
- Tests MUST be written first (TDD) and validated before implementation

### Build and Deployment

- Production builds MUST pass without errors (npm run build)
- Type checking MUST pass (npm run lint:tsc)
- All tests MUST pass (npm run test:ci)
- React Compiler handles memoization automatically (no manual useMemo/useCallback)

## Governance

### Amendment Process

This constitution supersedes all other development practices. Amendments require:

1. Documentation of the proposed change
2. Justification for the change (problem it solves)
3. Migration plan for existing code if needed
4. Update to version number following semantic versioning

### Versioning Policy

- **MAJOR**: Backward incompatible changes (principle removals, redefinitions)
- **MINOR**: New principles added or existing principles materially expanded
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

- All pull requests MUST verify constitution compliance
- Code reviewers MUST check for principle violations
- Complexity MUST be justified with simpler alternatives rejected
- This constitution MUST be reviewed quarterly for relevance

**Version**: 1.1.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-11
