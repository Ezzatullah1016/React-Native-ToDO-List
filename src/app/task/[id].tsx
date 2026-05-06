/**
 * PURPOSE: Task Detail screen — opened when the user taps a task row on Home.
 *          Shows full info and exposes Toggle / Star / Edit / Delete actions
 *          that mutate the same context state used by Home and Stats.
 * PLACEMENT: `src/app/task/[id].tsx` — Expo Router dynamic route. Pushed via
 *            `router.push("/task/<id>")` from Home; not registered as a tab.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddTaskModal } from '@/components/add-task-modal';
import {
  TaskflowPalette,
  getCategory,
  type PriorityLevel,
} from '@/constants/taskflow';
import { Spacing } from '@/constants/theme';
import type { NewTaskForm } from '@/lib/task-schema';
import { useTodos } from '@/lib/todos-context';

const PRIORITY_LABEL: Record<PriorityLevel, string> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
};

const PRIORITY_COLORS: Record<PriorityLevel, { bg: string; text: string }> = {
  high: { bg: 'rgba(239,68,68,0.18)', text: '#FCA5A5' },
  medium: { bg: 'rgba(245,158,11,0.18)', text: '#FBBF24' },
  low: { bg: 'rgba(34,197,94,0.15)', text: '#86EFAC' },
};

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return new Date(ms).toISOString();
  }
}

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const insets = useSafeAreaInsets();
  const { todos, toggleTask, toggleStar, removeTask, updateTask } = useTodos();
  const [editOpen, setEditOpen] = useState(false);

  const task = useMemo(() => todos.find((t) => t.id === id) ?? null, [todos, id]);

  function handleDelete() {
    if (!task) return;
    Alert.alert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeTask(task.id);
          if (router.canGoBack()) router.back();
          else router.replace('/');
        },
      },
    ]);
  }

  function handleSaveEdit(taskId: string, payload: NewTaskForm) {
    updateTask(taskId, payload);
    setEditOpen(false);
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  if (!task) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundTitle}>Task not found</Text>
          <Text style={styles.notFoundBody}>
            This task may have been deleted. Go back to Home and pick another one.
          </Text>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const cat = getCategory(task.categoryId);
  const pc = PRIORITY_COLORS[task.priority];

  const editDraft: NewTaskForm = {
    title: task.title,
    categoryId: task.categoryId,
    priority: task.priority,
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>

        <View style={[styles.heroCard, { borderLeftColor: cat.bar }]}>
          <View style={styles.metaRow}>
            <View style={[styles.dot, { backgroundColor: cat.dot }]} />
            <Text style={styles.metaText}>{cat.label}</Text>
            <View style={[styles.priorityPill, { backgroundColor: pc.bg }]}>
              <Text style={[styles.priorityPillText, { color: pc.text }]}>
                {PRIORITY_LABEL[task.priority]}
              </Text>
            </View>
            {task.starred ? <Text style={styles.starGlyphOn}>★</Text> : null}
          </View>
          <Text style={[styles.title, task.completed && styles.titleDone]}>{task.title}</Text>
          <Text style={styles.statusText}>
            {task.completed ? 'Completed' : 'In progress'}
          </Text>
          <Text style={styles.timestamp}>Created {formatDate(task.createdAt)}</Text>
        </View>

        <View style={styles.actionsGrid}>
          <ActionButton
            label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            onPress={() => toggleTask(task.id)}
            variant="primary"
          />
          <ActionButton
            label={task.starred ? 'Unstar' : 'Star'}
            onPress={() => toggleStar(task.id)}
          />
          <ActionButton label="Edit" onPress={() => setEditOpen(true)} />
          <ActionButton label="Delete" onPress={handleDelete} variant="danger" />
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailHeading}>Details</Text>
          <DetailRow label="Title" value={task.title} />
          <DetailRow label="Category" value={cat.label} />
          <DetailRow label="Priority" value={PRIORITY_LABEL[task.priority]} />
          <DetailRow label="Starred" value={task.starred ? 'Yes' : 'No'} />
          <DetailRow label="Completed" value={task.completed ? 'Yes' : 'No'} />
          <DetailRow label="Created" value={formatDate(task.createdAt)} />
          <DetailRow label="Task ID" value={task.id} mono />
        </View>
      </ScrollView>

      <AddTaskModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        editingTaskId={task.id}
        initialDraft={editDraft}
        onSaveEdit={handleSaveEdit}
      />
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
}

function ActionButton({ label, onPress, variant = 'default' }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionBtn,
        variant === 'primary' && styles.actionBtnPrimary,
        variant === 'danger' && styles.actionBtnDanger,
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.actionBtnLabel,
          variant === 'primary' && styles.actionBtnLabelPrimary,
          variant === 'danger' && styles.actionBtnLabelDanger,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailValueMono]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TaskflowPalette.bg,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  backBtnText: {
    color: TaskflowPalette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    borderLeftWidth: 4,
    backgroundColor: TaskflowPalette.surface,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaText: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  priorityPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  starGlyphOn: {
    color: '#FBBF24',
    fontSize: 18,
    marginLeft: 'auto',
  },
  title: {
    color: TaskflowPalette.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: TaskflowPalette.textMuted,
  },
  statusText: {
    color: TaskflowPalette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: TaskflowPalette.textMuted,
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface2,
    alignItems: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: TaskflowPalette.primary,
    borderColor: TaskflowPalette.primary,
  },
  actionBtnDanger: {
    backgroundColor: TaskflowPalette.danger,
    borderColor: TaskflowPalette.danger,
  },
  actionBtnLabel: {
    color: TaskflowPalette.text,
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtnLabelPrimary: {
    color: '#fff',
  },
  actionBtnLabelDanger: {
    color: '#fff',
  },
  detailCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailHeading: {
    color: TaskflowPalette.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  detailLabel: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flexShrink: 0,
  },
  detailValue: {
    color: TaskflowPalette.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  detailValueMono: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
  },
  notFoundWrap: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.six,
  },
  notFoundTitle: {
    color: TaskflowPalette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  notFoundBody: {
    color: TaskflowPalette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  primaryBtn: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: 12,
    backgroundColor: TaskflowPalette.primary,
    marginTop: Spacing.two,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
