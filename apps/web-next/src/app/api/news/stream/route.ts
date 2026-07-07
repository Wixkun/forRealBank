import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const apiUrl = process.env.API_URL || 'http://localhost:3001/api';

  const upstream = await fetch(`${apiUrl}/news/stream`, {
    headers: {
      Accept: 'text/event-stream',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
