import { api } from './client';
import type { Order, OrderTimeline, PaginatedResponse } from '../types';

export const ordersApi = {
  checkout: (token: string) =>
    api.post<Order>('/orders/checkout', undefined, token),

  list: (token: string) =>
    api.get<PaginatedResponse<Order>>('/orders', token),

  getById: (id: string, token: string) =>
    api.get<Order>(`/orders/${id}`, token),

  cancel: (id: string, token: string) =>
    api.post<Order>(`/orders/${id}/cancel`, undefined, token),

  getTimeline: (id: string, token: string) =>
    api.get<OrderTimeline[]>(`/orders/${id}/timeline`, token),

  reorder: (id: string, token: string) =>
    api.post<{ cartId: string }>(`/orders/${id}/reorder`, undefined, token),
};
