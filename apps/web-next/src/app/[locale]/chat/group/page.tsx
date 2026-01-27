'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GroupConversation from '@/components/chat/GroupConversation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';

export default function GroupChatPage() {
  const t = useTranslations('chat.group');
  const chatT = useTranslations('chat');

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const autoLoadAttemptedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string; role: string }>
  >([]);
  const conversationId = searchParams.get('conversationId') || '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (conversationId || !user || autoLoadAttemptedRef.current) return;

    autoLoadAttemptedRef.current = true;

    const autoLoadFirstGroup = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/chat/conversations/group/by-user/${user.id}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const list = await res.json();
          const first = Array.isArray(list) && list.length > 0 ? list[0].id : '';
          if (first) {
            router.push(`?conversationId=${first}`);
          }
        }
      } catch (error) {
        console.error('Failed to auto-load group conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    autoLoadFirstGroup();
  }, [user, conversationId, apiUrl, router]);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!conversationId) return;
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/chat/conversations/${conversationId}/participants`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setParticipants(Array.isArray(data) ? data : []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadParticipants();
  }, [conversationId, apiUrl]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-700">{chatT('loginRequired')}</div>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('empty.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ height: 'calc(100vh - 200px)' }}
        >
          <GroupConversation
            conversationId={conversationId}
            userId={user.id}
            participants={participants}
          />
        </div>
      </div>
    </div>
  );
}
