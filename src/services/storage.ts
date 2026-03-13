/**
 * IndexedDB storage service for tier list persistence.
 * @packageDocumentation
 */

import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

import type { TierList } from '../types/tierList.types';

/**
 * IndexedDB schema definition.
 */
interface TierListDB extends DBSchema {
  tierLists: {
    key: string;
    value: TierListRecord;
    indexes: { updatedAt: number; lastAccessedAt: number };
  };
  images: {
    key: string;
    value: ImageRecord;
  };
  metadata: {
    key: string;
    value: MetadataRecord;
  };
}

/**
 * Tier list record stored in IndexedDB.
 */
export interface TierListRecord {
  id: string;
  data: TierList;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
}

/**
 * Image record stored in IndexedDB.
 */
export interface ImageRecord {
  id: string;
  blob: Blob;
  type: string;
  size: number;
  createdAt: number;
}

/**
 * Metadata record stored in IndexedDB.
 */
export interface MetadataRecord {
  key: string;
  value: unknown;
  updatedAt: number;
}

/**
 * Database configuration.
 */
const DB_NAME = 'TierListDB';
const DB_VERSION = 1;

/**
 * Opens the IndexedDB database.
 * @returns A promise resolving to the database instance.
 */
export async function openDatabase(): Promise<IDBPDatabase<TierListDB>> {
  return openDB<TierListDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tier lists store
      const tierListStore = db.createObjectStore('tierLists', {
        keyPath: 'id',
      });
      tierListStore.createIndex('updatedAt', 'updatedAt');
      tierListStore.createIndex('lastAccessedAt', 'lastAccessedAt');

      // Images store
      db.createObjectStore('images', { keyPath: 'id' });

      // Metadata store
      db.createObjectStore('metadata', { keyPath: 'key' });
    },
  });
}

/**
 * Saves a tier list to IndexedDB.
 * @param tierList - The tier list to save.
 * @throws Error if save fails (e.g., QuotaExceededError).
 */
export async function saveTierList(tierList: TierList): Promise<void> {
  const db = await openDatabase();
  const now = Date.now();
  const record: TierListRecord = {
    id: tierList.id,
    data: tierList,
    createdAt: tierList.createdAt,
    updatedAt: now,
    lastAccessedAt: now,
  };
  await db.put('tierLists', record);
}

/**
 * Loads a tier list from IndexedDB.
 * @param id - The tier list ID to load.
 * @returns The tier list or undefined if not found.
 */
export async function loadTierList(id: string): Promise<TierList | undefined> {
  const db = await openDatabase();
  const record = await db.get('tierLists', id);
  if (record) {
    // Update last accessed time
    record.lastAccessedAt = Date.now();
    await db.put('tierLists', record);
    return record.data;
  }
  return undefined;
}

/**
 * Deletes a tier list from IndexedDB.
 * @param id - The tier list ID to delete.
 */
export async function deleteTierList(id: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('tierLists', id);
}

/**
 * Gets all tier list summaries from IndexedDB.
 * @returns A promise resolving to an array of tier list summaries.
 */
export async function getAllTierLists(): Promise<
  { id: string; name: string; updatedAt: number; lastAccessedAt: number }[]
> {
  const db = await openDatabase();
  const records = await db.getAll('tierLists');
  return records
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((record) => ({
      id: record.id,
      name: record.data.name,
      updatedAt: record.updatedAt,
      lastAccessedAt: record.lastAccessedAt,
    }));
}

/**
 * Saves an image blob to IndexedDB.
 * @param id - The image ID (typically item ID).
 * @param blob - The image blob to save.
 * @param type - The MIME type of the image.
 * @throws Error if save fails.
 */
export async function saveImage(
  id: string,
  blob: Blob,
  type: string,
): Promise<void> {
  const db = await openDatabase();
  const record: ImageRecord = {
    id,
    blob,
    type,
    size: blob.size,
    createdAt: Date.now(),
  };
  await db.put('images', record);
}

/**
 * Loads an image blob from IndexedDB.
 * @param id - The image ID to load.
 * @returns The image blob or undefined if not found.
 */
export async function loadImage(id: string): Promise<Blob | undefined> {
  const db = await openDatabase();
  const record = await db.get('images', id);
  return record?.blob;
}

/**
 * Deletes an image from IndexedDB.
 * @param id - The image ID to delete.
 */
export async function deleteImage(id: string): Promise<void> {
  const db = await openDatabase();
  await db.delete('images', id);
}

/**
 * Saves metadata to IndexedDB.
 * @param key - The metadata key.
 * @param value - The metadata value.
 */
export async function saveMetadata(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  const record: MetadataRecord = {
    key,
    value,
    updatedAt: Date.now(),
  };
  await db.put('metadata', record);
}

/**
 * Gets metadata from IndexedDB.
 * @param key - The metadata key.
 * @returns The metadata value or undefined if not found.
 */
export async function getMetadata(key: string): Promise<unknown> {
  const db = await openDatabase();
  const record = await db.get('metadata', key);
  return record?.value;
}

/**
 * Clears all data from the database.
 */
export async function clearDatabase(): Promise<void> {
  const db = await openDatabase();
  await db.clear('tierLists');
  await db.clear('images');
  await db.clear('metadata');
}

/**
 * Gets storage usage information.
 * @returns A promise resolving to storage usage details.
 */
export async function getStorageUsage(): Promise<{
  tierLists: number;
  images: number;
  metadata: number;
}> {
  const db = await openDatabase();
  const [tierLists, images, metadata] = await Promise.all([
    db.getAllKeys('tierLists'),
    db.getAllKeys('images'),
    db.getAllKeys('metadata'),
  ]);
  return {
    tierLists: tierLists.length,
    images: images.length,
    metadata: metadata.length,
  };
}
