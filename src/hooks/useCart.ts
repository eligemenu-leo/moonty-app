import { useState, useCallback } from 'react';
import { CartItem, Dish } from '../types';

export function useCart() {
  const [items, setItems]           = useState<CartItem[]>([]);
  const [restaurantId, setRestId]   = useState<string | null>(null);
  const [restaurantName, setRestName] = useState<string>('');

  const addItem = useCallback((dish: Dish, restId: string, restName: string) => {
    // Si el carrito pertenece a otro restaurante, vaciarlo primero
    if (restaurantId && restaurantId !== restId) {
      setItems([]);
    }
    setRestId(restId);
    setRestName(restName);
    setItems(prev => {
      const existing = prev.find(i => i.dish.id === dish.id);
      if (existing) {
        return prev.map(i => i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { dish, quantity: 1, restaurantId: restId, restaurantName: restName }];
    });
  }, [restaurantId]);

  const removeItem = useCallback((dishId: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.dish.id === dishId ? { ...i, quantity: i.quantity - 1 } : i)
                         .filter(i => i.quantity > 0);
      if (updated.length === 0) { setRestId(null); setRestName(''); }
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestId(null);
    setRestName('');
  }, []);

  const total    = items.reduce((s, i) => s + i.dish.price * i.quantity, 0);
  const count    = items.reduce((s, i) => s + i.quantity, 0);

  return { items, total, count, restaurantId, restaurantName, addItem, removeItem, clearCart };
}
