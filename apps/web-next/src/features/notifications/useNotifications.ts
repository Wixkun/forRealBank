'use client';

import { useState, useEffect, useCallback } from 'react';
import { onChatEvent } from '@/features/chat/chat-events';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  targetType: string | null;
  targetId: string | null;
  targetUrl: string | null;
  groupKey: string | null;
  oldestUnreadMessageId: string | null;
  unreadCount: number;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseNotificationsOptions {
  apiUrl?: string;
  pollingInterval?: number;
}

export function useNotifications({
  apiUrl = '/api',
  pollingInterval = 10000,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMarkAllLoading, setIsMarkAllLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/notifications`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently fail for background polling
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, pollingInterval);
    return () => clearInterval(intervalId);
  }, [fetchNotifications, pollingInterval]);

  // Rafraîchit immédiatement le compteur quand une conversation est lue ou
  // que des notifications ont été marquées lues côté serveur (ex. détail
  // d'une news / d'un virement consulté).
  useEffect(() => {
    const offRead = onChatEvent('chat:read', () => {
      void fetchNotifications();
    });
    const offNotif = onChatEvent('notifications:read', () => {
      void fetchNotifications();
    });
    return () => {
      offRead();
      offNotif();
    };
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${apiUrl}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        ),
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setIsMarkAllLoading(true);
    try {
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const nowIso = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: nowIso })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setIsMarkAllLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`${apiUrl}/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isMarkAllLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
