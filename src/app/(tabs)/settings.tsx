/**
 * PURPOSE: Settings tab — lets the user pick a theme mode (system/light/dark),
 *          clear all tasks (Requirements §8 confirm pattern), and view app info.
 * PLACEMENT: `src/app/(tabs)/settings.tsx` — tab route in `(tabs)/_layout.tsx`.
 */
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskflowPalette } from '@/constants/taskflow';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useThemeMode, type ThemeMode } from '@/lib/theme-mode';
import { useTodos } from '@/lib/todos-context';

const MODE_OPTIONS: { id: ThemeMode; label: string; hint: string }[] = [
  { id: 'system', label: 'System', hint: 'Follow device theme' },
  { id: 'light', label: 'Light', hint: 'Always light' },
  { id: 'dark', label: 'Dark', hint: 'Always dark' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + BottomTabInset + Spacing.four;
  const { mode, setMode, resolved } = useThemeMode();
  const { todos, clearAll, activityLog } = useTodos();

  function confirmClearAll() {
    if (todos.length === 0) return;
    Alert.alert(
      'Clear all tasks?',
      `This permanently removes all ${todos.length} tasks from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: () => clearAll() },
      ],
    );
  }

  const appName = Constants.expoConfig?.name ?? 'TaskFlow';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appearance</Text>
          <Text style={styles.cardSub}>
            Choose how TaskFlow uses light or dark colors.
          </Text>
          <View style={styles.chipRow}>
            {MODE_OPTIONS.map((opt) => {
              const selected = opt.id === mode;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setMode(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.chipHint}>{opt.hint}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data</Text>
          <Text style={styles.cardSub}>
            All tasks are stored on this device using AsyncStorage. Nothing is sent to a server.
          </Text>
          <Pressable
            onPress={confirmClearAll}
            disabled={todos.length === 0}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.dangerBtn,
              todos.length === 0 && styles.dangerBtnDisabled,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.dangerBtnText,
                todos.length === 0 && styles.dangerBtnTextDisabled,
              ]}>
              {todos.length === 0
                ? 'No tasks to clear'
                : `Clear all ${todos.length} tasks`}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent activity</Text>
          <Text style={styles.cardSub}>
            In-app log of changes this session (not synced to a server). Requirements §9.
          </Text>
          {activityLog.length === 0 ? (
            <Text style={styles.activityEmpty}>No activity yet — add or edit a task on Home.</Text>
          ) : (
            <View style={styles.activityList}>
              {activityLog.map((entry) => (
                <View key={entry.id} style={styles.activityRow}>
                  <Text style={styles.activityTime}>
                    {new Date(entry.at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.activityMessage}>{entry.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <InfoRow label="App" value={appName} />
          <InfoRow label="Version" value={appVersion} />
          <InfoRow label="Platform" value={Platform.OS} />
          <InfoRow label="Tasks stored" value={`${todos.length}`} />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: {
    color: TaskflowPalette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  cardSub: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  chip: {
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface2,
    gap: 2,
  },
  chipSelected: {
    borderColor: TaskflowPalette.primary,
    backgroundColor: TaskflowPalette.primarySoft,
  },
  chipLabel: {
    color: TaskflowPalette.text,
    fontWeight: '700',
    fontSize: 14,
  },
  chipLabelSelected: {
    color: '#BFDBFE',
  },
  chipHint: {
    color: TaskflowPalette.textMuted,
    fontSize: 11,
  },
  activityEmpty: {
    color: TaskflowPalette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  activityList: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  activityRow: {
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TaskflowPalette.border,
    gap: 2,
  },
  activityTime: {
    color: TaskflowPalette.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  activityMessage: {
    color: TaskflowPalette.text,
    fontSize: 14,
    lineHeight: 20,
  },
  dangerBtn: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: TaskflowPalette.danger,
    alignItems: 'center',
  },
  dangerBtnDisabled: {
    backgroundColor: TaskflowPalette.surface2,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
  },
  dangerBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  dangerBtnTextDisabled: {
    color: TaskflowPalette.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  infoLabel: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: TaskflowPalette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
