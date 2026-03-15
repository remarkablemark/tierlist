/**
 * Factory function for creating default tier list structures.
 * @packageDocumentation
 */

import { DEFAULT_SETTINGS, DEFAULT_TIERS } from '../constants/tierList';
import { type Tier, type TierList } from '../types/tierList';
import { escapeHtml } from './escapeHtml';
import { generateId } from './generateId';

/**
 * Creates a new tier list with default tiers.
 * @param name - Optional name for the tier list. Defaults to 'Tier List'.
 * @returns A new tier list with default configuration.
 */
export function createDefaultTierList(name = 'Tier List'): TierList {
  const now = Date.now();
  const tiers: Tier[] = DEFAULT_TIERS.map((defaultTier) => ({
    id: generateId(),
    label: defaultTier.label,
    color: defaultTier.color,
    items: [],
    isCustomColor: defaultTier.isCustomColor,
    isCustomLabel: defaultTier.isCustomLabel,
  }));

  return {
    id: generateId(),
    name: escapeHtml(name),
    createdAt: now,
    updatedAt: now,
    tiers,
    unassignedItems: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}
