/**
 * Type definitions for the AddItemButton component.
 * @packageDocumentation
 */

/**
 * Props for the AddItemButton component.
 */
export interface AddItemButtonProps {
  /**
   * Callback when a file is selected.
   */
  onFileSelect: (file: File) => void;
  /**
   * Current number of items in the tier list.
   */
  itemCount: number;
  /**
   * Maximum number of items allowed.
   */
  maxItems: number;
  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
}
