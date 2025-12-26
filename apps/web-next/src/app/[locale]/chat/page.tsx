'use client';

import { useEffect, useState } from 'react';
import PrivateConversation from '@/components/chat/PrivateConversation';

export default function ChatPage() {
  const [userId, setUserId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [advisorName, setAdvisorName] = useState<string>('');
  const [advisorRole, setAdvisorRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndConversation = async () => {
      try {
        const mockUserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';  
        const mockConversationId = '11111111-1111-1111-1111-111111111111'; 
        
        setUserId(mockUserId);
        setConversationId(mockConversationId);
        
        try {
          const advisorId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; 
          const response = await fetch(`http://localhost:3001/api/users/${advisorId}`);
          if (response.ok) {
            const advisor = await response.json();
            setAdvisorName(`${advisor.firstName} ${advisor.lastName}`);
            setAdvisorRole('Conseiller financier');
          } else {
            setAdvisorName('Votre conseiller');
            setAdvisorRole('Conseiller financier');
          }
        } catch (error) {
          console.error('Error fetching advisor:', error);
          setAdvisorName('Votre conseiller');
          setAdvisorRole('Conseiller financier');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndConversation();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos conversations...</p>
        </div>
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
          <p className="mt-1 text-sm text-gray-500">Vous n&apos;avez pas encore de conseiller assigné.</p>
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
            userId={userId}
            advisorName={advisorName}
            advisorRole={advisorRole}
          />
        </div>
      </div>
    </div>
  );
}
