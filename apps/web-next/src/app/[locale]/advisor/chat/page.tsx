'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdvisorChatOpenPage() {
  const { user, isLoading } = useAuth();
  const [conversationId, setConversationId] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const handleOpen = () => {
    if (!conversationId) return;
    router.push(`/${locale}/chat?conversationId=${encodeURIComponent(conversationId)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Veuillez vous connecter en tant que conseiller.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Ouvrir une conversation client</h1>
        <div className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID de la conversation</label>
            <input
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="UUID de la conversation"
            />
          </div>
          <button
            onClick={handleOpen}
            className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
          >
            Ouvrir
          </button>
        </div>
      </div>
    </div>
  );
}
