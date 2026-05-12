import { todosReducer, type Task } from '@/lib/todos-reducer';
import type { NewTaskForm } from '@/lib/task-schema';

const baseForm: NewTaskForm = {
  title: 'Buy milk',
  categoryId: 'personal',
  priority: 'medium',
};

describe('todosReducer', () => {
  it('adds a task with defaults at the front', () => {
    const existing: Task[] = [
      {
        id: 'x',
        title: 'Old',
        categoryId: 'work',
        priority: 'low',
        completed: true,
        createdAt: 100,
        starred: false,
      },
    ];
    const next = todosReducer(existing, { type: 'add', payload: baseForm });
    expect(next).toHaveLength(2);
    expect(next[0].title).toBe('Buy milk');
    expect(next[0].completed).toBe(false);
    expect(next[0].starred).toBe(false);
    expect(next[0].id).toBeTruthy();
    expect(next[1].id).toBe('x');
  });

  it('removes a task by id (delete path after confirm)', () => {
    const state: Task[] = [
      {
        id: 'keep',
        title: 'Keep',
        categoryId: 'work',
        priority: 'high',
        completed: false,
        createdAt: 1,
        starred: false,
      },
      {
        id: 'gone',
        title: 'Gone',
        categoryId: 'health',
        priority: 'low',
        completed: false,
        createdAt: 2,
        starred: false,
      },
    ];
    const next = todosReducer(state, { type: 'remove', id: 'gone' });
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('keep');
  });

  it('updates task fields from edit form', () => {
    const state: Task[] = [
      {
        id: 'e1',
        title: 'Before',
        categoryId: 'work',
        priority: 'low',
        completed: false,
        createdAt: 5,
        starred: true,
      },
    ];
    const patch: NewTaskForm = {
      title: 'After edit',
      categoryId: 'learning',
      priority: 'high',
    };
    const next = todosReducer(state, { type: 'update', id: 'e1', payload: patch });
    expect(next[0].title).toBe('After edit');
    expect(next[0].categoryId).toBe('learning');
    expect(next[0].priority).toBe('high');
    expect(next[0].id).toBe('e1');
    expect(next[0].createdAt).toBe(5);
    expect(next[0].starred).toBe(true);
  });
});
