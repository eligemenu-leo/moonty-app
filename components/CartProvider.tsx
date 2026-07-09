import { createContext, useContext, ReactNode } from 'react';
import { useCart } from '@/src/hooks/useCart';

const CartContext = createContext<ReturnType<typeof useCart> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used inside CartProvider');
  return ctx;
}
