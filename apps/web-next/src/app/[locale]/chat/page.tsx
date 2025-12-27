'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PrivateConversation from '@/components/chat/PrivateConversation';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [advisorName, setAdvisorName] = useState<string>('Votre conseiller');
  const [advisorRole, setAdvisorRole] = useState<string>('Conseiller financier');
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(true);

  const conversationId = searchParams.get('conversationId') || '';
  const advisorId = searchParams.get('advisorId') || '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchAdvisor = async () => {
      if (!advisorId) {
        setAdvisorLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/users/${advisorId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const advisor = await response.json();
          setAdvisorName(`${advisor.firstName} ${advisor.lastName}`);
          setAdvisorRole(advisor.role || 'Conseiller financier');
        }
      } catch (error) {
        console.error('Error fetching advisor:', error);
      } finally {
        setAdvisorLoading(false);
      }
    };

    fetchAdvisor();
  }, [advisorId, apiUrl]);

  useEffect(() => {
    const autoOpenFirstConversation = async () => {
      if (!user || conversationId) return;
      try {
        const res = await fetch(`${apiUrl}/chat/conversations/by-user/${user.id}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const list = await res.json();
          const first = Array.isArray(list) && list.length > 0 ? list[0].id : '';
          if (first) {
            const url = new URL(window.location.href);
            url.searchParams.set('conversationId', first);
            router.replace(url.pathname + '?' + url.searchParams.toString());
          }
        }
      } catch {
        // swallow
      }
    };
    autoOpenFirstConversation();
  }, [user, conversationId, apiUrl, router]);

  if (isLoading || advisorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos conversations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-700">Veuillez vous connecter pour accéder à la messagerie.</div>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune conversation</h3>
          <p className="mt-1 text-sm text-gray-500">Aucune conversation trouvée pour votre compte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messagerie</h1>
          <p className="mt-2 text-sm text-gray-600">
            Discutez avec votre conseiller financier
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <PrivateConversation 
            conversationId={conversationId}
            userId={user.id}
            advisorName={advisorName}
            advisorRole={advisorRole}
          />
        </div>
      </div>
    </div>
  );
}
