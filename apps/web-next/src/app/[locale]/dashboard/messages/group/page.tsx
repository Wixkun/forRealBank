'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GroupConversation from '@/features/chat/components/GroupConversation';
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
  const apiUrl = '/api';

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-fg-muted">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-fg-muted">{chatT('loginRequired')}</div>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-fg-muted"
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
          <h3 className="mt-2 text-sm font-medium text-white">{t('empty.title')}</h3>
          <p className="mt-1 text-sm text-fg-muted">{t('empty.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">{t('title')}</h1>
        <p className="text-sm text-fg-muted">{t('subtitle')}</p>
      </div>

      <div
        className="bg-surface-1 rounded-2xl border border-white/5 overflow-hidden"
        style={{ height: 'calc(100vh - 260px)' }}
      >
        <GroupConversation
          conversationId={conversationId}
          userId={user.id}
          participants={participants}
        />
      </div>
    </div>
  );
}
