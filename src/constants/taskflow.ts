/**
 * TaskFlow dashboard palette (matches product UI reference).
 * Home uses this palette so the screen stays visually consistent in light and dark OS themes.
 */

export const TaskflowPalette = {
  bg: '#0D0D0D',
  surface: '#121212',
  surface2: '#1A1A1A',
  border: '#2A2A2A',
  text: '#F4F4F5',
  textMuted: '#A1A1AA',
  primary: '#2563EB',
  primaryMuted: '#1D4ED8',
  primarySoft: '#172554',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
} as const;

export const CATEGORY_IDS = ['work', 'personal', 'health', 'learning'] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const PRIORITY_IDS = ['high', 'medium', 'low'] as const;
export type PriorityLevel = (typeof PRIORITY_IDS)[number];

export interface CategoryDefinition {
  id: CategoryId;
  label: string;
  dot: string;
  bar: string;
}

export const CATEGORIES: CategoryDefinition[] = [
  { id: 'work', label: 'Work', dot: '#3B82F6', bar: '#3B82F6' },
  { id: 'personal', label: 'Personal', dot: '#A855F7', bar: '#A855F7' },
  { id: 'health', label: 'Health', dot: '#22C55E', bar: '#22C55E' },
  { id: 'learning', label: 'Learning', dot: '#F97316', bar: '#F97316' },
];

export function getCategory(id: CategoryId): CategoryDefinition {
  const found = CATEGORIES.find((c) => c.id === id);
  return found ?? CATEGORIES[0];
}

/** Width at or above which the sidebar is pinned beside content. */
export const TASKFLOW_SIDEBAR_BREAKPOINT = 900;

/** Stats cards per row derived from content width. */
export function getStatColumnCount(contentWidth: number): 1 | 2 | 4 {
  if (contentWidth >= 960) return 4;
  if (contentWidth >= 560) return 2;
  return 1;
}

export const TASKFLOW_MAX_MAIN_WIDTH = 1120;
