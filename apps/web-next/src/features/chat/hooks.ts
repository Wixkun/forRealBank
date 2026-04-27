import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const API_URL = '/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

export function useClientAdvisor(clientId: string | undefined) {
  const t = useTranslations('chat.errors');

  const [advisor, setAdvisor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const fetchAdvisor = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/chat/client/${clientId}/advisor`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setAdvisor(data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('fetchAdvisor'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvisor();
  }, [clientId, t]);

  return { advisor, isLoading, error };
}

export function useAdvisorClients(advisorId: string | undefined) {
  const t = useTranslations('chat.errors');

  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!advisorId) return;

    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/chat/advisor/${advisorId}/clients`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('fetchClients'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [advisorId, t]);

  return { clients, isLoading, error };
}

export function useUsersByRole(role: 'CLIENT' | 'ADVISOR' | 'DIRECTOR' | null) {
  const t = useTranslations('chat.errors');

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/chat/users/by-role/${role}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('fetchUsers'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [role, t]);

  return { users, isLoading, error };
}
