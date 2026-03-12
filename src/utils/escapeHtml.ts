/**
 * HTML entity escaping utility to prevent XSS attacks.
 * @packageDocumentation
 */

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param text - The text to escape.
 * @returns The escaped text safe for HTML insertion.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
