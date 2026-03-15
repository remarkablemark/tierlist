/**
 * ColorPicker component for selecting tier colors.
 * @packageDocumentation
 */

import { useEffect, useRef, useState } from 'react';
import { COLOR_PALETTE } from 'src/constants/colorPalette';

/**
 * Props for the ColorPicker component.
 */
interface ColorPickerProps {
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
 * ColorPicker component that displays a palette of predefined colors.
 */
export function ColorPicker({
  color,
  onColorSelect,
  onToggle,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onToggle?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onToggle]);

  const handleColorClick = (
    paletteColor: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    onColorSelect(paletteColor);
    onToggle?.();
  };

  const handleCustomColorChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCustomColor(event.target.value);
  };

  const handleCustomColorSubmit = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    onColorSelect(customColor);
    onToggle?.();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 z-50 mt-2 w-[220px] rounded-md border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="grid grid-cols-5 gap-2">
        {COLOR_PALETTE.map((paletteColor, index) => (
          <button
            key={`${paletteColor}-${String(index)}`}
            className={`h-8 w-8 cursor-pointer rounded-md border-2 transition-all hover:scale-110 ${
              color === paletteColor
                ? 'border-slate-900 dark:border-white'
                : 'border-slate-300 dark:border-slate-600'
            }`}
            style={{ backgroundColor: paletteColor }}
            onClick={(event) => {
              handleColorClick(paletteColor, event);
            }}
            aria-label={`Select color ${paletteColor}`}
            title={paletteColor}
            type="button"
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div
          className="h-8 w-8 overflow-hidden rounded-md border-2 border-slate-300 transition-all hover:scale-110 dark:border-slate-600"
          style={{ backgroundColor: customColor }}
        >
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="h-[160%] w-[160%] -translate-x-[18%] -translate-y-[18%] cursor-pointer border-0 p-0"
            aria-label="Custom color picker"
          />
        </div>

        <button
          className="cursor-pointer rounded-md bg-slate-100 px-3 py-1 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          onClick={handleCustomColorSubmit}
          type="button"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
