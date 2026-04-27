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

export function useNotifications({
  userId,
  apiUrl = '/api',
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMarkAllLoading, setIsMarkAllLoading] = useState(false);

  type NotificationsSSEPayload = Notification[] | { data: Notification[] };

  const { isConnected } = useSSE<NotificationsSSEPayload>({
    url: `${apiUrl}/notifications/stream/${userId}`,
    onMessage: (payload) => {
      const arr = Array.isArray(payload)
        ? payload
        : (payload as { data?: Notification[] })?.data ?? [];
      setNotifications(arr);
    },
    withCredentials: true,
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${apiUrl}/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setIsMarkAllLoading(true);
    try {
      await fetch(`${apiUrl}/notifications/user/${userId}/read-all`, {
        method: 'POST',
        credentials: 'include',
      });
      const nowIso = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: nowIso })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setIsMarkAllLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    isMarkAllLoading,
  };
}
