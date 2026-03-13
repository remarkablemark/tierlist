/**
 * Type definitions for the SaveLoadControls component.
 * @packageDocumentation
 */

import { type AutoSaveStatus } from '../../hooks/useAutoSave';
import { type TierList } from '../../types/tierList.types';

/**
 * Summary information about a saved tier list.
 */
export interface SavedTierListSummary {
  /** Unique identifier */
  id: string;
  /** Tier list name */
  name: string;
  /** Last update timestamp */
  updatedAt: number;
  /** Last access timestamp */
  lastAccessedAt: number;
}

/**
 * Props for the SaveLoadControls component.
 */
export interface SaveLoadControlsProps {
  /** Current auto-save status */
  autoSaveStatus: AutoSaveStatus;
  /** Last saved timestamp */
  lastSavedAt: number | null;
  /** Error message from auto-save */
  errorMessage: string | null;
  /** Handler for creating a new tier list */
  onCreateNew: (name?: string) => void;
  /** Handler for loading a saved tier list */
  onLoad: (id: string) => void;
  /** Handler for deleting a saved tier list */
  onDelete: (id: string) => void;
  /** Manual save trigger */
  onSave: () => void;
  /** List of saved tier lists */
  savedTierLists: SavedTierListSummary[];
  /** Current tier list */
  currentTierList: TierList | null;
}
