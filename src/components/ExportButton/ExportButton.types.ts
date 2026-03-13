/**
 * Type definitions for the ExportButton component.
 * @packageDocumentation
 */

/**
 * Props for the ExportButton component.
 */
export interface ExportButtonProps {
  /** Callback to trigger export operation. */
  onExport: () => Promise<void>;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Whether export is currently in progress. */
  isLoading?: boolean;
}
