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
  '#e57373',
  '#ffb74d',
  '#fff176',
  '#aed581',
  '#81c784',
  '#64b5f6',
  '#ba68c8',
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
