/**
 * Default tier list constants.
 * @packageDocumentation
 */

import { type Tier, type TierListSettings } from '../types/tierList';

/**
 * Default tier list settings.
 */
export const DEFAULT_SETTINGS: TierListSettings = {
  itemSize: 'medium',
  showItemLabels: true,
};

/**
 * Default tier configuration.
 */
export const DEFAULT_TIERS: Omit<Tier, 'id'>[] = [
  {
    label: 'S',
    color: '#e57373',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'A',
    color: '#ffb74d',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'B',
    color: '#fff176',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'C',
    color: '#aed581',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'D',
    color: '#81c784',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'E',
    color: '#64b5f6',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
  {
    label: 'F',
    color: '#ba68c8',
    items: [],
    isCustomColor: false,
    isCustomLabel: false,
  },
];
