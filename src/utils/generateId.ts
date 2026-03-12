/**
 * ID generation utility using crypto.randomUUID().
 * @packageDocumentation
 */

/**
 * Generates a unique identifier using the Crypto API.
 * @returns A UUID v4 string.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
