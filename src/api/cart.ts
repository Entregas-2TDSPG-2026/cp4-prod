import { api } from './client';
import type { AddCartItemPayload, Cart, CartItem, UpdateCartItemPayload } from '../types';

export const cartApi = {
  get: (token: string) =>
    api.get<Cart>('/cart', token),

  clear: (token: string) =>
    api.del<void>('/cart', token),

  addItem: (payload: AddCartItemPayload, token: string) =>
    api.post<CartItem>('/cart/items', payload, token),

  updateItem: (itemId: string, payload: UpdateCartItemPayload, token: string) =>
    api.patch<CartItem>(`/cart/items/${itemId}`, payload, token),

  removeItem: (itemId: string, token: string) =>
    api.del<void>(`/cart/items/${itemId}`, token),
};
