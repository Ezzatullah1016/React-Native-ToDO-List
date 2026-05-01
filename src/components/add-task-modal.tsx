import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  CATEGORIES,
  type CategoryId,
  PRIORITY_IDS,
  type PriorityLevel,
  TaskflowPalette,
} from '@/constants/taskflow';
import { newTaskFormSchema, type NewTaskForm } from '@/lib/task-schema';
import { Spacing } from '@/constants/theme';

export interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: NewTaskForm) => void;
}

interface FieldErrors {
  title?: string;
  categoryId?: string;
  priority?: string;
}

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function AddTaskModal({ visible, onClose, onSubmit }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('work');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setCategoryId('work');
    setPriority('medium');
    setErrors({});
  }, [visible]);

  const handleSubmit = useCallback(() => {
    const parsed = newTaskFormSchema.safeParse({ title, categoryId, priority });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        categoryId: fieldErrors.categoryId?.[0],
        priority: fieldErrors.priority?.[0],
      });
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
    onClose();
  }, [categoryId, onClose, onSubmit, priority, title]);

  const categoryChips = useMemo(
    () =>
      CATEGORIES.map((c) => {
        const selected = c.id === categoryId;
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              setCategoryId(c.id);
              setErrors((e) => ({ ...e, categoryId: undefined }));
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: TaskflowPalette.border, backgroundColor: TaskflowPalette.surface2 },
              selected && { borderColor: c.bar, backgroundColor: TaskflowPalette.primarySoft },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.dot, { backgroundColor: c.dot }]} />
            <Text style={[styles.chipLabel, { color: TaskflowPalette.text }]}>{c.label}</Text>
          </Pressable>
        );
      }),
    [categoryId],
  );

  const priorityChips = useMemo(
    () =>
      PRIORITY_IDS.map((p) => {
        const selected = p === priority;
        const accent =
          p === 'high'
            ? TaskflowPalette.danger
            : p === 'medium'
              ? TaskflowPalette.warning
              : TaskflowPalette.success;
        return (
          <Pressable
            key={p}
            onPress={() => {
              setPriority(p);
              setErrors((e) => ({ ...e, priority: undefined }));
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: TaskflowPalette.border, backgroundColor: TaskflowPalette.surface2 },
              selected && { borderColor: accent, backgroundColor: TaskflowPalette.surface },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.chipLabel, { color: TaskflowPalette.text }]}>{PRIORITY_LABELS[p]}</Text>
          </Pressable>
        );
      }),
    [priority],
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss add task">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cardContent}>
              <Text style={styles.modalTitle}>New task</Text>
              <Text style={styles.label}>Task name</Text>
              <TextInput
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
                }}
                placeholder="e.g. Complete project proposal"
                placeholderTextColor={TaskflowPalette.textMuted}
                style={[styles.input, errors.title && styles.inputError]}
                accessibilityLabel="Task name"
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

              <Text style={[styles.label, styles.labelSpaced]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {categoryChips}
              </ScrollView>
              {errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId}</Text> : null}

              <Text style={[styles.label, styles.labelSpaced]}>Priority</Text>
              <View style={styles.priorityRow}>{priorityChips}</View>
              {errors.priority ? <Text style={styles.errorText}>{errors.priority}</Text> : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button">
                  <Text style={styles.secondaryLabel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Save task">
                  <Text style={styles.primaryLabel}>Add task</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: '100%',
  },
  cardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: TaskflowPalette.surface,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  modalTitle: {
    color: TaskflowPalette.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  label: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  labelSpaced: {
    marginTop: Spacing.two,
  },
  input: {
    marginTop: Spacing.one,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: TaskflowPalette.text,
    fontSize: 16,
    backgroundColor: TaskflowPalette.surface2,
  },
  inputError: {
    borderColor: TaskflowPalette.danger,
  },
  errorText: {
    color: TaskflowPalette.danger,
    fontSize: 13,
    marginTop: Spacing.one,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  secondaryBtn: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
  },
  secondaryLabel: {
    color: TaskflowPalette.text,
    fontWeight: '600',
    fontSize: 15,
  },
  primaryBtn: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: 12,
    backgroundColor: TaskflowPalette.primary,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
