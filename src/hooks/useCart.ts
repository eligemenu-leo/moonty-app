import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Dish } from '../types';

const STORAGE_KEY = 'moonty_cart';

interface PersistedCart {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string;
}

export function useCart() {
  const [items, setItems]             = useState<CartItem[]>([]);
  const [restaurantId, setRestId]     = useState<string | null>(null);
  const [restaurantName, setRestName] = useState<string>('');
  const [hydrated, setHydrated]       = useState(false);

  // Cargar carrito persistido al arrancar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved: PersistedCart = JSON.parse(raw);
          setItems(saved.items ?? []);
          setRestId(saved.restaurantId ?? null);
          setRestName(saved.restaurantName ?? '');
        } catch { /* JSON corrupto — ignorar */ }
      }
      setHydrated(true);
    });
  }, []);

  // Guardar cada vez que el carrito cambia (solo tras hidratar)
  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedCart = { items, restaurantId, restaurantName };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items, restaurantId, restaurantName, hydrated]);

  const addItem = useCallback((dish: Dish, restId: string, restName: string) => {
    if (restaurantId && restaurantId !== restId) {
      // Carrito de otro restaurante — vaciarlo antes de añadir
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
      const updated = prev
        .map(i => i.dish.id === dishId ? { ...i, quantity: i.quantity - 1 } : i)
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

  const total = items.reduce((s, i) => s + i.dish.price_1 * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, total, count, restaurantId, restaurantName, hydrated, addItem, removeItem, clearCart };
}
