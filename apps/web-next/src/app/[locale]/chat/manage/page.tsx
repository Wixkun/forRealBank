'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';

export default function ChatManagePage() {
  const { user, isLoading } = useAuth();
  const t = useTranslations('chat.manage');
  const common = useTranslations('common');

  const [conversationId, setConversationId] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const handleOpen = () => {
    if (!conversationId) return;
    router.push(`/${locale}/chat?conversationId=${encodeURIComponent(conversationId)}`);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>{common('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">{t('title')}</h1>
        <div className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('conversationIdLabel')}</label>
            <input
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder={t('conversationIdPlaceholder')}
            />
          </div>
          <button
            onClick={handleOpen}
            className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
          >
            {t('open')}
          </button>
        </div>
      </div>
    </div>
  );
}
