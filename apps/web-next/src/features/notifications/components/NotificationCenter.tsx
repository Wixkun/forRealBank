'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, type Notification } from '@/features/notifications/useNotifications';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';

interface NotificationCenterProps {
  userId?: string;
  apiUrl?: string;
}

export function NotificationCenter({ apiUrl }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkAllLoading,
  } = useNotifications({ apiUrl });
  const t = useTranslations('notifications');
  const locale = useLocale();
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const { unreadNotifications } = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead);
    return { unreadNotifications: unread };
  }, [notifications]);

  // Les targetUrl sont stockées sans préfixe de locale côté backend
  const localize = (url: string) => (url.startsWith('/') ? `/${locale}${url}` : url);

  // Résout la cible de navigation selon le type de notification :
  // - NEWS (virements, transactions, actualités) → popup de détail via ?newsId=
  // - CONVERSATION / MESSAGE → la conversation concernée
  // - anciens liens (/accounts, page inexistante) et types inconnus → fallback propre
  const resolveTarget = (notif: Notification): string | null => {
    switch (notif.targetType) {
      case 'NEWS':
        if (notif.targetId) return `/${locale}/dashboard?newsId=${notif.targetId}`;
        return notif.targetUrl ? localize(notif.targetUrl) : null;
      case 'CONVERSATION':
      case 'MESSAGE':
        return notif.targetUrl ? localize(notif.targetUrl) : `/${locale}/dashboard/messages`;
      case 'TRANSACTION':
      case 'PAYMENT':
      case 'ACCOUNT':
        return notif.targetUrl && notif.targetUrl !== '/accounts'
          ? localize(notif.targetUrl)
          : `/${locale}/dashboard`;
      default:
        return notif.targetUrl ? localize(notif.targetUrl) : null;
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    const target = resolveTarget(notif);
    setIsOpen(false);
    if (target) router.push(target);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition ${
          currentTheme === 'dark' ? 'hover:bg-hover' : 'hover:bg-gray-100'
        }`}
        aria-label={t('ariaLabel')}
      >
        <svg
          className={`w-6 h-6 ${currentTheme === 'dark' ? 'text-fg-secondary' : 'text-gray-700'}`}
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
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-96 rounded-lg shadow-xl border z-50 ${
            currentTheme === 'dark' ? 'bg-surface-1 border-edge-strong' : 'bg-white border-gray-200'
          }`}
        >
          <div
            className={`p-4 border-b ${currentTheme === 'dark' ? 'border-edge-strong' : 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  className={`font-semibold text-lg ${currentTheme === 'dark' ? 'text-fg' : 'text-gray-900'}`}
                >
                  {t('title')}
                </h3>
                <p
                  className={`text-sm ${currentTheme === 'dark' ? 'text-fg-muted' : 'text-gray-500'}`}
                >
                  {t('unreadCount', { count: unreadCount })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0 || isMarkAllLoading}
                className={
                  `text-sm px-3 py-1 rounded border transition ` +
                  (unreadCount === 0 || isMarkAllLoading
                    ? currentTheme === 'dark'
                      ? 'text-fg-subtle border-edge-strong cursor-not-allowed'
                      : 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : currentTheme === 'dark'
                      ? 'text-tertiary border-primary/30 hover:bg-primary/10'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50')
                }
              >
                {isMarkAllLoading ? t('markAllLoading') : t('markAllRead')}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <div
                className={`p-8 text-center ${currentTheme === 'dark' ? 'text-fg-muted' : 'text-gray-500'}`}
              >
                {t('empty')}
              </div>
            )}
            {notifications.length > 0 && unreadNotifications.length === 0 && (
              <div
                className={`p-8 text-center ${currentTheme === 'dark' ? 'text-fg-muted' : 'text-gray-500'}`}
              >
                {t('emptyUnread')}
              </div>
            )}
            {unreadNotifications.length > 0 && (
              <>
                {unreadNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group p-4 border-b cursor-pointer transition ${
                      currentTheme === 'dark'
                        ? 'border-edge-strong hover:bg-hover bg-primary/10'
                        : 'border-gray-200 hover:bg-gray-50 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4
                          className={`font-semibold text-sm mb-1 ${currentTheme === 'dark' ? 'text-fg' : 'text-gray-900'}`}
                        >
                          {notif.title}
                          {notif.unreadCount > 1 && (
                            <span
                              className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                                currentTheme === 'dark'
                                  ? 'bg-secondary/25 text-cyan-300'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {notif.unreadCount}
                            </span>
                          )}
                        </h4>
                        <p
                          className={`text-sm mb-2 ${currentTheme === 'dark' ? 'text-fg-secondary' : 'text-gray-700'}`}
                        >
                          {notif.content}
                        </p>
                        <div
                          className={`flex items-center gap-2 text-xs ${currentTheme === 'dark' ? 'text-fg-muted' : 'text-gray-500'}`}
                        >
                          <span
                            className={`px-2 py-1 rounded ${currentTheme === 'dark' ? 'bg-hover-strong text-fg-secondary' : 'bg-gray-200'}`}
                          >
                            {notif.type}
                          </span>
                          <span>
                            {new Date(notif.updatedAt ?? notif.createdAt).toLocaleString(locale, {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1 ${currentTheme === 'dark' ? 'bg-tertiary' : 'bg-blue-500'}`}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className={`text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition ${
                            currentTheme === 'dark'
                              ? 'hover:bg-hover-strong text-fg-muted hover:text-fg-secondary'
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
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
