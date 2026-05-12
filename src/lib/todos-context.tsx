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
import { createTodoId, todosReducer } from '@/lib/todos-reducer';

export type Task = PersistedTask;

const ACTIVITY_CAP = 50;

export interface ActivityEntry {
  id: string;
  at: number;
  message: string;
}

interface TodosContextValue {
  todos: Task[];
  hydrated: boolean;
  activityLog: ActivityEntry[];
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
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const skipNextSave = useRef(false);

  const appendActivity = useCallback((message: string) => {
    setActivityLog((prev) =>
      [{ id: createTodoId(), at: Date.now(), message }, ...prev].slice(0, ACTIVITY_CAP),
    );
  }, []);

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

  const addTask = useCallback(
    (payload: NewTaskForm) => {
      dispatch({ type: 'add', payload });
      appendActivity(`Added “${payload.title.trim()}”`);
    },
    [appendActivity],
  );

  const updateTask = useCallback(
    (id: string, payload: NewTaskForm) => {
      const prev = todos.find((t) => t.id === id);
      dispatch({ type: 'update', id, payload });
      const label = prev?.title ?? 'Task';
      appendActivity(`Updated “${label}” → “${payload.title.trim()}”`);
    },
    [appendActivity, todos],
  );

  const removeTask = useCallback(
    (id: string) => {
      const prev = todos.find((t) => t.id === id);
      dispatch({ type: 'remove', id });
      if (prev) appendActivity(`Removed “${prev.title}”`);
    },
    [appendActivity, todos],
  );

  const toggleTask = useCallback(
    (id: string) => {
      const prev = todos.find((t) => t.id === id);
      dispatch({ type: 'toggle', id });
      if (prev) {
        appendActivity(
          prev.completed ? `Reopened “${prev.title}”` : `Completed “${prev.title}”`,
        );
      }
    },
    [appendActivity, todos],
  );

  const toggleStar = useCallback(
    (id: string) => {
      const prev = todos.find((t) => t.id === id);
      dispatch({ type: 'toggleStar', id });
      if (prev) {
        appendActivity(prev.starred ? `Unstarred “${prev.title}”` : `Starred “${prev.title}”`);
      }
    },
    [appendActivity, todos],
  );

  const clearAll = useCallback(() => {
    dispatch({ type: 'clearAll' });
    appendActivity('Cleared all tasks');
  }, [appendActivity]);

  const clearCompleted = useCallback(() => {
    const done = todos.filter((t) => t.completed);
    done.forEach((t) => dispatch({ type: 'remove', id: t.id }));
    if (done.length > 0) appendActivity(`Cleared ${done.length} completed task(s)`);
  }, [appendActivity, todos]);

  const value = useMemo<TodosContextValue>(
    () => ({
      todos,
      hydrated,
      activityLog,
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
      activityLog,
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
