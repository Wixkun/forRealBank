import { NextRequest, NextResponse } from 'next/server';

// Le proxy générique /api/[...path] décode les réponses en texte et corrompt
// le binaire : cette route relaie les images des Actualités en streaming.
// En prod, Traefik route /api directement vers l'API Nest et cette route
// n'est pas sollicitée ; elle sert surtout en dev (Next 3000 → API 3001).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.API_URL || 'http://localhost:3001/api';

  const upstream = await fetch(`${apiUrl}/news/files/${encodeURIComponent(id)}`);

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Not found' }, { status: upstream.status || 404 });
  }

  const headers = new Headers();
  for (const name of ['content-type', 'content-length', 'content-disposition', 'cache-control']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
