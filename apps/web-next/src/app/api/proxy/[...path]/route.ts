import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getTargetUrl(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathMatch = pathname.match(/\/api\/proxy\/(.+)/);
  if (!pathMatch) {
    return { error: NextResponse.json({ error: 'Invalid path' }, { status: 400 }) };
  }

  const path = pathMatch[1];
  const searchParams = request.nextUrl.searchParams.toString();
  const apiUrl =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:3001/api';

  const fullUrl = `${apiUrl}/${path}${searchParams ? '?' + searchParams : ''}`;
  return { fullUrl };
}

function mergeSetCookieHeaders(from: Response, to: Headers) {
  // Node/undici expose parfois `getSetCookie()`.
  const headersWithGetSetCookie = from.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const getSetCookie = headersWithGetSetCookie.getSetCookie?.bind(from.headers);
  if (typeof getSetCookie === 'function') {
    const values: string[] = getSetCookie();
    values.forEach((v) => to.append('Set-Cookie', v));
    return;
  }

  const single = from.headers.get('set-cookie');
  if (single) {
    // Peut contenir plusieurs cookies. On append tel quel (mieux que rien).
    to.append('Set-Cookie', single);
  }
}

async function proxy(request: NextRequest, method: string) {
  const target = getTargetUrl(request);
  if ('error' in target) return target.error;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const headers: Record<string, string> = {
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  let body: string | undefined;
  // GET/DELETE n'ont généralement pas de body
  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    try {
      const json = await request.json();
      body = JSON.stringify(json);
    } catch {
      // pas de body JSON
    }
  }

  console.log(`[Proxy] ${method} request to:`, target.fullUrl);

  const response = await fetch(target.fullUrl, {
    method,
    headers,
    ...(body ? { body } : {}),
    credentials: 'include',
  });

  // Pas tous les endpoints renvoient du JSON (ex: 204)
  const contentType = response.headers.get('content-type') ?? '';

  if (response.status === 204) {
    const res = new NextResponse(null, { status: 204 });
    mergeSetCookieHeaders(response, res.headers);
    return res;
  }

  if (contentType.includes('application/json')) {
    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });
    mergeSetCookieHeaders(response, res.headers);
    return res;
  }

  const text = await response.text();
  const res = new NextResponse(text, {
    status: response.status,
    headers: { 'Content-Type': contentType || 'text/plain; charset=utf-8' },
  });
  mergeSetCookieHeaders(response, res.headers);
  return res;
}

export async function GET(request: NextRequest) {
  try {
    return await proxy(request, 'GET');
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await proxy(request, 'POST');
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return await proxy(request, 'PATCH');
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await proxy(request, 'DELETE');
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 },
    );
  }
}
