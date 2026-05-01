# React-Native-ToDO-List

Simple React Native todo list using [Expo](https://expo.dev) and Expo Router, with a TaskFlow-style home screen, categories, priorities, and Zod validation on new tasks.

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

- `src/app/` — routes (`index.tsx` home, `explore.tsx`, `_layout.tsx`)
- `src/components/add-task-modal.tsx` — add-task form with validation
- `src/constants/taskflow.ts` — dashboard colors and categories
- `src/lib/task-schema.ts` — Zod schema for new tasks

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
