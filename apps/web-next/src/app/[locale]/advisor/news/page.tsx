'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdvisorNewsPage() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const locale = useMemo(() => pathname.split('/')[1] || 'en', [pathname]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const canPublish =
    !!user &&
    Array.isArray(user.roles) &&
    (user.roles.includes('ADVISOR') || user.roles.includes('DIRECTOR'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ authorId: user.id, title, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Échec de la création de l'actualité");
      }
      setMessage('Actualité créée avec succès');
      setTitle('');
      setContent('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
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
        <div>Veuillez vous connecter en tant que conseiller ou directeur.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-semibold">Actualités</h1>
          {canPublish && (
            <Link
              href={`/${locale}/advisor/news/create`}
              className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
            >
              Créer une actualité
            </Link>
          )}
        </div>

        {message && <div className="mb-4 text-sm p-3 rounded border bg-white">{message}</div>}

        {canPublish ? (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contenu</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Publier'}
            </button>
          </form>
        ) : (
          <div className="bg-white p-4 rounded shadow">
            Accès en lecture seule. (Rôle conseiller requis pour publier.)
          </div>
        )}
      </div>
    </div>
  );
}
