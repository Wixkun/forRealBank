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
    router.push(
      `/${locale}/dashboard/messages?conversationId=${encodeURIComponent(conversationId)}`,
    );
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-fg-muted">{common('loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-white mb-4">{t('title')}</h1>
      <div className="bg-surface-1 rounded-2xl border border-white/5 p-5 space-y-4">
        <div>
          <label className="block text-xs text-fg-muted mb-2">{t('conversationIdLabel')}</label>
          <input
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/30 text-white border border-white/10 text-sm focus:outline-none focus:border-primary/60"
            placeholder={t('conversationIdPlaceholder')}
          />
        </div>
        <button
          onClick={handleOpen}
          className="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover"
        >
          {t('open')}
        </button>
      </div>
    </div>
  );
}
