import { z } from 'zod';

import { CATEGORY_IDS, PRIORITY_IDS } from '@/constants/taskflow';

export const newTaskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task name is required')
    .max(200, 'Task name must be 200 characters or less'),
  categoryId: z.enum(CATEGORY_IDS, { message: 'Pick a category' }),
  priority: z.enum(PRIORITY_IDS, { message: 'Pick a priority' }),
});

export type NewTaskForm = z.infer<typeof newTaskFormSchema>;
