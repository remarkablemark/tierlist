/**
 * Tests for the generateId utility function.
 */

import { generateId } from './generateId';

describe('generateId', () => {
  it('generates a valid UUID v4 format', () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const id = generateId();
    expect(id).toMatch(uuidRegex);
  });

  it('generates unique IDs', () => {
    const ids = new Set([generateId(), generateId(), generateId()]);
    expect(ids.size).toBe(3);
  });

  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns a 36-character string', () => {
    expect(generateId()).toHaveLength(36);
  });
});
