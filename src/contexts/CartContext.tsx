import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cartApi } from '../api/cart';
import type { Cart } from '../types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cartApi.get(token);
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      if (!token) throw new Error('Autenticação necessária');
      await cartApi.addItem({ variantId, quantity }, token);
      await refresh();
    },
    [token, refresh],
  );

  const updateItem = useCallback(
    async (variantId: string, quantity: number) => {
      if (!token) throw new Error('Autenticação necessária');
      await cartApi.updateItem(variantId, { quantity }, token);
      await refresh();
    },
    [token, refresh],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (!token) throw new Error('Autenticação necessária');
      await cartApi.removeItem(variantId, token);
      await refresh();
    },
    [token, refresh],
  );

  const clearCart = useCallback(async () => {
    if (!token) throw new Error('Autenticação necessária');
    await cartApi.clear(token);
    setCart(null);
  }, [token]);

  const itemCount = cart?.itemCount ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, itemCount, isLoading, addItem, updateItem, removeItem, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
