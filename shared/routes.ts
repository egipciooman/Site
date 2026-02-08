import { z } from 'zod';
import { users, plots } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  gameError: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  game: {
    state: {
      method: 'GET' as const,
      path: '/api/game/state',
      responses: {
        200: z.object({
          user: z.custom<typeof users.$inferSelect>(),
          plots: z.array(z.custom<typeof plots.$inferSelect>()),
        }),
      },
    },
    plant: {
      method: 'POST' as const,
      path: '/api/game/plant',
      input: z.object({
        plotIndex: z.number().min(0).max(8),
      }),
      responses: {
        200: z.custom<typeof plots.$inferSelect>(),
        400: errorSchemas.gameError,
      },
    },
    harvest: {
      method: 'POST' as const,
      path: '/api/game/harvest',
      input: z.object({
        plotIndex: z.number().min(0).max(8),
      }),
      responses: {
        200: z.object({
          plot: z.custom<typeof plots.$inferSelect>(),
          user: z.custom<typeof users.$inferSelect>(),
          reward: z.string(), // decimal as string
        }),
        400: errorSchemas.gameError,
      },
    },
    unlock: { // For simple login/creation
        method: 'POST' as const,
        path: '/api/game/init',
        input: z.object({
            username: z.string(),
            referralCode: z.string().optional(),
        }),
        responses: {
            200: z.custom<typeof users.$inferSelect>(),
        }
    }
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type PlantRequest = z.infer<typeof api.game.plant.input>;
export type HarvestRequest = z.infer<typeof api.game.harvest.input>;
export type GameStateResponse = z.infer<typeof api.game.state.responses[200]>;
