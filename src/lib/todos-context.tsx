/**
 * PURPOSE: Single source of truth for the todo list.
 *          Wraps the existing reducer + AsyncStorage flow so every screen
 *          (Home, Categories, Stats, Task Detail, Settings) reads/writes the
 *          same state without prop drilling.
 * PLACEMENT: `src/lib/` — non-UI module exposing a Provider + a hook.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import {
  loadPersistedTasks,
  savePersistedTasks,
  type PersistedTask,
} from '@/lib/task-storage';
import type { NewTaskForm } from '@/lib/task-schema';

export type Task = PersistedTask;

type TodoAction =
  | { type: 'add'; payload: NewTaskForm }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'toggleStar'; id: string }
  | { type: 'hydrate'; payload: Task[] }
  | { type: 'update'; id: string; payload: NewTaskForm }
  | { type: 'clearAll' };

function createTodoId(): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todosReducer(state: Task[], action: TodoAction): Task[] {
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

interface TodosContextValue {
  todos: Task[];
  hydrated: boolean;
  addTask: (payload: NewTaskForm) => void;
  updateTask: (id: string, payload: NewTaskForm) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleStar: (id: string) => void;
  clearAll: () => void;
  clearCompleted: () => void;
}

const TodosContext = createContext<TodosContextValue | null>(null);

export function TodosProvider({ children }: { children: React.ReactNode }) {
  const [todos, dispatch] = useReducer(todosReducer, [] as Task[]);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadPersistedTasks();
      if (cancelled) return;
      skipNextSave.current = true;
      dispatch({ type: 'hydrate', payload: loaded });
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    void savePersistedTasks(todos);
  }, [todos, hydrated]);

  const addTask = useCallback((payload: NewTaskForm) => {
    dispatch({ type: 'add', payload });
  }, []);

  const updateTask = useCallback((id: string, payload: NewTaskForm) => {
    dispatch({ type: 'update', id, payload });
  }, []);

  const removeTask = useCallback((id: string) => {
    dispatch({ type: 'remove', id });
  }, []);

  const toggleTask = useCallback((id: string) => {
    dispatch({ type: 'toggle', id });
  }, []);

  const toggleStar = useCallback((id: string) => {
    dispatch({ type: 'toggleStar', id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'clearAll' });
  }, []);

  const clearCompleted = useCallback(() => {
    todos.filter((t) => t.completed).forEach((t) => dispatch({ type: 'remove', id: t.id }));
  }, [todos]);

  const value = useMemo<TodosContextValue>(
    () => ({
      todos,
      hydrated,
      addTask,
      updateTask,
      removeTask,
      toggleTask,
      toggleStar,
      clearAll,
      clearCompleted,
    }),
    [
      todos,
      hydrated,
      addTask,
      updateTask,
      removeTask,
      toggleTask,
      toggleStar,
      clearAll,
      clearCompleted,
    ],
  );

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
}

export function useTodos(): TodosContextValue {
  const ctx = useContext(TodosContext);
  if (!ctx) {
    throw new Error('useTodos must be used inside <TodosProvider>');
  }
  return ctx;
}

/** Convenience: today's midnight in ms (used by Home and Stats). */
export function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
