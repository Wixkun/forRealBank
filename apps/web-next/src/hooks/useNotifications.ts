'use client';

import { useState } from 'react';
import { useSSE } from './useSSE';

interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  readAt: string | null;
}

interface UseNotificationsOptions {
  userId: string;
  apiUrl?: string;
}

export function useNotifications({ userId, apiUrl = 'http://localhost:3001/api' }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { isConnected } = useSSE<Notification[]>({
    url: `${apiUrl}/notifications/stream/${userId}`,
    onMessage: (newData) => {
      setNotifications(newData);
    },
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${apiUrl}/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
  };
}
