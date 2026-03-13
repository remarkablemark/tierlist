/**
 * Tests for the IndexedDB storage service.
 */

import type { TierList } from '../types/tierList.types';
import {
  clearDatabase,
  deleteImage,
  deleteTierList,
  getAllTierLists,
  getMetadata,
  getStorageUsage,
  loadImage,
  loadTierList,
  openDatabase,
  saveImage,
  saveMetadata,
  saveTierList,
} from './storage';

const DB_NAME = 'TierListDB';

describe('storage', () => {
  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearDatabase();
  });

  describe('openDatabase', () => {
    it('should open the database successfully', async () => {
      const db = await openDatabase();
      expect(db).toBeDefined();
      expect(db.name).toBe(DB_NAME);
    });

    it('should create object stores on upgrade', async () => {
      const db = await openDatabase();
      expect(db.objectStoreNames).toContain('tierLists');
      expect(db.objectStoreNames).toContain('images');
      expect(db.objectStoreNames).toContain('metadata');
    });
  });

  describe('saveTierList and loadTierList', () => {
    const createTestTierList = (): TierList => ({
      id: 'test-id',
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

    it('should save and load a tier list', async () => {
      const tierList = createTestTierList();
      await saveTierList(tierList);

      const loaded = await loadTierList(tierList.id);
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(tierList.id);
      expect(loaded?.name).toBe(tierList.name);
      expect(loaded?.tiers).toHaveLength(1);
    });

    it('should return undefined for non-existent tier list', async () => {
      const loaded = await loadTierList('non-existent-id');
      expect(loaded).toBeUndefined();
    });

    it('should update lastAccessedAt on load', async () => {
      const tierList = createTestTierList();
      await saveTierList(tierList);

      // Load again and verify lastAccessedAt is updated
      const db = await openDatabase();
      const record1 = await db.get('tierLists', tierList.id);

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      await loadTierList(tierList.id);
      const record2 = await db.get('tierLists', tierList.id);

      expect(record2?.lastAccessedAt).toBeGreaterThanOrEqual(
        record1?.lastAccessedAt ?? 0,
      );
    });

    it('should update tier list on subsequent saves', async () => {
      const tierList = createTestTierList();
      await saveTierList(tierList);

      const updatedTierList = {
        ...tierList,
        name: 'Updated Name',
        updatedAt: Date.now(),
      };
      await saveTierList(updatedTierList);

      const loaded = await loadTierList(tierList.id);
      expect(loaded?.name).toBe('Updated Name');
    });
  });

  describe('deleteTierList', () => {
    it('should delete a tier list', async () => {
      const tierList: TierList = {
        id: 'test-id',
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
      await saveTierList(tierList);

      await deleteTierList(tierList.id);

      const loaded = await loadTierList(tierList.id);
      expect(loaded).toBeUndefined();
    });

    it('should not error when deleting non-existent tier list', async () => {
      await expect(deleteTierList('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('getAllTierLists', () => {
    it('should return empty array when no tier lists exist', async () => {
      const lists = await getAllTierLists();
      expect(lists).toEqual([]);
    });

    it('should return all tier lists sorted by updatedAt', async () => {
      const baseTime = Date.now();
      const tierLists: TierList[] = [
        {
          id: 'id-1',
          name: 'First',
          createdAt: baseTime - 2000,
          updatedAt: baseTime - 1000,
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
        },
        {
          id: 'id-2',
          name: 'Second',
          createdAt: baseTime - 3000,
          updatedAt: baseTime + 1000,
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
        },
      ];

      await saveTierList(tierLists[0]);

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await saveTierList(tierLists[1]);

      const lists = await getAllTierLists();
      expect(lists).toHaveLength(2);
      // Most recently saved should be first
      expect(lists[0].id).toBe('id-2');
      expect(lists[1].id).toBe('id-1');
    });
  });

  describe('saveImage and loadImage', () => {
    it('should save and load an image blob', async () => {
      const blob = new Blob(['test image data'], { type: 'image/png' });
      await saveImage('item-1', blob, 'image/png');

      const loaded = await loadImage('item-1');
      expect(loaded).toBeDefined();
    });

    it('should return undefined for non-existent image', async () => {
      const loaded = await loadImage('non-existent-id');
      expect(loaded).toBeUndefined();
    });

    it('should update image on subsequent saves', async () => {
      const blob1 = new Blob(['image 1'], { type: 'image/png' });
      const blob2 = new Blob(['image 2'], { type: 'image/jpeg' });

      await saveImage('item-1', blob1, 'image/png');
      await saveImage('item-1', blob2, 'image/jpeg');

      const loaded = await loadImage('item-1');
      expect(loaded).toBeDefined();
    });
  });

  describe('deleteImage', () => {
    it('should delete an image', async () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      await saveImage('item-1', blob, 'image/png');

      await deleteImage('item-1');

      const loaded = await loadImage('item-1');
      expect(loaded).toBeUndefined();
    });

    it('should not error when deleting non-existent image', async () => {
      await expect(deleteImage('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('saveMetadata and getMetadata', () => {
    it('should save and retrieve metadata', async () => {
      await saveMetadata('test-key', { foo: 'bar' });

      const value = await getMetadata('test-key');
      expect(value).toEqual({ foo: 'bar' });
    });

    it('should return undefined for non-existent metadata', async () => {
      const value = await getMetadata('non-existent-key');
      expect(value).toBeUndefined();
    });

    it('should update metadata on subsequent saves', async () => {
      await saveMetadata('key', { version: 1 });
      await saveMetadata('key', { version: 2 });

      const value = await getMetadata('key');
      expect(value).toEqual({ version: 2 });
    });

    it('should handle different value types', async () => {
      await saveMetadata('string-key', 'test string');
      await saveMetadata('number-key', 42);
      await saveMetadata('boolean-key', true);
      await saveMetadata('array-key', [1, 2, 3]);

      expect(await getMetadata('string-key')).toBe('test string');
      expect(await getMetadata('number-key')).toBe(42);
      expect(await getMetadata('boolean-key')).toBe(true);
      expect(await getMetadata('array-key')).toEqual([1, 2, 3]);
    });
  });

  describe('clearDatabase', () => {
    it('should clear all data from the database', async () => {
      // Add some data
      const tierList: TierList = {
        id: 'test-id',
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
      await saveTierList(tierList);
      await saveImage(
        'item-1',
        new Blob(['test'], { type: 'image/png' }),
        'image/png',
      );
      await saveMetadata('key', 'value');

      await clearDatabase();

      const lists = await getAllTierLists();
      const image = await loadImage('item-1');
      const metadata = await getMetadata('key');

      expect(lists).toHaveLength(0);
      expect(image).toBeUndefined();
      expect(metadata).toBeUndefined();
    });
  });

  describe('getStorageUsage', () => {
    it('should return zero counts for empty database', async () => {
      const usage = await getStorageUsage();
      expect(usage).toEqual({
        tierLists: 0,
        images: 0,
        metadata: 0,
      });
    });

    it('should return correct counts after adding data', async () => {
      const tierList: TierList = {
        id: 'test-id',
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
      await saveTierList(tierList);
      await saveImage(
        'item-1',
        new Blob(['test'], { type: 'image/png' }),
        'image/png',
      );
      await saveImage(
        'item-2',
        new Blob(['test2'], { type: 'image/jpeg' }),
        'image/jpeg',
      );
      await saveMetadata('key1', 'value1');
      await saveMetadata('key2', 'value2');
      await saveMetadata('key3', 'value3');

      const usage = await getStorageUsage();
      expect(usage).toEqual({
        tierLists: 1,
        images: 2,
        metadata: 3,
      });
    });
  });
});
