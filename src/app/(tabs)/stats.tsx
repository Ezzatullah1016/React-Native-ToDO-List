/**
 * PURPOSE: Stats tab — read-only analytics over the same todo state
 *          (Requirements §6/§9): completion rate, breakdown by category and
 *          priority, plus a "Clear completed" maintenance action.
 * PLACEMENT: `src/app/(tabs)/stats.tsx` — tab route in `(tabs)/_layout.tsx`.
 */
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CATEGORIES,
  PRIORITY_IDS,
  TaskflowPalette,
  type CategoryId,
  type PriorityLevel,
} from '@/constants/taskflow';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { startOfTodayMs, useTodos } from '@/lib/todos-context';

const PRIORITY_COLOR: Record<PriorityLevel, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#22C55E',
};

const PRIORITY_LABEL: Record<PriorityLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

interface BreakdownRow {
  key: string;
  label: string;
  color: string;
  count: number;
  pct: number;
}

export default function StatsScreen() {
  const { todos, clearCompleted } = useTodos();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + BottomTabInset + Spacing.four;

  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const todayStart = startOfTodayMs();
  const todayCount = todos.filter((t) => t.createdAt >= todayStart).length;
  const highPending = todos.filter((t) => !t.completed && t.priority === 'high').length;

  const byCategory = useMemo<BreakdownRow[]>(() => {
    return CATEGORIES.map((c) => {
      const count = todos.filter((t) => t.categoryId === (c.id as CategoryId)).length;
      const pct = total === 0 ? 0 : Math.round((count / total) * 100);
      return { key: c.id, label: c.label, color: c.dot, count, pct };
    });
  }, [todos, total]);

  const byPriority = useMemo<BreakdownRow[]>(() => {
    return PRIORITY_IDS.map((p) => {
      const count = todos.filter((t) => t.priority === p).length;
      const pct = total === 0 ? 0 : Math.round((count / total) * 100);
      return { key: p, label: PRIORITY_LABEL[p], color: PRIORITY_COLOR[p], count, pct };
    });
  }, [todos, total]);

  function confirmClearCompleted() {
    if (completed === 0) return;
    Alert.alert(
      'Clear completed?',
      `This will permanently remove ${completed} completed task${completed === 1 ? '' : 's'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearCompleted() },
      ],
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>
          {total === 0
            ? 'Numbers will appear here once you add tasks from Home.'
            : `You have completed ${completed} of ${total} tasks (${rate}%).`}
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryTile label="Total" value={`${total}`} hint="All tasks" />
          <SummaryTile label="Completed" value={`${completed}`} hint={`${rate}%`} />
          <SummaryTile label="Pending" value={`${pending}`} hint={`${highPending} high`} />
          <SummaryTile label="Today" value={`${todayCount}`} hint="Created today" />
        </View>

        <Section title="By category" empty={total === 0}>
          {byCategory.map((r) => (
            <BreakdownLine key={r.key} row={r} />
          ))}
        </Section>

        <Section title="By priority" empty={total === 0}>
          {byPriority.map((r) => (
            <BreakdownLine key={r.key} row={r} />
          ))}
        </Section>

        <Pressable
          onPress={confirmClearCompleted}
          disabled={completed === 0}
          accessibilityRole="button"
          accessibilityLabel="Clear completed tasks"
          style={({ pressed }) => [
            styles.clearBtn,
            completed === 0 && styles.clearBtnDisabled,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.clearBtnText, completed === 0 && styles.clearBtnTextDisabled]}>
            {completed === 0 ? 'No completed tasks' : `Clear ${completed} completed`}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SummaryTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileHint}>{hint}</Text>
    </View>
  );
}

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {empty ? <Text style={styles.sectionEmpty}>Add a task to see this breakdown.</Text> : children}
    </View>
  );
}

function BreakdownLine({ row }: { row: BreakdownRow }) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownTopRow}>
        <View style={[styles.breakdownDot, { backgroundColor: row.color }]} />
        <Text style={styles.breakdownLabel}>{row.label}</Text>
        <Text style={styles.breakdownCount}>
          {row.count} · {row.pct}%
        </Text>
      </View>
      <View style={styles.breakdownTrack}>
        <View
          style={[styles.breakdownFill, { width: `${row.pct}%`, backgroundColor: row.color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TaskflowPalette.bg,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    color: TaskflowPalette.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: TaskflowPalette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
    padding: Spacing.three,
    gap: 4,
  },
  tileLabel: {
    color: TaskflowPalette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tileValue: {
    color: TaskflowPalette.text,
    fontSize: 26,
    fontWeight: '700',
  },
  tileHint: {
    color: TaskflowPalette.textMuted,
    fontSize: 12,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionTitle: {
    color: TaskflowPalette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionEmpty: {
    color: TaskflowPalette.textMuted,
    fontSize: 14,
  },
  breakdownRow: {
    gap: Spacing.one,
  },
  breakdownTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    color: TaskflowPalette.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  breakdownCount: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: TaskflowPalette.surface2,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  clearBtn: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: TaskflowPalette.danger,
    alignItems: 'center',
  },
  clearBtnDisabled: {
    backgroundColor: TaskflowPalette.surface2,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
  },
  clearBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  clearBtnTextDisabled: {
    color: TaskflowPalette.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});
