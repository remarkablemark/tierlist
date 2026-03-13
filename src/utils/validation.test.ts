/**
 * Tests for the validation utility functions.
 */

import type { Tier, TierList, TierListItem } from '../types/tierList.types';
import {
  findItemLocation,
  getTotalItemCount,
  isValidCssColor,
  MAX_ITEMS,
  validateItem,
  validateItemCount,
  validateTier,
  validateTierList,
  WARNING_THRESHOLD,
} from './validation';

// Mock canvas for color validation
beforeEach(() => {
  let fillStyleValue = '#000000';
  const mockCtx = {
    get fillStyle() {
      return fillStyleValue;
    },
    set fillStyle(value: string) {
      // Simulate browser behavior: invalid colors result in empty string
      if (value === '' || value === 'notacolor' || value === '#gggggg') {
        fillStyleValue = '';
      } else {
        fillStyleValue = value;
      }
    },
  };
  const mockCanvas = {
    getContext: vi.fn(() => mockCtx),
  };
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas as unknown as HTMLCanvasElement;
    }
    return document.createElement(tagName);
  });
});

describe('isValidCssColor', () => {
  it('returns true for valid hex colors', () => {
    expect(isValidCssColor('#ff0000')).toBe(true);
    expect(isValidCssColor('#f00')).toBe(true);
    expect(isValidCssColor('#FF0000')).toBe(true);
  });

  it('returns true for valid rgb colors', () => {
    expect(isValidCssColor('rgb(255, 0, 0)')).toBe(true);
    expect(isValidCssColor('rgba(255, 0, 0, 0.5)')).toBe(true);
  });

  it('returns true for valid named colors', () => {
    expect(isValidCssColor('red')).toBe(true);
    expect(isValidCssColor('blue')).toBe(true);
  });

  it('returns false for invalid colors', () => {
    expect(isValidCssColor('notacolor')).toBe(false);
    expect(isValidCssColor('#gggggg')).toBe(false);
    expect(isValidCssColor('')).toBe(false);
  });
});

describe('validateItem', () => {
  const createValidItem = (): TierListItem => ({
    id: 'item-1',
    label: 'Test Item',
    imageUrl: 'data:image/png;base64,test',
    imageBlobId: 'blob-1',
    createdAt: Date.now(),
    metadata: {},
  });

  it('returns no errors for valid item', () => {
    const item = createValidItem();
    const result = validateItem(item);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('errors on empty label', () => {
    const item = { ...createValidItem(), label: '' };
    const result = validateItem(item);
    expect(result.errors).toContain('Item label must be 1-100 characters');
  });

  it('errors on label too long', () => {
    const item = { ...createValidItem(), label: 'a'.repeat(101) };
    const result = validateItem(item);
    expect(result.errors).toContain('Item label must be 1-100 characters');
  });

  it('errors on label with HTML entities', () => {
    const item = {
      ...createValidItem(),
      label: '<script>alert("xss")</script>',
    };
    const result = validateItem(item);
    expect(result.errors).toContain(
      'Item label contains invalid HTML characters',
    );
  });

  it('warns on temporary URL without blob', () => {
    const item = {
      ...createValidItem(),
      imageUrl: 'http://example.com/image.png',
      imageBlobId: null,
    };
    const result = validateItem(item);
    expect(result.warnings).toContain('Item has temporary URL that may expire');
  });
});

describe('validateTier', () => {
  const createValidTier = (): Tier => ({
    id: 'tier-1',
    label: 'S',
    color: '#ff0000',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  });

  it('returns no errors for valid tier', () => {
    const tier = createValidTier();
    const result = validateTier(tier);
    expect(result.errors).toHaveLength(0);
  });

  it('errors on empty label', () => {
    const tier = { ...createValidTier(), label: '' };
    const result = validateTier(tier);
    expect(result.errors).toContain('Tier label must be 1-10 characters');
  });

  it('errors on label too long', () => {
    const tier = { ...createValidTier(), label: 'Super Tier!' };
    const result = validateTier(tier);
    expect(result.errors).toContain('Tier label must be 1-10 characters');
  });

  it('errors on label with HTML entities', () => {
    const tier = {
      ...createValidTier(),
      label: '<script>alert("xss")</script>',
    };
    const result = validateTier(tier);
    expect(result.errors).toContain(
      'Tier label contains invalid HTML characters',
    );
  });

  it('errors on invalid color', () => {
    const tier = { ...createValidTier(), color: 'notacolor' };
    const result = validateTier(tier);
    expect(result.errors).toContain('Invalid tier color format');
  });

  it('errors on duplicate item IDs in tier', () => {
    const duplicateItem = {
      id: 'item-1',
      label: 'Item',
      imageUrl: null,
      imageBlobId: null,
      createdAt: Date.now(),
      metadata: {},
    };
    const tier = {
      ...createValidTier(),
      items: [duplicateItem, duplicateItem],
    };
    const result = validateTier(tier);
    expect(result.errors).toContain('Duplicate item IDs in tier');
  });
});

describe('validateTierList', () => {
  const createValidTierList = (): TierList => ({
    id: 'tierlist-1',
    name: 'Test Tier List',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tiers: [
      {
        id: 'tier-1',
        label: 'S',
        color: '#ff0000',
        items: [],
        isCustomColor: false,
        isCustomLabel: false,
      },
      {
        id: 'tier-2',
        label: 'A',
        color: '#00ff00',
        items: [],
        isCustomColor: false,
        isCustomLabel: false,
      },
    ],
    unassignedItems: [],
    settings: {
      theme: 'system',
      tierHeight: 120,
      itemSize: 'medium',
      showItemLabels: true,
      enableAnimations: true,
      snapToGrid: false,
    },
    version: 1,
  });

  it('returns no errors for valid tier list', () => {
    const tierList = createValidTierList();
    const result = validateTierList(tierList);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when exceeding maximum items', () => {
    const tierList = createValidTierList();
    const items: TierListItem[] = Array.from(
      { length: MAX_ITEMS + 1 },
      (_, i) => ({
        id: `item-${String(i)}`,
        label: `Item ${String(i)}`,
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      }),
    );
    tierList.unassignedItems = items;
    const result = validateTierList(tierList);
    expect(result.errors).toContain(
      `Tier list exceeds maximum of ${String(MAX_ITEMS)} items`,
    );
  });

  it('warns when approaching maximum items', () => {
    const tierList = createValidTierList();
    const items: TierListItem[] = Array.from(
      { length: WARNING_THRESHOLD },
      (_, i) => ({
        id: `item-${String(i)}`,
        label: `Item ${String(i)}`,
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      }),
    );
    tierList.unassignedItems = items;
    const result = validateTierList(tierList);
    expect(result.warnings.some((w) => w.includes('Performance warning'))).toBe(
      true,
    );
  });

  it('errors on duplicate tier IDs', () => {
    const tierList = createValidTierList();
    tierList.tiers[1].id = tierList.tiers[0].id;
    const result = validateTierList(tierList);
    expect(result.errors).toContain('Duplicate tier IDs detected');
  });

  it('errors on duplicate item IDs across locations', () => {
    const tierList = createValidTierList();
    const duplicateItem = {
      id: 'item-1',
      label: 'Item',
      imageUrl: null,
      imageBlobId: null,
      createdAt: Date.now(),
      metadata: {},
    };
    tierList.unassignedItems = [duplicateItem];
    tierList.tiers[0].items = [{ ...duplicateItem }];
    const result = validateTierList(tierList);
    expect(result.errors).toContain('Duplicate item IDs detected');
  });

  it('errors when item is in multiple locations', () => {
    const tierList = createValidTierList();
    const duplicateItem = {
      id: 'item-1',
      label: 'Item',
      imageUrl: null,
      imageBlobId: null,
      createdAt: Date.now(),
      metadata: {},
    };
    tierList.unassignedItems = [duplicateItem];
    tierList.tiers[0].items = [{ ...duplicateItem }];
    const result = validateTierList(tierList);
    expect(
      result.errors.some((e) =>
        e.includes('Items found in multiple locations'),
      ),
    ).toBe(true);
  });
});

describe('getTotalItemCount', () => {
  it('counts items in unassigned and tiers', () => {
    const tierList: TierList = {
      id: 'tierlist-1',
      name: 'Test',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tiers: [
        {
          id: 'tier-1',
          label: 'S',
          color: '#ff0000',
          items: [
            {
              id: 'item-1',
              label: 'Item 1',
              imageUrl: null,
              imageBlobId: null,
              createdAt: Date.now(),
              metadata: {},
            },
            {
              id: 'item-2',
              label: 'Item 2',
              imageUrl: null,
              imageBlobId: null,
              createdAt: Date.now(),
              metadata: {},
            },
          ],
          isCustomColor: false,
          isCustomLabel: false,
        },
      ],
      unassignedItems: [
        {
          id: 'item-3',
          label: 'Item 3',
          imageUrl: null,
          imageBlobId: null,
          createdAt: Date.now(),
          metadata: {},
        },
      ],
      settings: {
        theme: 'system',
        tierHeight: 120,
        itemSize: 'medium',
        showItemLabels: true,
        enableAnimations: true,
        snapToGrid: false,
      },
      version: 1,
    };
    expect(getTotalItemCount(tierList)).toBe(3);
  });

  it('returns 0 for empty tier list', () => {
    const tierList: TierList = {
      id: 'tierlist-1',
      name: 'Test',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tiers: [],
      unassignedItems: [],
      settings: {
        theme: 'system',
        tierHeight: 120,
        itemSize: 'medium',
        showItemLabels: true,
        enableAnimations: true,
        snapToGrid: false,
      },
      version: 1,
    };
    expect(getTotalItemCount(tierList)).toBe(0);
  });
});

describe('findItemLocation', () => {
  const createTierList = (): TierList => ({
    id: 'tierlist-1',
    name: 'Test',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tiers: [
      {
        id: 'tier-1',
        label: 'S',
        color: '#ff0000',
        items: [
          {
            id: 'item-1',
            label: 'Item 1',
            imageUrl: null,
            imageBlobId: null,
            createdAt: Date.now(),
            metadata: {},
          },
        ],
        isCustomColor: false,
        isCustomLabel: false,
      },
    ],
    unassignedItems: [
      {
        id: 'item-2',
        label: 'Item 2',
        imageUrl: null,
        imageBlobId: null,
        createdAt: Date.now(),
        metadata: {},
      },
    ],
    settings: {
      theme: 'system',
      tierHeight: 120,
      itemSize: 'medium',
      showItemLabels: true,
      enableAnimations: true,
      snapToGrid: false,
    },
    version: 1,
  });

  it('finds item in tier', () => {
    const tierList = createTierList();
    const location = findItemLocation(tierList, 'item-1');
    expect(location).toEqual({ type: 'tier', tierId: 'tier-1', index: 0 });
  });

  it('finds item in unassigned', () => {
    const tierList = createTierList();
    const location = findItemLocation(tierList, 'item-2');
    expect(location).toEqual({ type: 'unassigned', index: 0 });
  });

  it('returns null for non-existent item', () => {
    const tierList = createTierList();
    const location = findItemLocation(tierList, 'item-999');
    expect(location).toBeNull();
  });
});

describe('validateItemCount', () => {
  it('returns valid for low count', () => {
    const result = validateItemCount(10);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('returns valid with warning at threshold', () => {
    const result = validateItemCount(WARNING_THRESHOLD);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain('Warning');
  });

  it('returns invalid at maximum', () => {
    const result = validateItemCount(MAX_ITEMS);
    expect(result.valid).toBe(false);
    expect(result.warning).toContain('Maximum');
  });

  it('returns invalid above maximum', () => {
    const result = validateItemCount(MAX_ITEMS + 1);
    expect(result.valid).toBe(false);
    expect(result.warning).toContain('Maximum');
  });
});
