'use client';

import { useMemo, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';
import { useContacts, usePresence } from '@/features/chat/hooks';

interface UserDirectoryPanelProps {
  onOpenContact: (targetUserId: string) => void | Promise<void>;
  isOpening: boolean;
}

function initialsOf(firstName: string, lastName: string): string {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '?';
}

/**
 * Annuaire « Clients et conseillers » : liste des interlocuteurs autorisés
 * (filtrés par rôle CÔTÉ SERVEUR), recherche temps réel debouncée, statut de
 * présence fiable (sockets authentifiés) et ouverture / réouverture de la
 * conversation privée au clic sur la ligne.
 */
export default function UserDirectoryPanel({ onOpenContact, isOpening }: UserDirectoryPanelProps) {
  const { theme } = useTheme();
  const t = useTranslations('chat.directory');
  const tRoles = useTranslations('chat.roles');
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const { contacts, isLoading, error } = useContacts(search);
  const online = usePresence(useMemo(() => contacts.map((c) => c.id), [contacts]));

  const roleLabel = (role: string) => {
    switch (role) {
      case 'CLIENT':
      case 'ADVISOR':
      case 'DIRECTOR':
      case 'ADMIN':
        return tRoles(role);
      default:
        return role;
    }
  };

  return (
    <div className={`flex h-full min-h-0 flex-col ${isDark ? 'bg-surface-1' : 'bg-white'}`}>
      <div className={`p-4 border-b ${isDark ? 'border-edge' : 'border-gray-200'}`}>
        <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-fg' : 'text-gray-900'}`}>
          {t('title')}
        </h2>
        <div className="relative">
          <svg
            className={`absolute left-3 top-2.5 h-4 w-4 ${isDark ? 'text-fg-muted' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
              isDark
                ? 'border-edge-strong bg-surface-2 text-fg placeholder:text-fg-subtle'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : error ? (
          <p className={`p-4 text-sm ${isDark ? 'text-danger' : 'text-red-600'}`}>{t('error')}</p>
        ) : contacts.length === 0 ? (
          <p className={`p-4 text-sm ${isDark ? 'text-fg-muted' : 'text-gray-500'}`}>
            {search.trim() ? t('emptySearch') : t('empty')}
          </p>
        ) : (
          <ul className={`divide-y ${isDark ? 'divide-edge' : 'divide-gray-100'}`}>
            {contacts.map((contact) => {
              const isOnline = online[contact.id] ?? false;
              return (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => void onOpenContact(contact.id)}
                    disabled={isOpening}
                    title={t('open')}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset ${
                      isDark ? 'hover:bg-hover' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="relative shrink-0">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-1 ring-white/10">
                        {initialsOf(contact.firstName, contact.lastName)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ${
                          isDark ? 'ring-surface-1' : 'ring-white'
                        } ${isOnline ? 'bg-tertiary' : 'bg-fg-subtle'}`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-medium ${
                          isDark ? 'text-fg' : 'text-gray-900'
                        }`}
                      >
                        {contact.firstName} {contact.lastName}
                      </span>
                      <span
                        className={`block truncate text-xs ${
                          isDark ? 'text-fg-muted' : 'text-gray-500'
                        }`}
                      >
                        {roleLabel(contact.role)}
                        {' · '}
                        {isOnline ? t('online') : t('offline')}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
