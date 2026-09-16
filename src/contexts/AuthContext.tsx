import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import type { Customer, LoginPayload, RegisterPayload } from '../types';

const TOKEN_KEY = '@mockmerce:token';
const USER_KEY  = '@mockmerce:user';

interface AuthContextValue {
  user: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão do storage local (sem chamar API)
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ])
      .then(([storedToken, storedUser]) => {
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as Customer);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = async (t: string, c: Customer) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, t),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(c)),
    ]);
    setToken(t);
    setUser(c);
  };

  const login = useCallback(async (payload: LoginPayload) => {
    const { token: t, customer } = await authApi.login(payload);
    // Busca dados frescos via GET /auth/me
    const freshCustomer = await authApi.getMe(t).catch(() => customer);
    await persist(t, freshCustomer);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { token: t, customer } = await authApi.register(payload);
    // Busca dados frescos via GET /auth/me
    const freshCustomer = await authApi.getMe(t).catch(() => customer);
    await persist(t, freshCustomer);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  // refreshUser: revalida o token chamando GET /auth/me
  const refreshUser = useCallback(async () => {
    const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (!storedToken) return;
    try {
      const fresh = await authApi.getMe(storedToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setUser(fresh);
    } catch {
      // token expirado — faz logout silencioso
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
