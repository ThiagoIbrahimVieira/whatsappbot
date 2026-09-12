import type { z } from 'zod';
import type { envSchema } from '../config/schema.js';
export type AppConfig = z.infer<typeof envSchema>;
