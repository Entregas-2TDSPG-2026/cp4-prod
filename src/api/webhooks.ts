import { api } from './client';
import type {
  CreateWebhookPayload,
  PaginatedResponse,
  Webhook,
  WebhookDelivery,
  WebhookEvent,
} from '../types';

export const webhooksApi = {
  /** GET /webhooks/events — lista tipos de eventos disponíveis */
  listEvents: async (token: string): Promise<WebhookEvent[]> => {
    const res = await api.get<{ events: string[] }>('/webhooks/events', token);
    return (res.events ?? []).map((name) => ({ name, description: '' }));
  },

  /** GET /webhooks — lista todos os webhooks */
  list: (token: string) =>
    api.get<Webhook[]>('/webhooks', token),

  /** POST /webhooks — cria um novo webhook */
  create: (payload: CreateWebhookPayload, token: string) =>
    api.post<Webhook & { signingSecret: string }>('/webhooks', payload, token),

  /** GET /webhooks/:id */
  getById: (id: string, token: string) =>
    api.get<Webhook>(`/webhooks/${id}`, token),

  /** PATCH /webhooks/:id */
  update: (
    id: string,
    payload: Partial<CreateWebhookPayload & { active: boolean }>,
    token: string,
  ) => api.patch<Webhook>(`/webhooks/${id}`, payload, token),

  /** DELETE /webhooks/:id */
  delete: (id: string, token: string) =>
    api.del<void>(`/webhooks/${id}`, token),

  /** POST /webhooks/:id/rotate-secret */
  rotateSecret: (id: string, token: string) =>
    api.post<{ signingSecret: string }>(`/webhooks/${id}/rotate-secret`, undefined, token),

  /** POST /webhooks/:id/ping */
  ping: (id: string, token: string) =>
    api.post<{ sent: boolean }>(`/webhooks/${id}/ping`, undefined, token),

  /** GET /webhooks/deliveries?page&pageSize */
  getDeliveries: (token: string, page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<WebhookDelivery>>(
      `/webhooks/deliveries?page=${page}&pageSize=${pageSize}`,
      token,
    ),

  /** POST /webhooks/deliveries/:id/resend */
  resendDelivery: (deliveryId: string, token: string) =>
    api.post<{ sent: boolean }>(`/webhooks/deliveries/${deliveryId}/resend`, undefined, token),

  /** POST /webhooks/deliver-now */
  deliverNow: (token: string) =>
    api.post<{ queued: number }>('/webhooks/deliver-now', undefined, token),
};
