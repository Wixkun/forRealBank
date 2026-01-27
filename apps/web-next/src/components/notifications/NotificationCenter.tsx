'use client';

import { useMemo, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useLocale, useTranslations } from 'next-intl';

interface NotificationCenterProps {
  userId: string;
  apiUrl?: string;
}

export function NotificationCenter({ userId, apiUrl }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, isMarkAllLoading } =
    useNotifications({
      userId,
      apiUrl,
    });
  const t = useTranslations('notifications');
  const locale = useLocale();

  const { unreadNotifications } = useMemo(() => {
    const unread: typeof notifications = [];

    for (const n of notifications) {
      if (!n.readAt) unread.push(n);
    }

    return { unreadNotifications: unread };
  }, [notifications]);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label={t('ariaLabel')}
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">{t('title')}</h3>
                <p className="text-sm text-gray-500">{t('unreadCount', { count: unreadCount })}</p>
              </div>

              <button
                type="button"
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0 || isMarkAllLoading}
                className={
                  'text-sm px-3 py-1 rounded border transition ' +
                  (unreadCount === 0 || isMarkAllLoading
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50')
                }
              >
                {isMarkAllLoading ? t('markAllLoading') : t('markAllRead')}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500">{t('empty')}</div>
            )}

            {notifications.length > 0 && unreadNotifications.length === 0 && (
              <div className="p-8 text-center text-gray-500">{t('emptyUnread')}</div>
            )}

            {unreadNotifications.length > 0 && (
              <>
                {unreadNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id)}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer transition bg-blue-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{notif.title}</h4>
                        <p className="text-sm text-gray-700 mb-2">{notif.content}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-200 rounded">{notif.type}</span>
                          <span>
                            {new Date(notif.createdAt).toLocaleString(locale, {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
