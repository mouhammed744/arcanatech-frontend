import { useState, useCallback } from 'react';
import type { LiveRfidEvent } from '@/types';
import { useSocket } from './useSocket';

export const useRfidLive = (maxItems = 20) => {
  const [events, setEvents] = useState<LiveRfidEvent[]>([]);

  const handleRfidEvent = useCallback(
    (event: LiveRfidEvent) => {
      setEvents((prev) => {
        const newEvent = { ...event, isNew: true };
        const updated = [newEvent, ...prev].slice(0, maxItems);
        // Retirer le flag "isNew" après 2s
        setTimeout(() => {
          setEvents((current) =>
            current.map((e) => (e.id === event.id ? { ...e, isNew: false } : e))
          );
        }, 2000);
        return updated;
      });
    },
    [maxItems]
  );

  const { subscribeToRoom, unsubscribeFromRoom } = useSocket(handleRfidEvent);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, subscribeToRoom, unsubscribeFromRoom, clearEvents };
};
