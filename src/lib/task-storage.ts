/**
 * PURPOSE: Local persistence for todos (Requirements §2.3 — AsyncStorage).
 * PLACEMENT: `src/lib/` holds pure helpers that do not render UI.
 * MID-LEVEL NOTE: Keep JSON (de)serialization and the storage key in one module
 * so screens only call `loadPersistedTasks` / `savePersistedTasks`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CATEGORY_IDS,
  PRIORITY_IDS,
  type CategoryId,
  type PriorityLevel,
} from '@/constants/taskflow';

const STORAGE_KEY = '@taskflow/todos/v1';

export interface PersistedTask {
  id: string;
  title: string;
  categoryId: CategoryId;
  priority: PriorityLevel;
  completed: boolean;
  createdAt: number;
  starred: boolean;
}

function isCategoryId(v: unknown): v is CategoryId {
  return typeof v === 'string' && (CATEGORY_IDS as readonly string[]).includes(v);
}

function isPriority(v: unknown): v is PriorityLevel {
  return typeof v === 'string' && (PRIORITY_IDS as readonly string[]).includes(v);
}

function parseTasks(raw: unknown): PersistedTask[] {
  if (!Array.isArray(raw)) return [];
  const out: PersistedTask[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.title !== 'string') continue;
    if (!isCategoryId(r.categoryId) || !isPriority(r.priority)) continue;
    if (typeof r.completed !== 'boolean' || typeof r.createdAt !== 'number' || typeof r.starred !== 'boolean')
      continue;
    out.push({
      id: r.id,
      title: r.title,
      categoryId: r.categoryId,
      priority: r.priority,
      completed: r.completed,
      createdAt: r.createdAt,
      starred: r.starred,
    });
  }
  return out;
}

/** Reads stored tasks; returns [] on first launch or corrupt data. */
export async function loadPersistedTasks(): Promise<PersistedTask[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return parseTasks(JSON.parse(json) as unknown);
  } catch {
    return [];
  }
}

/** Writes the full list (simple strategy for small todo apps). */
export async function savePersistedTasks(tasks: PersistedTask[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Swallow: mid-level apps often log to Sentry; here we avoid crashing the UI.
  }
}
