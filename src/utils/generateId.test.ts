/**
 * Tests for the generateId utility function.
 */

import { generateId } from './generateId';

describe('generateId', () => {
  it('should generate a valid UUID v4 format', () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const id = generateId();
    expect(id).toMatch(uuidRegex);
  });

  it('should generate unique IDs', () => {
    const ids = new Set([generateId(), generateId(), generateId()]);
    expect(ids.size).toBe(3);
  });

  it('should return a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('should return a 36-character string', () => {
    expect(generateId()).toHaveLength(36);
  });
});
