'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AdvisorNotificationsPage() {
  const { user, isLoading } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('INFO');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: targetUserId, title, content, type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Échec de l\'envoi');
      }
      setMessage('Notification envoyée');
      setTitle('');
      setContent('');
      setType('INFO');
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
        <div>Veuillez vous connecter en tant que conseiller.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Envoyer une notification</h1>
        {message && (
          <div className="mb-4 text-sm p-3 rounded border bg-white">{message}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
          <div>
            <label className="block text-sm font-medium mb-1">ID du client</label>
            <input
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="UUID utilisateur"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Type</label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="INFO / ALERT / WELCOME..."
                required
              />
            </div>
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
            {submitting ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
