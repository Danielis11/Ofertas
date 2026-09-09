import { useState, useEffect, useCallback } from 'react';

export interface UserSearchIntent {
  intent: 'RUNNING' | 'BASKETBALL' | 'CASUAL_SNEAKERS' | 'SMARTPHONES' | 'GENERAL';
  brand?: string;
  query: string;
  timestamp: number;
}

const STORAGE_KEY = 'dealhunter_user_intent';

export function useUserIntent() {
  const [currentIntent, setCurrentIntent] = useState<UserSearchIntent | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UserSearchIntent = JSON.parse(stored);
        // Expire after 7 days
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          setCurrentIntent(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore JSON errors
    }
  }, []);

  const trackQuery = useCallback((query: string) => {
    if (!query || query.trim().length < 2) return;
    const qLow = query.toLowerCase().trim();

    // 1. Detect Brand
    let brand: string | undefined;
    if (qLow.includes('new balance') || qLow.includes('balanse') || qLow.includes('newbalance')) {
      brand = 'New Balance';
    } else if (qLow.includes('nike') || qLow.includes('jordan')) {
      brand = 'Nike';
    } else if (qLow.includes('adidas')) {
      brand = 'Adidas';
    } else if (qLow.includes('puma')) {
      brand = 'Puma';
    } else if (qLow.includes('converse')) {
      brand = 'Converse';
    } else if (qLow.includes('motorola') || qLow.includes('moto')) {
      brand = 'Motorola';
    } else if (qLow.includes('samsung') || qLow.includes('galaxy')) {
      brand = 'Samsung';
    } else if (qLow.includes('xiaomi') || qLow.includes('redmi') || qLow.includes('poco')) {
      brand = 'Xiaomi';
    }

    // 2. Detect Specific Category / Intent
    let intent: UserSearchIntent['intent'] = 'GENERAL';

    if (
      qLow.includes('correr') ||
      qLow.includes('running') ||
      qLow.includes('maraton') ||
      qLow.includes('1080') ||
      qLow.includes('pegasus') ||
      qLow.includes('alphafly') ||
      qLow.includes('vomero') ||
      qLow.includes('fuelcell')
    ) {
      intent = 'RUNNING';
    } else if (
      qLow.includes('basquet') ||
      qLow.includes('basketball') ||
      qLow.includes('jordan') ||
      qLow.includes('immortality')
    ) {
      intent = 'BASKETBALL';
    } else if (
      qLow.includes('casual') ||
      qLow.includes('chuck taylor') ||
      qLow.includes('all star') ||
      qLow.includes('court vision') ||
      qLow.includes('suede') ||
      qLow.includes('plataforma')
    ) {
      intent = 'CASUAL_SNEAKERS';
    } else if (
      qLow.includes('celular') ||
      qLow.includes('smartphone') ||
      qLow.includes('telefono') ||
      qLow.includes('edge') ||
      qLow.includes('redmi') ||
      qLow.includes('galaxy') ||
      qLow.includes('iphone')
    ) {
      intent = 'SMARTPHONES';
    } else if (brand && (qLow.includes('tenis') || qLow.includes('sneaker'))) {
      // Default brand sneaker search to running or casual based on brand
      if (brand === 'New Balance') intent = 'RUNNING';
      else if (brand === 'Converse') intent = 'CASUAL_SNEAKERS';
      else intent = 'RUNNING';
    }

    // Only save meaningful intents
    if (intent !== 'GENERAL' || brand) {
      const newRecord: UserSearchIntent = {
        intent,
        brand,
        query: query.trim(),
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecord));
        setCurrentIntent(newRecord);
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const clearIntent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentIntent(null);
    } catch {
      // ignore storage errors
    }
  }, []);

  return {
    recentIntent: currentIntent,
    trackQuery,
    clearIntent,
  };
}
