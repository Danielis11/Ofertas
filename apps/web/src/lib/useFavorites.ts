import { useState, useEffect, useCallback } from 'react';
import { DealScore } from './api';

const STORAGE_KEY = 'dealhunter_favorites_v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<DealScore[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Error saving favorites to localStorage:', e);
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (dealIdOrProductId: string) => {
      return favorites.some(
        (f) =>
          f.offer.id === dealIdOrProductId ||
          f.offer.productId === dealIdOrProductId ||
          f.offer.externalId === dealIdOrProductId
      );
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (deal: DealScore) => {
      setFavorites((prev) => {
        const exists = prev.some(
          (f) =>
            f.offer.id === deal.offer.id ||
            f.offer.productId === deal.offer.productId ||
            f.offer.externalId === deal.offer.externalId
        );
        if (exists) {
          return prev.filter(
            (f) =>
              f.offer.id !== deal.offer.id &&
              f.offer.productId !== deal.offer.productId &&
              f.offer.externalId !== deal.offer.externalId
          );
        } else {
          return [deal, ...prev];
        }
      });
    },
    []
  );

  const removeFavorite = useCallback((offerId: string) => {
    setFavorites((prev) => prev.filter((f) => f.offer.id !== offerId && f.offer.productId !== offerId));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    favoritesCount: favorites.length,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
}
