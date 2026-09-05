import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LiveEvent {
  id: string;
  type: 'DEAL_DETECTED' | 'PRICE_DROPPED' | 'USER_ALERT_TRIGGERED';
  title: string;
  price: number;
  oldPrice?: number;
  storeSlug: string;
  timestamp: string;
}

export function useLiveDeals() {
  const [isConnected, setIsConnected] = useState(false);
  const [latestLiveEvent, setLatestLiveEvent] = useState<LiveEvent | null>(null);
  const [eventsHistory, setEventsHistory] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000/events';
    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_stream');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('deal_detected', (payload: any) => {
      const data = payload.data || {};
      const newEvent: LiveEvent = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'DEAL_DETECTED',
        title: data.offer?.product?.name || 'Nueva Oferta Detectada',
        price: Number(data.offer?.price || 0),
        storeSlug: data.offer?.store?.slug || 'tienda',
        timestamp: payload.timestamp || new Date().toISOString(),
      };
      setLatestLiveEvent(newEvent);
      setEventsHistory((prev) => [newEvent, ...prev].slice(0, 10));
    });

    socket.on('price_dropped', (payload: any) => {
      const data = payload.data || {};
      const newEvent: LiveEvent = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'PRICE_DROPPED',
        title: `Bajada de precio en ${data.storeSlug || 'tienda'}`,
        price: Number(data.newPrice || 0),
        oldPrice: Number(data.oldPrice || 0),
        storeSlug: data.storeSlug || '',
        timestamp: payload.timestamp || new Date().toISOString(),
      };
      setLatestLiveEvent(newEvent);
      setEventsHistory((prev) => [newEvent, ...prev].slice(0, 10));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const dismissEvent = useCallback(() => {
    setLatestLiveEvent(null);
  }, []);

  return {
    isConnected,
    latestLiveEvent,
    eventsHistory,
    dismissEvent,
  };
}
