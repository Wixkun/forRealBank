'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSSE } from '@/hooks/useSSE';
import Link from 'next/link';

interface NewsItem {
  id: string;
  authorId: string | null;
  title: string;
  content: string;
  createdAt: string;
}

interface NewsFeedProps {
  apiUrl?: string;
  locale?: string;
  userRoles?: string[] | null;
}

export default function NewsFeed({
  apiUrl = 'http://localhost:3001/api',
  locale = 'en',
  userRoles = null,
}: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);

  const canPublish = useMemo(() => {
    if (!userRoles || !Array.isArray(userRoles)) return false;
    return userRoles.includes('ADVISOR') || userRoles.includes('DIRECTOR');
  }, [userRoles]);

  type NewsSSEPayload = NewsItem[] | { data: NewsItem[] };

  const { isConnected } = useSSE<NewsSSEPayload>({
    url: `${apiUrl}/news/stream`,
    onMessage: (payload) => {
      const arr = Array.isArray(payload)
        ? payload
        : ((payload as { data?: NewsItem[] })?.data ?? []);
      setNews(arr as NewsItem[]);
    },
  });

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await fetch(`${apiUrl}/news`);
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error('Failed to load news:', err);
      }
    };
    loadNews();
  }, [apiUrl]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Actualités de la banque</h2>
        <div className="flex items-center gap-3">
          {canPublish && (
            <Link
              href={`/${locale}/advisor/news/create`}
              className="px-3 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 text-sm"
            >
              Créer une actualité
            </Link>
          )}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Connecté' : 'Déconnecté'}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? 'En temps réel' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {news.length === 0 && (
          <div className="text-center py-12 text-gray-500">Aucune actualité pour le moment</div>
        )}
        {news.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-700 mb-4">{item.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    📅{' '}
                    {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>
                    🕐{' '}
                    {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
