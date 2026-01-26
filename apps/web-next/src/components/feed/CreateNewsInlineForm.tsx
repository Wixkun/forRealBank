'use client';

import { useState } from 'react';

type Props = {
  apiUrl?: string;
  onCreated?: () => void;
};

export function CreateNewsInlineForm({ apiUrl = 'http://localhost:3001/api', onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiUrl}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || "Échec de la création de l'actualité");
        return;
      }

      setMessage('Actualité créée');
      setTitle('');
      setContent('');
      onCreated?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold">Publier une actualité</h3>
      </div>

      {message && <div className="mb-3 text-sm p-3 rounded border bg-white">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contenu</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded px-3 py-2 min-h-30"
            required
            maxLength={2000}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {submitting ? 'Envoi…' : 'Publier'}
        </button>
      </form>
    </div>
  );
}
