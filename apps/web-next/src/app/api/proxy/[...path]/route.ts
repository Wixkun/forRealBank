import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const pathMatch = pathname.match(/\/api\/proxy\/(.+)/);
    if (!pathMatch) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const path = pathMatch[1];
    const searchParams = request.nextUrl.searchParams.toString();
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const fullUrl = `${apiUrl}/${path}${searchParams ? '?' + searchParams : ''}`;

    console.log('[Proxy] GET request to:', fullUrl);

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    console.log('[Proxy] Cookies being sent:', cookieHeader);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      credentials: 'include',
    });

    console.log('[Proxy] Response status:', response.status);

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const pathMatch = pathname.match(/\/api\/proxy\/(.+)/);
    if (!pathMatch) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const path = pathMatch[1];
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const fullUrl = `${apiUrl}/${path}`;

    console.log('[Proxy] POST request to:', fullUrl);

    const body = await request.json();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    );
  }
}
