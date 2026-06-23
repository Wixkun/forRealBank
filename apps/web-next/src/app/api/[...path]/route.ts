import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function proxy(request: NextRequest, method: string) {
  const pathname = request.nextUrl.pathname;
  const apiPath = pathname.replace(/^\/api\//, '');
  const searchParams = request.nextUrl.searchParams.toString();

  const apiUrl = process.env.API_URL || 'http://localhost:3001/api';
  const fullUrl = `${apiUrl}/${apiPath}${searchParams ? '?' + searchParams : ''}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const headers: Record<string, string> = {
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    try {
      const json = await request.json();
      body = JSON.stringify(json);
    } catch {
      // no body
    }
  }

  const response = await fetch(fullUrl, {
    method,
    headers,
    ...(body ? { body } : {}),
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { 'Content-Type': contentType || 'text/plain; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  try {
    return await proxy(request, 'GET');
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await proxy(request, 'POST');
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return await proxy(request, 'PATCH');
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await proxy(request, 'PUT');
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await proxy(request, 'DELETE');
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
