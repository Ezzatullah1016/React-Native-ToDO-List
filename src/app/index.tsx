import { StatusBar } from 'expo-status-bar';
import React, { memo, useCallback, useMemo, useReducer, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddTaskModal } from '@/components/add-task-modal';
import { WebBadge } from '@/components/web-badge';
import {
  CATEGORIES,
  type CategoryId,
  getCategory,
  getStatColumnCount,
  type PriorityLevel,
  TaskflowPalette,
  TASKFLOW_MAX_MAIN_WIDTH,
  TASKFLOW_SIDEBAR_BREAKPOINT,
} from '@/constants/taskflow';
import { BottomTabInset, Spacing } from '@/constants/theme';
import type { NewTaskForm } from '@/lib/task-schema';

const SIDEBAR_WIDTH = 272;
const STAT_GAP = 12;

interface Task extends NewTaskForm {
  id: string;
  completed: boolean;
  createdAt: number;
  starred: boolean;
}

type NavFilter =
  | { kind: 'all' }
  | { kind: 'category'; id: CategoryId }
  | { kind: 'today' }
  | { kind: 'starred' };

type SortMode = 'recent' | 'priority';

type TodoAction =
  | { type: 'add'; payload: NewTaskForm }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'toggleStar'; id: string };

function createTodoId(): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function todosReducer(state: Task[], action: TodoAction): Task[] {
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

const PRIORITY_ORDER: Record<PriorityLevel, number> = { high: 0, medium: 1, low: 2 };

function sortTasks(list: Task[], mode: SortMode): Task[] {
  const copy = [...list];
  if (mode === 'priority') {
    copy.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    return copy;
  }
  copy.sort((a, b) => b.createdAt - a.createdAt);
  return copy;
}

interface TaskCardProps {
  item: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleStar: (id: string) => void;
}

const TaskCard = memo(function TaskCard({ item, onToggle, onRemove, onToggleStar }: TaskCardProps) {
  const cat = getCategory(item.categoryId);
  const priorityColors: Record<PriorityLevel, { bg: string; text: string; label: string }> = {
    high: { bg: 'rgba(239,68,68,0.18)', text: '#FCA5A5', label: 'HIGH' },
    medium: { bg: 'rgba(245,158,11,0.18)', text: '#FBBF24', label: 'MEDIUM' },
    low: { bg: 'rgba(34,197,94,0.15)', text: '#86EFAC', label: 'LOW' },
  };
  const pc = priorityColors[item.priority];

  return (
    <View style={styles.taskCard}>
      <View style={[styles.taskAccent, { backgroundColor: cat.bar }]} />
      <View style={styles.taskBody}>
        <View style={styles.taskTopRow}>
          <Pressable
            onPress={() => onToggle(item.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.completed }}
            accessibilityLabel={`Mark "${item.title}" ${item.completed ? 'not done' : 'done'}`}
            hitSlop={8}
            style={styles.radioOuter}>
            <View style={[styles.radioInner, item.completed && styles.radioInnerOn]} />
          </Pressable>
          <View style={styles.taskTitleBlock}>
            <Text
              style={[styles.taskTitle, item.completed && styles.taskTitleDone]}
              numberOfLines={3}>
              {item.title}
            </Text>
            <View style={styles.taskMetaRow}>
              <View style={[styles.metaDot, { backgroundColor: cat.dot }]} />
              <Text style={styles.metaCategory}>{cat.label}</Text>
              <View style={[styles.priorityPill, { backgroundColor: pc.bg }]}>
                <Text style={[styles.priorityPillText, { color: pc.text }]}>{pc.label}</Text>
              </View>
            </View>
          </View>
          <View style={styles.taskActions}>
            <Pressable
              onPress={() => onToggleStar(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.starred ? 'Unstar task' : 'Star task'}
              hitSlop={8}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Text style={[styles.starGlyph, item.starred && styles.starGlyphOn]}>
                {item.starred ? '★' : '☆'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.title}`}
              hitSlop={8}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Text style={styles.removeGlyph}>×</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
});

interface SidebarProps {
  todos: Task[];
  nav: NavFilter;
  onNav: (next: NavFilter) => void;
  onAdd: () => void;
  onCloseDrawer?: () => void;
}

function TaskflowSidebar({ todos, nav, onNav, onAdd, onCloseDrawer }: SidebarProps) {
  const todayStart = startOfTodayMs();
  const todayCount = todos.filter((t) => t.createdAt >= todayStart).length;
  const starredCount = todos.filter((t) => t.starred).length;
  const allCount = todos.length;

  return (
    <ScrollView
      style={styles.sidebarScroll}
      contentContainerStyle={styles.sidebarContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkGlyph}>⚡</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>TaskFlow</Text>
          <Text style={styles.brandTag}>Stay productive</Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          onAdd();
          onCloseDrawer?.();
        }}
        style={({ pressed }) => [styles.addNewCta, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Add new task">
        <Text style={styles.addNewCtaText}>+ Add New Task</Text>
      </Pressable>

      <Text style={styles.navSectionLabel}>Tasks</Text>
      <Pressable
        onPress={() => {
          onNav({ kind: 'all' });
          onCloseDrawer?.();
        }}
        style={({ pressed }) => [
          styles.navItem,
          nav.kind === 'all' && styles.navItemActive,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.navItemText, nav.kind === 'all' && styles.navItemTextActive]}>All Tasks</Text>
        <Text style={styles.navCount}>{allCount}</Text>
      </Pressable>

      <Text style={[styles.navSectionLabel, styles.navSectionSpaced]}>Categories</Text>
      {CATEGORIES.map((c) => {
        const active = nav.kind === 'category' && nav.id === c.id;
        const count = todos.filter((t) => t.categoryId === c.id).length;
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              onNav({ kind: 'category', id: c.id });
              onCloseDrawer?.();
            }}
            style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.pressed]}>
            <View style={styles.navItemLeft}>
              <View style={[styles.navDot, { backgroundColor: c.dot }]} />
              <Text style={[styles.navItemText, active && styles.navItemTextActive]}>{c.label}</Text>
            </View>
            <Text style={styles.navCount}>{count}</Text>
          </Pressable>
        );
      })}

      <Text style={[styles.navSectionLabel, styles.navSectionSpaced]}>Quick links</Text>
      <Pressable
        onPress={() => {
          onNav({ kind: 'today' });
          onCloseDrawer?.();
        }}
        style={({ pressed }) => [
          styles.navItem,
          nav.kind === 'today' && styles.navItemActive,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.navItemText, nav.kind === 'today' && styles.navItemTextActive]}>Today</Text>
        <Text style={styles.navCount}>{todayCount}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          onNav({ kind: 'starred' });
          onCloseDrawer?.();
        }}
        style={({ pressed }) => [
          styles.navItem,
          nav.kind === 'starred' && styles.navItemActive,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.navItemText, nav.kind === 'starred' && styles.navItemTextActive]}>Starred</Text>
        <Text style={styles.navCount}>{starredCount}</Text>
      </Pressable>

      <View style={styles.proCard}>
        <Text style={styles.proTitle}>Upgrade to Pro</Text>
        <Text style={styles.proCopy}>Unlock advanced analytics and team spaces.</Text>
        <Pressable style={({ pressed }) => [styles.proBtn, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.proBtnText}>Learn more</Text>
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]} accessibilityRole="button">
        <Text style={styles.settingsGlyph}>⚙</Text>
        <Text style={styles.navItemText}>Settings</Text>
      </Pressable>
    </ScrollView>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  width: number;
}

function StatCard({ label, value, hint, width }: StatCardProps) {
  return (
    <View style={[styles.statCard, { width }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [todos, dispatch] = useReducer(todosReducer, [] as Task[]);
  const [nav, setNav] = useState<NavFilter>({ kind: 'all' });
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [addOpen, setAddOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + BottomTabInset + Spacing.three;

  const isWide = windowWidth >= TASKFLOW_SIDEBAR_BREAKPOINT;
  const mainPad = Spacing.four;
  const mainContentWidth = isWide ? windowWidth - SIDEBAR_WIDTH : windowWidth;
  const innerMax = Math.min(mainContentWidth, TASKFLOW_MAX_MAIN_WIDTH);
  const statInnerWidth = innerMax - mainPad * 2;
  const statCols = getStatColumnCount(statInnerWidth);
  const statCardWidth = (statInnerWidth - STAT_GAP * (statCols - 1)) / statCols;

  const filtered = useMemo(() => {
    let list = todos;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
    if (nav.kind === 'category') list = list.filter((t) => t.categoryId === nav.id);
    if (nav.kind === 'today') list = list.filter((t) => t.createdAt >= startOfTodayMs());
    if (nav.kind === 'starred') list = list.filter((t) => t.starred);
    return list;
  }, [nav, search, todos]);

  const sortedVisible = useMemo(() => sortTasks(filtered, sortMode), [filtered, sortMode]);

  const sections = useMemo(() => {
    const pending = sortedVisible.filter((t) => !t.completed);
    const done = sortedVisible.filter((t) => t.completed);
    const out: { title: string; data: Task[] }[] = [];
    out.push({ title: `In Progress (${pending.length})`, data: pending });
    if (done.length) out.push({ title: 'Completed', data: done });
    return out;
  }, [sortedVisible]);

  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);
  const pendingCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const completionRate = useMemo(() => {
    if (!todos.length) return 0;
    return Math.round((completedCount / todos.length) * 100);
  }, [completedCount, todos.length]);
  const urgentHigh = useMemo(
    () => todos.filter((t) => !t.completed && t.priority === 'high').length,
    [todos],
  );

  const pageHeading = useMemo(() => {
    if (nav.kind === 'all') return 'All Tasks';
    if (nav.kind === 'category') return getCategory(nav.id).label;
    if (nav.kind === 'today') return 'Today';
    return 'Starred';
  }, [nav]);

  const cycleSort = useCallback(() => {
    setSortMode((m) => (m === 'recent' ? 'priority' : 'recent'));
  }, []);

  const onSubmitTask = useCallback((payload: NewTaskForm) => {
    dispatch({ type: 'add', payload });
  }, []);

  const handleToggle = useCallback((id: string) => {
    dispatch({ type: 'toggle', id });
  }, []);

  const handleRemove = useCallback((id: string) => {
    dispatch({ type: 'remove', id });
  }, []);

  const handleToggleStar = useCallback((id: string) => {
    dispatch({ type: 'toggleStar', id });
  }, []);

  const listHeader = useMemo(
    () => (
      <View style={{ paddingHorizontal: mainPad, paddingBottom: Spacing.three }}>
        {!isWide ? (
          <View style={styles.mobileTop}>
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Open navigation menu">
              <View style={styles.hamburger}>
                <View style={styles.hamBar} />
                <View style={styles.hamBar} />
                <View style={styles.hamBar} />
              </View>
            </Pressable>
            <Text style={styles.mobileBrand}>TaskFlow</Text>
            <Pressable
              onPress={() => setAddOpen(true)}
              style={({ pressed }) => [styles.iconBtnPrimary, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Add task">
              <Text style={styles.iconBtnPrimaryText}>+</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.searchRow, { marginTop: isWide ? Spacing.two : Spacing.three }]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tasks..."
            placeholderTextColor={TaskflowPalette.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Search tasks"
          />
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>John Doe</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>Pro Member</Text>
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.ghostIcon, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.ghostIconText}>☀</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.ghostIcon, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.ghostIconText}>🔔</Text>
          </Pressable>
        </View>

        <View style={styles.heroRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.pageTitle}>{pageHeading}</Text>
              <View style={styles.overviewPill}>
                <Text style={styles.overviewPillText}>Overview</Text>
              </View>
            </View>
            <Text style={styles.pageSubtitle}>Plan, prioritize, and ship work in one place.</Text>
          </View>
          <View style={styles.heroActions}>
            {!isWide ? (
              <Pressable
                onPress={() => setDrawerOpen(true)}
                style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Open filters and categories">
                <Text style={styles.filterPillText}>Filter</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={cycleSort}
              style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Change sort order">
              <Text style={styles.filterPillText}>{sortMode === 'recent' ? 'Sort · Recent' : 'Sort · Priority'}</Text>
            </Pressable>
            {isWide ? (
              <Pressable
                onPress={() => setAddOpen(true)}
                style={({ pressed }) => [styles.addCompact, pressed && styles.pressed]}
                accessibilityRole="button">
                <Text style={styles.addCompactText}>+ Add Task</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={[styles.statsRow, { gap: STAT_GAP }]}>
          <StatCard
            label="Completion rate"
            value={`${completionRate}%`}
            hint={todos.length ? 'Across all tasks' : 'Add tasks to track'}
            width={statCardWidth}
          />
          <StatCard label="Completed" value={`${completedCount}`} hint="Finished tasks" width={statCardWidth} />
          <StatCard label="Pending" value={`${pendingCount}`} hint={`${urgentHigh} high priority`} width={statCardWidth} />
          <StatCard label="High priority" value={`${urgentHigh}`} hint="Needs focus" width={statCardWidth} />
        </View>

        {todos.length > 0 && sortedVisible.length === 0 ? (
          <Text style={styles.filterEmpty}>No tasks match this filter. Try another category or search.</Text>
        ) : null}
      </View>
    ),
    [
      completionRate,
      completedCount,
      cycleSort,
      isWide,
      mainPad,
      pendingCount,
      search,
      sortMode,
      statCardWidth,
      sortedVisible.length,
      todos.length,
      urgentHigh,
      pageHeading,
    ],
  );

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No tasks yet</Text>
        <Text style={styles.emptyBody}>
          Tap Add New Task or use + to create one. Name, category, and priority are validated before saving.
        </Text>
      </View>
    ),
    [],
  );

  const sectionList = (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: mainPad }}>
          <TaskCard
            item={item}
            onToggle={handleToggle}
            onRemove={handleRemove}
            onToggleStar={handleToggleStar}
          />
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View style={[styles.sectionHeader, { paddingHorizontal: mainPad }]}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={todos.length === 0 ? listEmpty : null}
      stickySectionHeadersEnabled
      contentContainerStyle={{ paddingBottom: bottomInset + Spacing.four }}
      style={styles.sectionList}
      showsVerticalScrollIndicator={false}
    />
  );

  const drawerWidth = Math.min(320, Math.round(windowWidth * 0.88));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      {isWide ? (
        <View style={styles.wideRow}>
          <View style={[styles.sidebarCol, { width: SIDEBAR_WIDTH, paddingBottom: bottomInset }]}>
            <TaskflowSidebar
              todos={todos}
              nav={nav}
              onNav={setNav}
              onAdd={() => setAddOpen(true)}
            />
          </View>
          <View style={styles.mainColOuter}>
            <View style={[styles.mainCol, { maxWidth: TASKFLOW_MAX_MAIN_WIDTH }]}>
              {sectionList}
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.narrowCol, { paddingBottom: 0 }]}>
          {sectionList}
        </View>
      )}

      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerRoot}>
          <View style={[styles.drawerPanel, { width: drawerWidth, paddingTop: insets.top, paddingBottom: bottomInset }]}>
            <TaskflowSidebar
              todos={todos}
              nav={nav}
              onNav={setNav}
              onAdd={() => setAddOpen(true)}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </View>
          <Pressable style={styles.drawerScrim} onPress={() => setDrawerOpen(false)} accessibilityLabel="Close menu" />
        </View>
      </Modal>

      <AddTaskModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={onSubmitTask} />
      {Platform.OS === 'web' && <WebBadge />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TaskflowPalette.bg,
  },
  wideRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarCol: {
    borderRightWidth: 1,
    borderRightColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TaskflowPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkGlyph: {
    color: '#fff',
    fontSize: 22,
  },
  brandTitle: {
    color: TaskflowPalette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  brandTag: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  addNewCta: {
    backgroundColor: TaskflowPalette.primary,
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  addNewCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  navSectionLabel: {
    color: TaskflowPalette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  navSectionSpaced: {
    marginTop: Spacing.three,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: TaskflowPalette.primarySoft,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  navItemText: {
    color: TaskflowPalette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  navItemTextActive: {
    color: '#BFDBFE',
  },
  navCount: {
    color: TaskflowPalette.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  navDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  proCard: {
    marginTop: Spacing.five,
    padding: Spacing.three,
    borderRadius: 14,
    backgroundColor: TaskflowPalette.primarySoft,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    gap: Spacing.two,
  },
  proTitle: {
    color: TaskflowPalette.text,
    fontWeight: '700',
    fontSize: 16,
  },
  proCopy: {
    color: TaskflowPalette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  proBtn: {
    alignSelf: 'flex-start',
    backgroundColor: TaskflowPalette.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  proBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
  },
  settingsGlyph: {
    color: TaskflowPalette.textMuted,
    fontSize: 18,
  },
  mainColOuter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'stretch',
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    alignSelf: 'center',
  },
  narrowCol: {
    flex: 1,
  },
  sectionList: {
    flex: 1,
    backgroundColor: TaskflowPalette.bg,
  },
  mobileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  mobileBrand: {
    color: TaskflowPalette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TaskflowPalette.surface2,
  },
  hamburger: {
    gap: 5,
    width: 20,
  },
  hamBar: {
    height: 2,
    borderRadius: 1,
    backgroundColor: TaskflowPalette.text,
  },
  iconBtnPrimary: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: TaskflowPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPrimaryText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.select({ web: 10, default: 6 }),
  },
  searchIcon: {
    color: TaskflowPalette.textMuted,
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    color: TaskflowPalette.text,
    fontSize: 16,
    minHeight: 40,
    paddingVertical: Spacing.two,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TaskflowPalette.surface2,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: TaskflowPalette.text,
    fontWeight: '700',
  },
  profileName: {
    color: TaskflowPalette.text,
    fontWeight: '700',
    fontSize: 16,
  },
  proBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: TaskflowPalette.primarySoft,
  },
  proBadgeText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ghostIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TaskflowPalette.surface,
  },
  ghostIconText: {
    fontSize: 16,
  },
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.five,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  pageTitle: {
    color: TaskflowPalette.text,
    fontSize: 28,
    fontWeight: '700',
  },
  overviewPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: TaskflowPalette.primarySoft,
    borderWidth: 1,
    borderColor: TaskflowPalette.primary,
  },
  overviewPillText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: TaskflowPalette.textMuted,
    fontSize: 15,
    marginTop: Spacing.two,
    lineHeight: 22,
    maxWidth: 560,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface2,
  },
  filterPillText: {
    color: TaskflowPalette.text,
    fontWeight: '600',
    fontSize: 13,
  },
  addCompact: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    backgroundColor: TaskflowPalette.primary,
  },
  addCompactText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.four,
  },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface,
    padding: Spacing.three,
    gap: 6,
  },
  statLabel: {
    color: TaskflowPalette.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: TaskflowPalette.text,
    fontSize: 26,
    fontWeight: '700',
  },
  statHint: {
    color: TaskflowPalette.textMuted,
    fontSize: 12,
  },
  filterEmpty: {
    marginTop: Spacing.three,
    color: TaskflowPalette.warning,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    backgroundColor: TaskflowPalette.bg,
  },
  sectionTitle: {
    color: TaskflowPalette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  taskCard: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TaskflowPalette.border,
    backgroundColor: TaskflowPalette.surface2,
    marginBottom: Spacing.two,
  },
  taskAccent: {
    width: 4,
  },
  taskBody: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.two,
    paddingLeft: Spacing.two,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: TaskflowPalette.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioInnerOn: {
    backgroundColor: TaskflowPalette.primary,
  },
  taskTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    color: TaskflowPalette.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: TaskflowPalette.textMuted,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  metaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaCategory: {
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
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  starGlyph: {
    color: TaskflowPalette.textMuted,
    fontSize: 20,
    paddingHorizontal: Spacing.one,
  },
  starGlyphOn: {
    color: '#FBBF24',
  },
  removeGlyph: {
    color: TaskflowPalette.textMuted,
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
  },
  emptyWrap: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  emptyTitle: {
    color: TaskflowPalette.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  emptyBody: {
    color: TaskflowPalette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 360,
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerPanel: {
    backgroundColor: TaskflowPalette.surface,
    borderRightWidth: 1,
    borderRightColor: TaskflowPalette.border,
  },
  drawerScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
