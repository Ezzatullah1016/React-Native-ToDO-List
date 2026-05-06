# React-Native-ToDO-List

Simple React Native todo list using [Expo](https://expo.dev) and Expo Router, with a TaskFlow-style home screen, categories, priorities, Zod validation on tasks, AsyncStorage persistence, and extra tabs for analytics and settings.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   Use **iOS**, **Android**, or **web** from the CLI, or run `npm run web` for the browser.

## Project layout

- `src/app/_layout.tsx` — root providers (`ThemeModeProvider`, `TodosProvider`) and navigation shell
- `src/app/index.tsx` — Home (todo dashboard)
- `src/app/categories.tsx` — Categories overview + tap-through filter to Home
- `src/app/stats.tsx` — Stats and breakdowns + clear completed
- `src/app/settings.tsx` — Theme mode, clear all tasks, app info
- `src/app/task/[id].tsx` — Task detail (edit / complete / star / delete)
- `src/components/add-task-modal.tsx` — add/edit task form with validation
- `src/components/app-tabs.tsx` — bottom tab triggers (native SF Symbols icons)
- `src/constants/taskflow.ts` — dashboard colors and categories
- `src/lib/task-schema.ts` — Zod schema for task fields
- `src/lib/task-storage.ts` — AsyncStorage load/save for todos
- `src/lib/todos-context.tsx` — shared todo state + persistence hooks
- `src/lib/theme-mode.ts` — persisted appearance preference (system / light / dark)

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
