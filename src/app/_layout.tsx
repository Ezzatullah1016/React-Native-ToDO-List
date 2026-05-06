import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemeModeProvider, useThemeMode } from '@/lib/theme-mode';
import { TodosProvider } from '@/lib/todos-context';

function ThemedShell() {
  const { resolved } = useThemeMode();
  return (
    <ThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <TodosProvider>
        <ThemedShell />
      </TodosProvider>
    </ThemeModeProvider>
  );
}
