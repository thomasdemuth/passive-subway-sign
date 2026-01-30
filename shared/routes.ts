
import { z } from 'zod';
import { stationSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  stations: {
    list: {
      method: 'GET' as const,
      path: '/api/stations',
      responses: {
        200: z.array(stationSchema),
      },
    },
    getArrivals: {
      method: 'GET' as const,
      path: '/api/stations/:id/arrivals',
      responses: {
        200: z.array(z.object({
          routeId: z.string(),
          destination: z.string(),
          arrivalTime: z.string(),
          direction: z.enum(["Uptown", "Downtown"]),
          status: z.string()
        })),
        404: errorSchemas.validation,
      },
    },
  },
  alerts: {
    list: {
      method: 'GET' as const,
      path: '/api/alerts',
      responses: {
        200: z.array(z.object({
          id: z.string(),
          routeId: z.string(),
          alertType: z.string(),
          headerText: z.string(),
          descriptionText: z.string(),
          activePeriodStart: z.string().optional(),
          activePeriodEnd: z.string().optional(),
          severity: z.number()
        })),
      },
    },
    byRoute: {
      method: 'GET' as const,
      path: '/api/alerts/:routeId',
      responses: {
        200: z.array(z.object({
          id: z.string(),
          routeId: z.string(),
          alertType: z.string(),
          headerText: z.string(),
          descriptionText: z.string(),
          activePeriodStart: z.string().optional(),
          activePeriodEnd: z.string().optional(),
          severity: z.number()
        })),
      },
    },
  },
};

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
