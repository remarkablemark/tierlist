/**
 * Type definitions for the ColorPicker component.
 * @packageDocumentation
 */

/**
 * Props for the ColorPicker component.
 */
export interface ColorPickerProps {
  /**
   * Currently selected color.
   */
  color: string;
  /**
   * Callback when color is selected.
   */
  onColorSelect: (color: string) => void;
  /**
   * Whether the color picker is open.
   */
  isOpen?: boolean;
  /**
   * Callback to toggle the color picker.
   */
  onToggle?: () => void;
}

/**
 * Predefined color palette for tier colors.
 */
export const COLOR_PALETTE: string[] = [
  '#ff7f7f',
  '#ffbf7f',
  '#ffff7f',
  '#bfff7f',
  '#7fff7f',
  '#7fbfff',
  '#bf7fff',
  '#ff7fff',
  '#7f7fff',
  '#7fffff',
  '#ff7fbf',
  '#7fff7f',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#000000',
  '#ffffff',
];
