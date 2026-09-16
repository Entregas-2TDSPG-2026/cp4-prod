import { api } from './client';
import type { AuthResponse, Customer, LoginPayload, RegisterPayload } from '../types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),

  getMe: (token: string) =>
    api.get<Customer>('/auth/me', token),
};
