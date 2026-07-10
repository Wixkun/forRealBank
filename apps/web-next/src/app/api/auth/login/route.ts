import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:3001/api';
    const fullUrl = `${apiUrl}/auth/login`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Invalid JSON response' };
    }

    const setCookieHeader = response.headers.get('set-cookie');
    const res = NextResponse.json(data, { status: response.status });

    if (setCookieHeader) {
      res.headers.set('set-cookie', setCookieHeader);
    }

    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
