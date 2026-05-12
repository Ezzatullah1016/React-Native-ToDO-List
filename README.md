# React-Native-ToDO-List

Simple React Native todo list using [Expo](https://expo.dev) **SDK 54** and Expo Router. It matches the scope in [`Requirements.txt`](Requirements.txt): home task list, add/edit/delete, completion toggle, Zod validation, **AsyncStorage** persistence, and **Expo Go** (store build) compatibility.

## Prerequisites

- Node.js (LTS recommended; Expo may warn below `20.19.4`)
- npm
- [Expo Go](https://expo.dev/go) on a physical device, or Android Studio / Xcode simulator

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the dev server

   ```bash
   npx expo start
   ```

3. Open in **Expo Go** (scan QR) or press `a` / `i` for Android / iOS simulator. Use the same Wi‑Fi as your computer, or run `npx expo start --tunnel` if the device cannot reach your PC.

## Requirements mapping (quick)

| Spec area | Implementation |
|-----------|------------------|
| §2.1 UI (list, add, scroll) | [`src/app/(tabs)/index.tsx`](src/app/(tabs)/index.tsx) — `SectionList` (virtualized scrollable list; same role as `FlatList` for large lists) |
| §2.2 CRUD + complete | [`src/lib/todos-context.tsx`](src/lib/todos-context.tsx) |
| §2.3 AsyncStorage | [`src/lib/task-storage.ts`](src/lib/task-storage.ts) |
| §4 `@expo/vector-icons` | Tab icons in [`src/app/(tabs)/_layout.tsx`](src/app/(tabs)/_layout.tsx) |
| §8 Validation | [`src/lib/task-schema.ts`](src/lib/task-schema.ts) + [`add-task-modal.tsx`](src/components/add-task-modal.tsx) |
| §11 Android build | [`eas.json`](eas.json) — see **EAS Build** below |
| §9 Optional (activity log) | [`src/app/(tabs)/settings.tsx`](src/app/(tabs)/settings.tsx) + `activityLog` in [`src/lib/todos-context.tsx`](src/lib/todos-context.tsx) |
| §13 Screenshots | Place PNGs under [`docs/screenshots/`](docs/screenshots/README.md) |

## Project layout

- [`src/app/_layout.tsx`](src/app/_layout.tsx) — `ThemeModeProvider`, `TodosProvider`, root `Stack` (tab group + task stack)
- [`src/app/(tabs)/_layout.tsx`](src/app/(tabs)/_layout.tsx) — bottom **Tabs** with vector icons (Home, Categories, Stats, Settings)
- [`src/app/(tabs)/index.tsx`](src/app/(tabs)/index.tsx) — Home (todo dashboard)
- [`src/app/(tabs)/categories.tsx`](src/app/(tabs)/categories.tsx) — Categories + deep link to Home filter
- [`src/app/(tabs)/stats.tsx`](src/app/(tabs)/stats.tsx) — Stats + clear completed
- [`src/app/(tabs)/settings.tsx`](src/app/(tabs)/settings.tsx) — Theme mode, clear all, app info, recent activity (§9)
- [`src/app/task/[id].tsx`](src/app/task/[id].tsx) — Task detail
- [`src/components/add-task-modal.tsx`](src/components/add-task-modal.tsx) — Add/edit form
- [`src/constants/taskflow.ts`](src/constants/taskflow.ts) — TaskFlow colors + categories
- [`src/lib/todos-context.tsx`](src/lib/todos-context.tsx) — Shared todo state + persistence
- [`src/lib/theme-mode.ts`](src/lib/theme-mode.ts) — System / light / dark preference

## EAS Build (Android APK)

One-time setup on your machine:

```bash
npx eas login
npx eas init
```

Build using the npm script (uses profile `production` in [`eas.json`](eas.json), **APK** for sideloading):

```bash
npm run build:android
```

Equivalent CLI:

```bash
npx eas build --platform android --profile production
```

Use profile **`preview`** in `eas.json` for internal distribution-style APKs. Adjust `buildType` to `app-bundle` if you need Play Store AAB instead of APK.

| Profile | Android `buildType` | Notes |
|---------|----------------------|--------|
| `preview` | `apk` | `distribution: internal` — good for sharing test builds |
| `production` | `apk` | Used by `npm run build:android` |

## Tests

```bash
npm test
```

See [`src/__tests__/`](src/__tests__/) for Requirement §10–style checks (add, delete, edit, storage mock).

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
