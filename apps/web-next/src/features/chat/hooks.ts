import { useEffect, useState } from 'react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

export function useClientAdvisor(clientId: string | undefined) {
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
        setError(
          err instanceof Error ? err.message : 'Impossible de récupérer le conseiller'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvisor();
  }, [clientId]);

  return { advisor, isLoading, error };
}

export function useAdvisorClients(advisorId: string | undefined) {
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
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de récupérer vos clients'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [advisorId]);

  return { clients, isLoading, error };
}

export function useUsersByRole(role: 'CLIENT' | 'ADVISOR' | 'DIRECTOR' | null) {
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
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de récupérer les utilisateurs'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [role]);

  return { users, isLoading, error };
}
