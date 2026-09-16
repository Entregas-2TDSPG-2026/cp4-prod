import { api } from './client';
import type { PaymentMethod, PaymentResult } from '../types';

export const paymentsApi = {
  pay: (orderId: string, method: PaymentMethod, token: string) =>
    api.post<PaymentResult>(`/orders/${orderId}/pay`, { method }, token),
};
