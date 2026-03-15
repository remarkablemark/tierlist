/**
 * Validation utilities for tier list data structures.
 * @packageDocumentation
 */

import type {
  Tier,
  TierList,
  TierListItem,
  ValidationResult,
} from '../types/tierList';
import { escapeHtml } from './escapeHtml';

/**
 * Maximum number of items allowed in a tier list.
 */
export const MAX_ITEMS = 100;

/**
 * Threshold for displaying performance warning.
 */
export const WARNING_THRESHOLD = 50;

/**
 * Validates a CSS color string.
 * @param color - The color string to validate.
 * @returns True if the color is valid, false otherwise.
 */
export function isValidCssColor(color: string): boolean {
  const ctx = document.createElement('canvas').getContext('2d');
  /* v8 ignore start */
  if (!ctx) {
    return false;
  }
  /* v8 ignore stop */
  ctx.fillStyle = color;
  return ctx.fillStyle !== '' && ctx.fillStyle !== 'rgba(0, 0, 0, 0)';
}

/**
 * Validates a tier item.
 * @param item - The item to validate.
 * @returns Validation result with errors and warnings.
 */
export function validateItem(item: TierListItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Label length validation
  if (item.label.length < 1 || item.label.length > 100) {
    errors.push('Item label must be 1-100 characters');
  }

  // Label sanitization check
  if (item.label !== escapeHtml(item.label)) {
    errors.push('Item label contains invalid HTML characters');
  }

  // Image consistency warning
  if (
    item.imageUrl &&
    !item.imageBlobId &&
    !item.imageUrl.startsWith('data:')
  ) {
    warnings.push('Item has temporary URL that may expire');
  }

  return { errors, warnings };
}

/**
 * Validates a tier.
 * @param tier - The tier to validate.
 * @returns Validation result with errors and warnings.
 */
export function validateTier(tier: Tier): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Label length validation
  if (tier.label.length < 1 || tier.label.length > 10) {
    errors.push('Tier label must be 1-10 characters');
  }

  // Label sanitization check
  if (tier.label !== escapeHtml(tier.label)) {
    errors.push('Tier label contains invalid HTML characters');
  }

  // Color format validation
  if (!isValidCssColor(tier.color)) {
    errors.push('Invalid tier color format');
  }

  // Unique item IDs within tier
  const itemIds = new Set(tier.items.map((i) => i.id));
  if (itemIds.size !== tier.items.length) {
    errors.push('Duplicate item IDs in tier');
  }

  return { errors, warnings };
}

/**
 * Validates a tier list.
 * @param tierList - The tier list to validate.
 * @returns Validation result with errors and warnings.
 */
export function validateTierList(tierList: TierList): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Total item count
  const totalItems = getTotalItemCount(tierList);

  if (totalItems > MAX_ITEMS) {
    errors.push(`Tier list exceeds maximum of ${String(MAX_ITEMS)} items`);
  } else if (totalItems >= WARNING_THRESHOLD) {
    warnings.push(
      `Performance warning: ${String(totalItems)} items may slow down rendering`,
    );
  }

  // Unique tier IDs
  const tierIds = new Set(tierList.tiers.map((t) => t.id));
  if (tierIds.size !== tierList.tiers.length) {
    errors.push('Duplicate tier IDs detected');
  }

  // Unique item IDs across all locations
  const allItemIds = [
    ...tierList.unassignedItems.map((i) => i.id),
    ...tierList.tiers.flatMap((t) => t.items.map((i) => i.id)),
  ];
  const uniqueItemIds = new Set(allItemIds);
  if (uniqueItemIds.size !== allItemIds.length) {
    errors.push('Duplicate item IDs detected');
  }

  // Item exists in only one location
  const unassignedIds = new Set(tierList.unassignedItems.map((i) => i.id));
  const tierItemIds = new Set(
    tierList.tiers.flatMap((t) => t.items.map((i) => i.id)),
  );
  const intersection = [...unassignedIds].filter((id) => tierItemIds.has(id));
  if (intersection.length > 0) {
    errors.push(
      `Items found in multiple locations: ${intersection.join(', ')}`,
    );
  }

  return { errors, warnings };
}

/**
 * Calculates the total number of items in a tier list.
 * @param tierList - The tier list to count items in.
 * @returns The total item count.
 */
export function getTotalItemCount(tierList: TierList): number {
  return (
    tierList.unassignedItems.length +
    tierList.tiers.reduce((sum, tier) => sum + tier.items.length, 0)
  );
}

/**
 * Finds the location of an item in a tier list.
 * @param tierList - The tier list to search.
 * @param itemId - The item ID to find.
 * @returns The item location or null if not found.
 */
export function findItemLocation(
  tierList: TierList,
  itemId: string,
):
  | { type: 'tier'; tierId: string; index: number }
  | { type: 'unassigned'; index: number }
  | null {
  // Check unassigned first
  const unassignedIndex = tierList.unassignedItems.findIndex(
    (i) => i.id === itemId,
  );
  if (unassignedIndex !== -1) {
    return { type: 'unassigned', index: unassignedIndex };
  }

  // Check tiers
  for (const tier of tierList.tiers) {
    const index = tier.items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      return { type: 'tier', tierId: tier.id, index };
    }
  }

  return null;
}

/**
 * Validates item count for adding new items.
 * @param currentCount - The current number of items.
 * @returns Validation result with valid status and optional warning.
 */
export function validateItemCount(currentCount: number): {
  valid: boolean;
  warning?: string;
} {
  if (currentCount >= MAX_ITEMS) {
    return {
      valid: false,
      warning: `Maximum ${String(MAX_ITEMS)} items reached`,
    };
  }

  if (currentCount >= WARNING_THRESHOLD) {
    return {
      valid: true,
      warning: `Warning: ${String(currentCount)} items may affect performance`,
    };
  }

  return { valid: true };
}
