import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '@/store';
import { addNotification } from '@/store/slices/notificationsSlice';
import type { LiveRfidEvent } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

export const useSocket = (onRfidEvent?: (event: LiveRfidEvent) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket] Connecté:', socket.id);
    });

    socket.on('rfid:scan', (event: LiveRfidEvent) => {
      const statusLabel =
        event.attendanceStatus === 'present' ? '✅ Présent' :
        event.attendanceStatus === 'late' ? `⏰ Retard (${event.minutesLate} min)` :
        '❌ Refusé';

      dispatch(addNotification({
        type: event.attendanceStatus === 'present' ? 'success' :
              event.attendanceStatus === 'late' ? 'warning' : 'error',
        title: `Scan RFID — ${event.roomName}`,
        message: `${event.studentName || 'Inconnu'} — ${statusLabel}`,
        rfidEventId: event.id,
        studentName: event.studentName,
        roomName: event.roomName,
      }));
      onRfidEvent?.(event);
    });

    socket.on('reader:status', (data: { readerId: string; status: string; roomName: string }) => {
      if (data.status === 'offline') {
        dispatch(addNotification({
          type: 'warning',
          title: 'Lecteur RFID hors ligne',
          message: `Lecteur de la salle ${data.roomName} déconnecté`,
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, dispatch, onRfidEvent]);

  const subscribeToRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('subscribe:room', { roomId });
  }, []);

  const unsubscribeFromRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('unsubscribe:room', { roomId });
  }, []);

  return { socket: socketRef.current, subscribeToRoom, unsubscribeFromRoom };
};
