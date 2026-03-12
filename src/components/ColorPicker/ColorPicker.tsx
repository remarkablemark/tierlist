/**
 * ColorPicker component for selecting tier colors.
 * @packageDocumentation
 */

import { type MouseEvent, useState } from 'react';

import { COLOR_PALETTE, type ColorPickerProps } from './ColorPicker.types';

/**
 * ColorPicker component that displays a palette of predefined colors.
 */
export function ColorPicker({
  color,
  onColorSelect,
  onToggle,
}: ColorPickerProps): React.ReactElement {
  const [customColor, setCustomColor] = useState(color);

  const handleColorClick = (
    paletteColor: string,
    event: MouseEvent<HTMLButtonElement>,
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

  const handleCustomColorSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onColorSelect(customColor);
    onToggle?.();
  };

  return (
    <div className="absolute z-50 mt-2 rounded-md border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <div className="grid grid-cols-5 gap-2">
        {COLOR_PALETTE.map((paletteColor, index) => (
          <button
            key={`${paletteColor}-${String(index)}`}
            className={`h-8 w-8 rounded-md border-2 transition-all hover:scale-110 ${
              color === paletteColor
                ? 'border-slate-900 dark:border-white'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: paletteColor }}
            onClick={(event) => {
              handleColorClick(paletteColor, event);
            }}
            aria-label={`Select color ${paletteColor}`}
            type="button"
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="color"
          value={customColor}
          onChange={handleCustomColorChange}
          className="h-8 w-8 cursor-pointer rounded-md border border-slate-300 dark:border-slate-600"
          aria-label="Custom color picker"
        />
        <button
          className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          onClick={handleCustomColorSubmit}
          type="button"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
