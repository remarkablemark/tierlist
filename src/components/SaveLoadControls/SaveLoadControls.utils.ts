/**
 * Status message utilities for SaveLoadControls component.
 * @packageDocumentation
 */

import { type AutoSaveStatus } from '../../hooks/useAutoSave';

/**
 * Returns the CSS class name for the status message based on auto-save status.
 * @param status - The current auto-save status.
 * @returns CSS class name for styling the status message.
 */
export function getStatusClassName(status: AutoSaveStatus): string {
  return status === 'error' || status === 'quota-exceeded'
    ? 'text-red-600 dark:text-red-400'
    : '';
}
