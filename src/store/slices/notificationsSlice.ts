import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'rfid';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  isRead: boolean;
  createdAt: string;
  rfidEventId?: string;
  studentName?: string;
  roomName?: string;
}

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>>
    ) => {
      const notification: AppNotification = {
        ...action.payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      state.items.unshift(notification);
      state.unreadCount += 1;
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.items.find((n) => n.id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((n) => n.id === action.payload);
      if (index !== -1) {
        if (!state.items[index].isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items.splice(index, 1);
      }
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification, clearAll } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
