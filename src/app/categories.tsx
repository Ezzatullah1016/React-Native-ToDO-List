/**
 * PURPOSE: Categories tab — lists every category with task counts and a
 *          completion bar; tapping a row deep-links to Home filtered to that
 *          category via search params (Requirements §9 — Categories).
 * PLACEMENT: `src/app/categories.tsx` — top-level Expo Router route consumed
 *            by `<NativeTabs.Trigger name="categories">` in `app-tabs.tsx`.
 */
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES, type CategoryId, TaskflowPalette } from '@/constants/taskflow';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTodos } from '@/lib/todos-context';

interface CategoryRow {
  id: CategoryId;
  label: string;
  dot: string;
  total: number;
  done: number;
  pct: number;
}

export default function CategoriesScreen() {
  const { todos } = useTodos();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + BottomTabInset + Spacing.four;

  const rows = useMemo<CategoryRow[]>(() => {
    return CATEGORIES.map((c) => {
      const inCat = todos.filter((t) => t.categoryId === c.id);
      const done = inCat.filter((t) => t.completed).length;
      const total = inCat.length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      return { id: c.id, label: c.label, dot: c.dot, total, done, pct };
    });
  }, [todos]);

  const overallTotal = todos.length;
  const overallDone = todos.filter((t) => t.completed).length;

  function openCategory(id: CategoryId) {
    router.push({ pathname: '/', params: { filter: 'category', id } });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>
          {overallTotal === 0
            ? 'Add tasks from Home and they will appear grouped here.'
            : `${overallDone} of ${overallTotal} tasks completed across all categories.`}
        </Text>

        <View style={styles.cardList}>
          {rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => openCategory(row.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${row.label} (${row.total} tasks)`}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardTop}>
                <View style={[styles.dot, { backgroundColor: row.dot }]} />
                <Text style={styles.cardLabel}>{row.label}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{row.total}</Text>
                </View>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${row.pct}%`, backgroundColor: row.dot },
                  ]}
                />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  {row.total === 0
                    ? 'No tasks yet'
                    : `${row.done} done · ${row.total - row.done} left`}
                </Text>
                <Text style={styles.cardFooterPct}>{row.pct}%</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  cardList: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardLabel: {
    color: TaskflowPalette.text,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  countPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: TaskflowPalette.surface2,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
  },
  countPillText: {
    color: TaskflowPalette.text,
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: TaskflowPalette.surface2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardFooterText: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
  },
  cardFooterPct: {
    color: TaskflowPalette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
