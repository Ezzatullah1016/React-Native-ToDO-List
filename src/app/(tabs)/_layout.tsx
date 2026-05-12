import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/lib/theme-mode';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(
  outline: IonName,
  solid: IonName,
): (props: { color: string; size: number; focused: boolean }) => React.ReactNode {
  return ({ color, size, focused }) => (
    <Ionicons name={focused ? solid : outline} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const { resolved } = useThemeMode();
  const colors = Colors[resolved];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: tabIcon('grid-outline', 'grid'),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: tabIcon('bar-chart-outline', 'bar-chart'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('settings-outline', 'settings'),
        }}
      />
    </Tabs>
  );
}
