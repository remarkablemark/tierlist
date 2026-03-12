/**
 * Unit tests for the createDefaultTierList utility.
 * @packageDocumentation
 */

import { DEFAULT_SETTINGS, DEFAULT_TIERS } from '../types/tierList.types';
import { createDefaultTierList } from './createDefaultTierList';

describe('createDefaultTierList', () => {
  it('should create a tier list with default name', () => {
    const tierList = createDefaultTierList();

    expect(tierList.name).toBe('Untitled Tier List');
  });

  it('should create a tier list with custom name', () => {
    const tierList = createDefaultTierList('My Custom Tier List');

    expect(tierList.name).toBe('My Custom Tier List');
  });

  it('should create a tier list with DEFAULT_TIERS count', () => {
    const tierList = createDefaultTierList();

    expect(tierList.tiers).toHaveLength(DEFAULT_TIERS.length);
  });

  it('should create tiers with correct default labels', () => {
    const tierList = createDefaultTierList();

    expect(tierList.tiers.map((t) => t.label)).toEqual([
      'S',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
    ]);
  });

  it('should create tiers with default colors', () => {
    const tierList = createDefaultTierList();

    expect(tierList.tiers.map((t) => t.color)).toEqual([
      '#ff7f7f',
      '#ffbf7f',
      '#ffff7f',
      '#bfff7f',
      '#7fff7f',
      '#7fbfff',
      '#bf7fff',
    ]);
  });

  it('should create tiers with empty items arrays', () => {
    const tierList = createDefaultTierList();

    tierList.tiers.forEach((tier) => {
      expect(tier.items).toHaveLength(0);
    });
  });

  it('should create tiers with isCustomColor and isCustomLabel set to false', () => {
    const tierList = createDefaultTierList();

    tierList.tiers.forEach((tier) => {
      expect(tier.isCustomColor).toBe(false);
      expect(tier.isCustomLabel).toBe(false);
    });
  });

  it('should create tier list with empty unassignedItems', () => {
    const tierList = createDefaultTierList();

    expect(tierList.unassignedItems).toHaveLength(0);
  });

  it('should create tier list with DEFAULT_SETTINGS', () => {
    const tierList = createDefaultTierList();

    expect(tierList.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should create tier list with version 1', () => {
    const tierList = createDefaultTierList();

    expect(tierList.version).toBe(1);
  });

  it('should create tier list with unique IDs', () => {
    const tierList1 = createDefaultTierList();
    const tierList2 = createDefaultTierList();

    expect(tierList1.id).not.toBe(tierList2.id);

    tierList1.tiers.forEach((tier1, index) => {
      expect(tier1.id).not.toBe(tierList2.tiers[index].id);
    });
  });

  it('should create tier list with timestamps', () => {
    const tierList = createDefaultTierList();

    expect(tierList.createdAt).toBeGreaterThan(0);
    expect(tierList.updatedAt).toBeGreaterThan(0);
    expect(tierList.createdAt).toBe(tierList.updatedAt);
  });

  it('should escape HTML in custom name', () => {
    const tierList = createDefaultTierList('<script>alert("xss")</script>');

    expect(tierList.name).not.toContain('<script>');
    expect(tierList.name).toContain('&lt;script&gt;');
  });
});
