/**
 * PURPOSE: Persist the user's theme preference (system / light / dark)
 *          so Settings can override `useColorScheme()` at the root layout.
 * PLACEMENT: `src/lib/` — non-UI helper, mirrors `task-storage.ts`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = '@taskflow/theme/v1';

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'system';
  } catch {
    return 'system';
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Non-fatal: settings will fall back to system theme on next launch.
  }
}

interface ThemeModeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (next: ThemeMode) => void;
  hydrated: boolean;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

/** Provider that owns the user's theme preference and resolves 'system' against the OS. */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const osScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadThemeMode();
      if (cancelled) return;
      setModeState(stored);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveThemeMode(next);
  }, []);

  const resolved: ResolvedTheme = useMemo(() => {
    if (mode === 'system') return osScheme === 'dark' ? 'dark' : 'light';
    return mode;
  }, [mode, osScheme]);

  const value = useMemo<ThemeModeContextValue>(
    () => ({ mode, resolved, setMode, hydrated }),
    [mode, resolved, setMode, hydrated],
  );

  return createElement(ThemeModeContext.Provider, { value }, children);
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used inside <ThemeModeProvider>');
  }
  return ctx;
}
