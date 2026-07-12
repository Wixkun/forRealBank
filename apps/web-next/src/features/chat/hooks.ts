import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const API_URL = '/api';
const SEARCH_DEBOUNCE_MS = 300;

export interface ContactUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Annuaire des interlocuteurs autorisés pour l'utilisateur connecté.
 * Le filtrage par rôle (advisor → ses clients, client → son conseiller,
 * director → clients + conseillers) et la recherche sont faits CÔTÉ SERVEUR
 * (`GET /chat/contacts?search=`) ; le hook se contente d'un debounce.
 */
export function useContacts(search: string) {
  const t = useTranslations('chat.errors');

  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchContacts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const term = search.trim();
        if (term) params.set('search', term);
        const qs = params.toString();
        const res = await fetch(`${API_URL}/chat/contacts${qs ? `?${qs}` : ''}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('fetchUsers'));
          setContacts([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void fetchContacts(), SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search, t]);

  return { contacts, isLoading, error };
}

/**
 * Présence (en ligne / hors ligne) d'un ensemble d'utilisateurs, depuis la
 * source fiable du backend (sockets authentifiés du cluster), avec
 * rafraîchissement périodique — même mécanisme que l'en-tête de conversation.
 */
export function usePresence(userIds: string[]) {
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const key = userIds.slice().sort().join(',');

  useEffect(() => {
    if (!key) {
      setOnline({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/chat/presence?userIds=${encodeURIComponent(key)}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && typeof data === 'object') {
          setOnline(data as Record<string, boolean>);
        }
      } catch {
        // Repli silencieux : le prochain tick réessaiera.
      }
    };
    void load();
    const intervalId = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [key]);

  return online;
}
