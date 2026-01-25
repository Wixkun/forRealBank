import { unstable_cache } from 'next/cache';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ConversationData {
  id: string;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  participants?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
  }>;
  lastMessage?: string;
  lastMessageDate?: string;
  description?: string;
}

export const getCachedConversations = unstable_cache(
  async (userId: string) => {
    if (!userId) {
      return [];
    }

    try {
      const response = await fetch(`${apiUrl}/chat/conversations/by-user/${userId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300, tags: ['conversations'] },
      });

      if (!response.ok) {
        console.error(`Failed to fetch conversations: ${response.status}`, await response.text());
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },
  ['conversations'],
  { revalidate: 300, tags: ['conversations'] },
);

export const getCachedAdvisor = unstable_cache(
  async (clientId: string) => {
    if (!clientId) {
      return null;
    }

    try {
      const response = await fetch(`${apiUrl}/chat/client/${clientId}/advisor`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 600, tags: ['advisor'] },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching advisor:', error);
      return null;
    }
  },
  ['advisor'],
  { revalidate: 600, tags: ['advisor'] },
);

export const getCachedAdvisorClients = unstable_cache(
  async (advisorId: string) => {
    if (!advisorId) {
      return [];
    }

    try {
      const response = await fetch(`${apiUrl}/chat/advisor/${advisorId}/clients`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 600, tags: ['advisor-clients'] },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching advisor clients:', error);
      return [];
    }
  },
  ['advisor-clients'],
  { revalidate: 600, tags: ['advisor-clients'] },
);

export const getCachedUsersByRole = unstable_cache(
  async (role: 'CLIENT' | 'ADVISOR' | 'DIRECTOR') => {
    try {
      const response = await fetch(`${apiUrl}/chat/users/by-role/${role}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 1800, tags: ['users-by-role'] },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      return [];
    }
  },
  ['users-by-role'],
  { revalidate: 1800, tags: ['users-by-role'] },
);
