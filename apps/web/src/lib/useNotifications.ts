import { useState, useEffect, useCallback } from 'react';
import { LiveEvent } from './useLiveDeals';
import { DealScore } from './api';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'PRICE_DROP' | 'SUPER_DEAL' | 'FAVORITE_ALERT' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  dealId?: string;
  storeSlug?: string;
  price?: number;
  oldPrice?: number;
  savingsPercentage?: number;
  dealData?: DealScore;
}

const STORAGE_KEY = 'dealhunter_notifications_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'init-1',
    title: 'Super Deal: Nintendo Switch OLED',
    message: 'Alcanzó su precio más bajo en Amazon México a $5,399 MXN (-25%).',
    type: 'SUPER_DEAL',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    storeSlug: 'amazon-mx',
    price: 5399,
    savingsPercentage: 25,
  },
  {
    id: 'init-2',
    title: 'Bajada de Precio: Apple MacBook Air M2',
    message: 'Bajó de $22,499 a $17,999 MXN en Liverpool y Costco.',
    type: 'PRICE_DROP',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    storeSlug: 'liverpool-mx',
    price: 17999,
    oldPrice: 22499,
    savingsPercentage: 20,
  },
  {
    id: 'init-3',
    title: 'Catálogos Actualizados',
    message: 'Se sincronizaron más de 3,000 ofertas en Liverpool, Walmart y Costco México.',
    type: 'SYSTEM',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
  },
];

export function useNotifications(latestLiveEvent?: LiveEvent | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [hasDesktopPermission, setHasDesktopPermission] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Error saving notifications to localStorage:', e);
    }
  }, [notifications]);

  // Request browser notification permission
  const requestDesktopPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasDesktopPermission(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send desktop notification helper
  const triggerDesktopNotification = useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Desktop notification failed:', e);
      }
    }
  }, []);

  // Integrate incoming live websocket events
  useEffect(() => {
    if (!latestLiveEvent) return;

    const notifType =
      latestLiveEvent.type === 'PRICE_DROPPED'
        ? 'PRICE_DROP'
        : latestLiveEvent.type === 'USER_ALERT_TRIGGERED'
        ? 'FAVORITE_ALERT'
        : 'SUPER_DEAL';

    const formattedPrice = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(latestLiveEvent.price);

    const message = latestLiveEvent.oldPrice
      ? `Bajó de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(latestLiveEvent.oldPrice)} a ${formattedPrice} en ${latestLiveEvent.storeSlug}`
      : `Nuevo precio detectado: ${formattedPrice} en ${latestLiveEvent.storeSlug}`;

    const newNotif: AppNotification = {
      id: latestLiveEvent.id,
      title: latestLiveEvent.title,
      message,
      type: notifType,
      timestamp: latestLiveEvent.timestamp,
      read: false,
      storeSlug: latestLiveEvent.storeSlug,
      price: latestLiveEvent.price,
      oldPrice: latestLiveEvent.oldPrice,
    };

    setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)].slice(0, 30));

    // Trigger desktop notification if granted
    triggerDesktopNotification(`DealHunter: ${latestLiveEvent.title}`, message);
  }, [latestLiveEvent, triggerDesktopNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    hasDesktopPermission,
    requestDesktopPermission,
  };
}
