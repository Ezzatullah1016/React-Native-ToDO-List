/**
 * PURPOSE: Pure todo reducer — no React, easy to unit test (Requirements §10).
 *          Used by `TodosProvider` in `todos-context.tsx`.
 */
import type { NewTaskForm } from '@/lib/task-schema';
import type { PersistedTask } from '@/lib/task-storage';

export type Task = PersistedTask;

export type TodoAction =
  | { type: 'add'; payload: NewTaskForm }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'toggleStar'; id: string }
  | { type: 'hydrate'; payload: Task[] }
  | { type: 'update'; id: string; payload: NewTaskForm }
  | { type: 'clearAll' };

export function createTodoId(): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todosReducer(state: Task[], action: TodoAction): Task[] {
  if (action.type === 'hydrate') return action.payload;
  if (action.type === 'clearAll') return [];
  if (action.type === 'update') {
    return state.map((t) => (t.id === action.id ? { ...t, ...action.payload } : t));
  }
  if (action.type === 'add') {
    const next: Task = {
      ...action.payload,
      id: createTodoId(),
      completed: false,
      createdAt: Date.now(),
      starred: false,
    };
    return [next, ...state];
  }
  if (action.type === 'toggle') {
    return state.map((t) => (t.id === action.id ? { ...t, completed: !t.completed } : t));
  }
  if (action.type === 'remove') {
    return state.filter((t) => t.id !== action.id);
  }
  if (action.type === 'toggleStar') {
    return state.map((t) => (t.id === action.id ? { ...t, starred: !t.starred } : t));
  }
  return state;
}
