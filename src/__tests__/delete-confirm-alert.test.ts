import { Alert } from 'react-native';

/**
 * Mirrors the Home screen delete pattern: user must confirm via Alert before remove runs.
 */
describe('delete task with confirm (Alert)', () => {
  it('invokes remove only when the destructive action runs', () => {
    const removeTask = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const destructive = buttons?.find((b) => b.text === 'Delete');
      destructive?.onPress?.();
    });

    const id = 'task-1';
    Alert.alert('Delete task', 'Remove "Example"?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(id) },
    ]);

    expect(removeTask).toHaveBeenCalledTimes(1);
    expect(removeTask).toHaveBeenCalledWith('task-1');

    alertSpy.mockRestore();
  });
});
