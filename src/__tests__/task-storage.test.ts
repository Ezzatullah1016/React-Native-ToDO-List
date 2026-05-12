import AsyncStorage from '@react-native-async-storage/async-storage';

import { savePersistedTasks, type PersistedTask } from '@/lib/task-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('task-storage persistence', () => {
  beforeEach(() => {
    void AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('savePersistedTasks writes JSON AsyncStorage can round-trip', async () => {
    const tasks: PersistedTask[] = [
      {
        id: 'a',
        title: 'One',
        categoryId: 'work',
        priority: 'high',
        completed: false,
        createdAt: 10,
        starred: false,
      },
    ];
    await savePersistedTasks(tasks);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const [, json] = (AsyncStorage.setItem as jest.Mock).mock.calls[0] as [string, string];
    expect(JSON.parse(json)).toEqual(tasks);
  });
});
